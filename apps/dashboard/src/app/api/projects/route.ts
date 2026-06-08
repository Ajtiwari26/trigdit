import { auth } from '@/auth';
import { getProjects, createProject, saveProjectSchema, saveProjectContent } from '@/lib/db';
import { createRepoWebhook, getFileContent, scanAndGenerateSchema } from '@/lib/services/github';
import { createVercelProject, triggerVercelDeployment } from '@/lib/services/vercel';
import { createNetlifySite, triggerNetlifyBuild } from '@/lib/services/netlify';

export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = req.auth.user.id;

  try {
    const userProjects = await getProjects(userId);
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

    const accessToken = (req.auth as any)?.accessToken;

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
      await createRepoWebhook(userId, repoOrg, repoSimpleName, webhookUrl, webhookSecret, accessToken);
    } catch (err: any) {
      console.warn('GitHub webhook creation failed (might already exist):', err.message);
    }

    // 3. Scan codebase for schema & content, or load from GitHub if already present
    let schemaData: any;
    let contentData: any;

    try {
      const existingSchemaFile = await getFileContent(userId, repoOrg, repoSimpleName, 'trigdit.schema.json', branch, accessToken);
      if (existingSchemaFile) {
        schemaData = JSON.parse(existingSchemaFile.content);
        const existingContentFile = await getFileContent(userId, repoOrg, repoSimpleName, 'data/content.json', branch, accessToken);
        contentData = existingContentFile ? JSON.parse(existingContentFile.content) : { '/': {} };
      } else {
        const scanResult = await scanAndGenerateSchema(userId, repoOrg, repoSimpleName, branch, accessToken);
        schemaData = scanResult.schema;
        contentData = scanResult.content;
      }
    } catch (err) {
      console.warn('Auto-scanning failed, using default schema:', err);
      schemaData = {
        version: '1.0',
        pages: [{ path: '/', name: 'Home Page', sections: [] }]
      };
      contentData = { '/': {} };
    }

    // 4. Save metadata to MongoDB
    const projectId = 'proj_' + Math.random().toString(36).substring(2, 11);
    const newProject = await createProject({
      id: projectId,
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
    });

    // 5. Store schema and initial content mapping in MongoDB collections
    await saveProjectSchema(projectId, schemaData);
    await saveProjectContent(projectId, contentData);

    return Response.json({
      project: newProject,
      deploymentUrl,
    });

  } catch (error: any) {
    console.error('Project creation failed:', error);
    return Response.json({ error: error.message || 'Failed to create project' }, { status: 500 });
  }
});
