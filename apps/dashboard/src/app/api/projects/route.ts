import { auth } from '@/auth';
import { db, projects, eq, and } from '@trigdit/db';
import { createRepoWebhook } from '@/lib/services/github';
import { createVercelProject, triggerVercelDeployment } from '@/lib/services/vercel';
import { createNetlifySite, triggerNetlifyBuild } from '@/lib/services/netlify';

export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = req.auth.user.id;

  try {
    const userProjects = await db.query.projects.findMany({
      where: eq(projects.userId, userId),
    });
    return Response.json(userProjects);
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to list projects' }, { status: 500 });
  }
});

export const POST = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = req.auth.user.id;

  try {
    const body = await req.json();
    const { name, repoName, branch = 'main', framework = 'nextjs', hostingProvider } = body;

    if (!name || !repoName) {
      return Response.json({ error: 'Project name and repository name are required' }, { status: 400 });
    }

    const [repoOrg, repoSimpleName] = repoName.split('/');
    if (!repoOrg || !repoSimpleName) {
      return Response.json({ error: 'Invalid repository name format. Must be owner/name.' }, { status: 400 });
    }

    let vercelProjectId: string | undefined;
    let vercelProjectName: string | undefined;
    let netlifySiteId: string | undefined;
    let netlifySiteName: string | undefined;
    let deploymentUrl: string | undefined;

    // 1. Link Hosting Platform if specified
    if (hostingProvider === 'vercel') {
      try {
        const vercelProj = await createVercelProject(userId, name.toLowerCase().replace(/[^a-z0-9-]/g, '-'), repoOrg, repoSimpleName, framework);
        vercelProjectId = vercelProj.id;
        vercelProjectName = vercelProj.name;

        // Trigger initial Vercel deploy
        const deploy = await triggerVercelDeployment(userId, vercelProj.name, branch);
        deploymentUrl = deploy.url;
      } catch (err: any) {
        console.error('Vercel link error:', err);
        return Response.json({ error: `Failed to link Vercel: ${err.message}` }, { status: 400 });
      }
    } else if (hostingProvider === 'netlify') {
      try {
        const netlifySite = await createNetlifySite(userId, name.toLowerCase().replace(/[^a-z0-9-]/g, '-'), repoOrg, repoSimpleName, branch);
        netlifySiteId = netlifySite.id;
        netlifySiteName = netlifySite.name;
        deploymentUrl = netlifySite.url;

        // Trigger Netlify build
        await triggerNetlifyBuild(userId, netlifySite.id);
      } catch (err: any) {
        console.error('Netlify link error:', err);
        return Response.json({ error: `Failed to link Netlify: ${err.message}` }, { status: 400 });
      }
    }

    // 2. Setup GitHub Webhook
    const appUrl = process.env.NEXTAUTH_URL || 'https://trigdit.com';
    const webhookUrl = `${appUrl}/api/webhooks/github`;
    const webhookSecret = process.env.WEBHOOK_SECRET || 'trigdit-webhook-secret';
    
    try {
      await createRepoWebhook(userId, repoOrg, repoSimpleName, webhookUrl, webhookSecret);
    } catch (err: any) {
      console.warn('GitHub webhook creation failed (might already exist):', err.message);
    }

    // 3. Save to database
    const newProject = await db.insert(projects).values({
      userId,
      name,
      repoName,
      branch,
      framework,
      hostingProvider: hostingProvider || null,
      vercelProjectId: vercelProjectId || null,
      vercelProjectName: vercelProjectName || null,
      netlifySiteId: netlifySiteId || null,
      netlifySiteName: netlifySiteName || null,
    }).returning();

    return Response.json({
      project: newProject[0],
      deploymentUrl,
    });

  } catch (error: any) {
    console.error('Project creation failed:', error);
    return Response.json({ error: error.message || 'Failed to create project' }, { status: 500 });
  }
});
