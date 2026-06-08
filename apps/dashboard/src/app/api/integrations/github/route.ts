import { auth } from '@/auth';
import { listUserRepositories } from '@/lib/services/github';

export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const repos = await listUserRepositories(req.auth.user.id);
    return Response.json(repos);
  } catch (error: any) {
    console.error('GitHub API error:', error);
    return Response.json({ error: error.message || 'Failed to fetch GitHub repositories' }, { status: 500 });
  }
});
