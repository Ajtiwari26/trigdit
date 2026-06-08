import { auth } from '@/auth';

export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.VERCEL_CLIENT_ID || '';
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/vercel`;
  
  const vercelAuthUrl = `https://vercel.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return Response.redirect(vercelAuthUrl);
});
