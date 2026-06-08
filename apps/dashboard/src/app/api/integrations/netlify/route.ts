import { auth } from '@/auth';
import { db, integrations, eq, and } from '@trigdit/db';
import { listNetlifySites, verifyNetlifyToken } from '@/lib/services/netlify';

export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = req.auth.user.id;

  try {
    const integration = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.userId, userId),
        eq(integrations.provider, 'netlify')
      ),
    });

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

    // Check if integration already exists
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
    await db
      .delete(integrations)
      .where(
        and(
          eq(integrations.userId, userId),
          eq(integrations.provider, 'netlify')
        )
      );

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to delete Netlify integration' }, { status: 500 });
  }
});
