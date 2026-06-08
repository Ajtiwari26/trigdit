import { auth } from '@/auth';
import { db, integrations, eq, and } from '@trigdit/db';

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
    const response = await fetch('https://api.netlify.com/oauth/tokens', {
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error_description || 'Failed to exchange Netlify authorization code');
    }

    const data = await response.json();
    const token = data.access_token;

    // Save or update in database
    const existing = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.userId, userId),
        eq(integrations.provider, 'netlify')
      ),
    });

    if (existing) {
      await db
        .update(integrations)
        .set({
          token,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(integrations.userId, userId),
            eq(integrations.provider, 'netlify')
          )
        );
    } else {
      await db.insert(integrations).values({
        userId,
        provider: 'netlify',
        token,
      });
    }

    return Response.redirect(new URL('/dashboard/settings?success=netlify', req.nextUrl));
  } catch (error: any) {
    console.error('Netlify OAuth Error:', error);
    return Response.redirect(new URL(`/dashboard/settings?error=${encodeURIComponent(error.message)}`, req.nextUrl));
  }
});
