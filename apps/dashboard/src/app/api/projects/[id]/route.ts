import { auth } from '@/auth';
import { getProjectById, updateProject, deleteProject } from '@/lib/db';

export const GET = auth(async (req, { params }) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = (await params) as { id: string };
  const userId = req.auth.user.id;

  try {
    const project = await getProjectById(id, userId);
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

  const { id } = (await params) as { id: string };
  const userId = req.auth.user.id;

  try {
    const body = await req.json();
    const { name, branch, contentPath, schemaPath } = body;

    const project = await getProjectById(id, userId);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const updated = await updateProject(id, userId, {
      name: name !== undefined ? name : project.name,
      branch: branch !== undefined ? branch : project.branch,
    });

    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to update project' }, { status: 500 });
  }
});

export const DELETE = auth(async (req, { params }) => {
  if (!req.auth?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = (await params) as { id: string };
  const userId = req.auth.user.id;

  try {
    const project = await getProjectById(id, userId);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    await deleteProject(id, userId);

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to delete project' }, { status: 500 });
  }
});
