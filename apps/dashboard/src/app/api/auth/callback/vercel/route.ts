import { auth } from '@/auth';
import { saveIntegration } from '@/lib/db';

export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = req.auth.user.id;
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return Response.redirect(new URL('/dashboard/settings?error=no_code', req.nextUrl));
  }

  try {
    const response = await fetch('https://api.vercel.com/v2/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.VERCEL_CLIENT_ID || '',
        client_secret: process.env.VERCEL_CLIENT_SECRET || '',
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/vercel`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error_description || 'Failed to exchange Vercel authorization code');
    }

    const data = await response.json();
    const token = data.access_token;
    const workspaceId = data.team_id || null;

    // Save in MongoDB integration collection
    await saveIntegration(userId, 'vercel', token, workspaceId);

    return Response.redirect(new URL('/dashboard/settings?success=vercel', req.nextUrl));
  } catch (error: any) {
    console.error('Vercel OAuth Error:', error);
    return Response.redirect(new URL(`/dashboard/settings?error=${encodeURIComponent(error.message)}`, req.nextUrl));
  }
});
