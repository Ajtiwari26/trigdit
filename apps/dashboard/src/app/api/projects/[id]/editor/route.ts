import { auth } from '@/auth';
import { getProjectById, getProjectSchema, getProjectContent, saveProjectContent } from '@/lib/db';
import { triggerVercelDeployment } from '@/lib/services/vercel';
import { triggerNetlifyBuild } from '@/lib/services/netlify';
import { getFileContent, commitFileContent } from '@/lib/services/github';

export const GET = auth(async (req, { params }) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = (await params) as { id: string };
  const userId = req.auth.user.id;

  try {
    const project = await getProjectById(id, userId);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch schema and content directly from MongoDB
    const schema = await getProjectSchema(id);
    const content = await getProjectContent(id) || {};

    return Response.json({
      project,
      schema,
      content,
    });
  } catch (error: any) {
    console.error('Editor load error:', error);
    return Response.json({ error: error.message || 'Failed to load project editor data' }, { status: 500 });
  }
});

export const POST = auth(async (req, { params }) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = (await params) as { id: string };
  const userId = req.auth.user.id;

  try {
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return Response.json({ error: 'Content data is required' }, { status: 400 });
    }

    const project = await getProjectById(id, userId);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // 1. Save updated content directly to MongoDB
    await saveProjectContent(id, content);

    // 2. Commit update to Github if configured
    const [owner, repoName] = project.repoName?.split('/') || [];
    const accessToken = (req.auth as any)?.accessToken;
    if (owner && repoName && accessToken) {
      const contentPath = 'data/content.json';
      const contentString = JSON.stringify(content, null, 2);
      
      try {
        const contentFile = await getFileContent(userId, owner, repoName, contentPath, project.branch, accessToken);
        const sha = contentFile?.sha;

        await commitFileContent(
          userId,
          owner,
          repoName,
          contentPath,
          contentString,
          'chore(trigdit): update content via visual editor',
          project.branch,
          sha,
          accessToken
        );
      } catch (gitErr: any) {
        console.error('Failed to commit content to GitHub:', gitErr.message);
      }
    }

    // 3. Trigger rebuild/revalidation on hosting platform
    let deployResult = null;
    if (project.hostingProvider === 'vercel' && project.vercelProjectName) {
      try {
        deployResult = await triggerVercelDeployment(userId, project.vercelProjectName, project.branch);
      } catch (err: any) {
        console.error('Failed to trigger Vercel deployment:', err.message);
      }
    } else if (project.hostingProvider === 'netlify' && project.netlifySiteId) {
      try {
        await triggerNetlifyBuild(userId, project.netlifySiteId);
        deployResult = { status: 'triggered' };
      } catch (err: any) {
        console.error('Failed to trigger Netlify deployment:', err.message);
      }
    }

    // 3. Trigger Next.js revalidation endpoint on user's live site (Incremental Static Revalidation)
    // We try to trigger '/api/revalidate' if they have set it up
    try {
      const liveUrl = project.hostingProvider === 'vercel' && project.vercelProjectName
        ? `https://${project.vercelProjectName}.vercel.app`
        : project.hostingProvider === 'netlify' && project.netlifySiteName
          ? `https://${project.netlifySiteName}.netlify.app`
          : null;

      if (liveUrl) {
        // Trigger background ISR revalidation fetch
        fetch(`${liveUrl}/api/revalidate?path=/`, { method: 'POST' }).catch(() => {});
      }
    } catch (revalErr) {
      console.warn('Revalidation webhook failed to trigger:', revalErr);
    }

    return Response.json({
      success: true,
      deployment: deployResult,
    });
  } catch (error: any) {
    console.error('Editor save error:', error);
    return Response.json({ error: error.message || 'Failed to save content edits' }, { status: 500 });
  }
});
