import { auth } from '@/auth';
import { db, projects, eq, and } from '@trigdit/db';
import { getFileContent, commitFileContent } from '@/lib/services/github';
import { triggerVercelDeployment } from '@/lib/services/vercel';
import { triggerNetlifyBuild } from '@/lib/services/netlify';

export const GET = auth(async (req, { params }) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params as { id: string };
  const userId = req.auth.user.id;

  try {
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, id),
        eq(projects.userId, userId)
      ),
    });

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const [owner, repoName] = project.repoName?.split('/') || [];
    if (!owner || !repoName) {
      return Response.json({ error: 'GitHub repository not configured correctly' }, { status: 400 });
    }

    const accessToken = (req.auth as any)?.accessToken;
    // Fetch schema and content from Github
    const schemaFile = await getFileContent(userId, owner, repoName, project.schemaPath, project.branch, accessToken);
    const contentFile = await getFileContent(userId, owner, repoName, project.contentPath, project.branch, accessToken);

    let parsedSchema = null;
    if (schemaFile) {
      try {
        parsedSchema = JSON.parse(schemaFile.content);
      } catch (err) {
        console.warn('Failed to parse schema.json from repo:', err);
      }
    }

    let parsedContent = {};
    if (contentFile) {
      try {
        parsedContent = JSON.parse(contentFile.content);
      } catch (err) {
        console.warn('Failed to parse content.json from repo:', err);
      }
    }

    return Response.json({
      project,
      schema: parsedSchema,
      content: parsedContent,
      schemaSha: schemaFile?.sha,
      contentSha: contentFile?.sha,
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

  const { id } = params as { id: string };
  const userId = req.auth.user.id;

  try {
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return Response.json({ error: 'Content data is required' }, { status: 400 });
    }

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, id),
        eq(projects.userId, userId)
      ),
    });

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const [owner, repoName] = project.repoName?.split('/') || [];
    if (!owner || !repoName) {
      return Response.json({ error: 'GitHub repository not configured correctly' }, { status: 400 });
    }

    const accessToken = (req.auth as any)?.accessToken;
    // 1. Get current content.json SHA to commit update
    const contentFile = await getFileContent(userId, owner, repoName, project.contentPath, project.branch, accessToken);
    const sha = contentFile?.sha;

    // 2. Commit update to Github
    const contentString = JSON.stringify(content, null, 2);
    const commitResult = await commitFileContent(
      userId,
      owner,
      repoName,
      project.contentPath,
      contentString,
      'chore(trigdit): update content via visual editor',
      project.branch,
      sha,
      accessToken
    );

    // 3. Trigger rebuild on hosting platform
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

    return Response.json({
      success: true,
      commitSha: commitResult.sha,
      deployment: deployResult,
    });
  } catch (error: any) {
    console.error('Editor save error:', error);
    return Response.json({ error: error.message || 'Failed to save content edits' }, { status: 500 });
  }
});
