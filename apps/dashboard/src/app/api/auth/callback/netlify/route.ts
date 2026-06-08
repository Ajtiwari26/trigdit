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
    const response = await fetch('https://api.netlify.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NETLIFY_CLIENT_ID || '',
        client_secret: process.env.NETLIFY_CLIENT_SECRET || '',
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/netlify`,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('Netlify exchange token error response:', errorText);
      let errorDataObj: any = {};
      try {
        errorDataObj = JSON.parse(errorText);
      } catch {}
      throw new Error(errorDataObj.error_description || errorDataObj.error || errorText || 'Failed to exchange Netlify authorization code');
    }

    const data = await response.json();
    const token = data.access_token;

    // Save in MongoDB integration collection
    await saveIntegration(userId, 'netlify', token);

    return Response.redirect(new URL('/dashboard/settings?success=netlify', req.nextUrl));
  } catch (error: any) {
    console.error('Netlify OAuth Error:', error);
    return Response.redirect(new URL(`/dashboard/settings?error=${encodeURIComponent(error.message)}`, req.nextUrl));
  }
});
