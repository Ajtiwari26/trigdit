import { db, integrations, eq, and } from '@trigdit/db';

export async function getVercelToken(userId: string): Promise<{ token: string; workspaceId: string | null } | null> {
  if (userId.startsWith('usr_mock')) {
    return {
      token: 'mock-vercel-token',
      workspaceId: 'mock-team-id',
    };
  }

  const integration = await db.query.integrations.findFirst({
    where: and(
      eq(integrations.userId, userId),
      eq(integrations.provider, 'vercel')
    ),
  });
  if (!integration) return null;
  return {
    token: integration.token,
    workspaceId: integration.workspaceId,
  };
}

async function vercelFetch(
  path: string,
  options: RequestInit,
  token: string,
  teamId?: string | null
) {
  const baseUrl = 'https://api.vercel.com';
  const url = new URL(`${baseUrl}${path}`);
  if (teamId) {
    url.searchParams.append('teamId', teamId);
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Vercel API error: ${response.statusText}`);
  }

  return response.json();
}

export interface VercelProject {
  id: string;
  name: string;
  link?: {
    type: string;
    repo: string;
    org: string;
  };
}

export async function verifyVercelToken(token: string, teamId?: string): Promise<boolean> {
  if (token === 'mock-vercel-token') {
    return true;
  }

  try {
    const baseUrl = 'https://api.vercel.com';
    const url = new URL(`${baseUrl}/v2/user`);
    if (teamId) {
      url.searchParams.append('teamId', teamId);
    }
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function listVercelProjects(userId: string): Promise<VercelProject[]> {
  if (userId.startsWith('usr_mock')) {
    return [
      { id: 'v_proj_101', name: 'mock-vercel-company-website', link: { type: 'github', repo: 'nextjs-company-website', org: 'mock-org' } }
    ];
  }

  const credentials = await getVercelToken(userId);
  if (!credentials) throw new Error('Vercel not integrated');

  const data = await vercelFetch('/v9/projects', { method: 'GET' }, credentials.token, credentials.workspaceId);
  
  return (data.projects || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    link: p.link ? {
      type: p.link.type,
      repo: p.link.repo,
      org: p.link.org,
    } : undefined,
  }));
}

export async function createVercelProject(
  userId: string,
  name: string,
  repoOrg: string,
  repoName: string,
  framework: string = 'nextjs'
): Promise<VercelProject> {
  if (userId.startsWith('usr_mock')) {
    return {
      id: 'v_proj_new',
      name: name,
      link: {
        type: 'github',
        repo: repoName,
        org: repoOrg,
      },
    };
  }

  const credentials = await getVercelToken(userId);
  if (!credentials) throw new Error('Vercel not integrated');

  const vercelFramework = framework === 'nextjs' ? 'nextjs' : framework === 'vite' ? 'vite' : null;

  const payload = {
    name,
    framework: vercelFramework,
    gitRepository: {
      type: 'github',
      repo: `${repoOrg}/${repoName}`,
    },
  };

  const project = await vercelFetch('/v9/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, credentials.token, credentials.workspaceId);

  return {
    id: project.id,
    name: project.name,
    link: {
      type: 'github',
      repo: repoName,
      org: repoOrg,
    },
  };
}

export async function triggerVercelDeployment(
  userId: string,
  projectName: string,
  branch: string = 'main'
): Promise<{ id: string; url: string }> {
  if (userId.startsWith('usr_mock')) {
    return {
      id: 'v_dep_new',
      url: 'mock-vercel-company-website.vercel.app',
    };
  }

  const credentials = await getVercelToken(userId);
  if (!credentials) throw new Error('Vercel not integrated');

  const payload = {
    name: projectName,
    gitSource: {
      type: 'github',
      ref: branch,
    },
  };

  const deployment = await vercelFetch('/v13/deployments', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, credentials.token, credentials.workspaceId);

  return {
    id: deployment.id,
    url: deployment.url,
  };
}
