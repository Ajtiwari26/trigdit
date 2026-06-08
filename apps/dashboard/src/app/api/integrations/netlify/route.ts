import { auth } from '@/auth';
import { getIntegration, saveIntegration, deleteIntegration } from '@/lib/db';
import { listNetlifySites, verifyNetlifyToken } from '@/lib/services/netlify';

export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = req.auth.user.id;

  try {
    const integration = await getIntegration(userId, 'netlify');

    if (!integration) {
      return Response.json({ integrated: false });
    }

    const sites = await listNetlifySites(userId).catch(() => []);
    return Response.json({
      integrated: true,
      sites,
    });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to check Netlify integration' }, { status: 500 });
  }
});

export const POST = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = req.auth.user.id;
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return Response.json({ error: 'Token is required' }, { status: 400 });
    }

    const isValid = await verifyNetlifyToken(token);
    if (!isValid) {
      return Response.json({ error: 'Invalid Netlify token' }, { status: 400 });
    }

    await saveIntegration(userId, 'netlify', token);

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to update Netlify integration' }, { status: 500 });
  }
});

export const DELETE = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = req.auth.user.id;
  try {
    await deleteIntegration(userId, 'netlify');

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to delete Netlify integration' }, { status: 500 });
  }
});
