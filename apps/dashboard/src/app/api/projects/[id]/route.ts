import { auth } from '@/auth';
import { db, projects, eq, and } from '@trigdit/db';

export const GET = auth(async (req, { params }) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params as { id: string };
  const userId = req.auth.user.id;

  try {
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, id),
        eq(projects.userId, userId)
      ),
    });

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    return Response.json(project);
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to fetch project' }, { status: 500 });
  }
});

export const PATCH = auth(async (req, { params }) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params as { id: string };
  const userId = req.auth.user.id;

  try {
    const body = await req.json();
    const { name, branch, contentPath, schemaPath } = body;

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, id),
        eq(projects.userId, userId)
      ),
    });

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const updated = await db
      .update(projects)
      .set({
        name: name !== undefined ? name : project.name,
        branch: branch !== undefined ? branch : project.branch,
        contentPath: contentPath !== undefined ? contentPath : project.contentPath,
        schemaPath: schemaPath !== undefined ? schemaPath : project.schemaPath,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projects.id, id),
          eq(projects.userId, userId)
        )
      )
      .returning();

    return Response.json(updated[0]);
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to update project' }, { status: 500 });
  }
});

export const DELETE = auth(async (req, { params }) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params as { id: string };
  const userId = req.auth.user.id;

  try {
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, id),
        eq(projects.userId, userId)
      ),
    });

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    await db
      .delete(projects)
      .where(
        and(
          eq(projects.id, id),
          eq(projects.userId, userId)
        )
      );

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to delete project' }, { status: 500 });
  }
});
