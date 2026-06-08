import { auth } from '@/auth';
import { getIntegration, saveIntegration, deleteIntegration } from '@/lib/db';
import { listVercelProjects, verifyVercelToken } from '@/lib/services/vercel';

export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = req.auth.user.id;

  try {
    const integration = await getIntegration(userId, 'vercel');

    if (!integration) {
      return Response.json({ integrated: false });
    }

    const projects = await listVercelProjects(userId).catch(() => []);
    return Response.json({
      integrated: true,
      workspaceId: integration.workspaceId,
      projects,
    });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to check Vercel integration' }, { status: 500 });
  }
});

export const POST = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = req.auth.user.id;
  try {
    const body = await req.json();
    const { token, workspaceId } = body;

    if (!token) {
      return Response.json({ error: 'Token is required' }, { status: 400 });
    }

    const isValid = await verifyVercelToken(token, workspaceId);
    if (!isValid) {
      return Response.json({ error: 'Invalid Vercel token or workspace ID' }, { status: 400 });
    }

    await saveIntegration(userId, 'vercel', token, workspaceId);

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to update Vercel integration' }, { status: 500 });
  }
});

export const DELETE = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = req.auth.user.id;
  try {
    await deleteIntegration(userId, 'vercel');

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to delete Vercel integration' }, { status: 500 });
  }
});
