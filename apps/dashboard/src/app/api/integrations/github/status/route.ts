import { auth } from '@/auth';
import { getGitHubToken } from '@/lib/services/github';

export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ integrated: false });
  }

  const token = (req.auth as any)?.accessToken || await getGitHubToken(req.auth.user.id);
  
  return Response.json({
    integrated: !!token,
    user: req.auth.user,
  });
});
