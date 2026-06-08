import { auth } from '@/auth';

export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.NETLIFY_CLIENT_ID || '';
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/netlify`;
  
  const netlifyAuthUrl = `https://app.netlify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return Response.redirect(netlifyAuthUrl);
});
