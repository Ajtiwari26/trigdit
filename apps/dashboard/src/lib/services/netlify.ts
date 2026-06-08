import { getIntegration } from '@/lib/db';

export async function getNetlifyToken(userId: string): Promise<string | null> {
  if (userId.startsWith('usr_mock')) {
    return 'mock-netlify-token';
  }

  const integration = await getIntegration(userId, 'netlify');
  return integration?.token || null;
}

async function netlifyFetch(path: string, options: RequestInit, token: string) {
  const baseUrl = 'https://api.netlify.com/api/v1';
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Netlify API error: ${response.statusText}`);
  }

  return response.json();
}

export interface NetlifySite {
  id: string;
  name: string;
  url: string;
  adminUrl: string;
  gitRepo?: string;
}

export async function verifyNetlifyToken(token: string): Promise<boolean> {
  if (token === 'mock-netlify-token') {
    return true;
  }

  try {
    const response = await fetch('https://api.netlify.com/api/v1/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function listNetlifySites(userId: string): Promise<NetlifySite[]> {
  if (userId.startsWith('usr_mock')) {
    return [
      { id: 'n_site_101', name: 'mock-netlify-portfolio', url: 'https://mock-netlify-portfolio.netlify.app', adminUrl: '#' }
    ];
  }

  const token = await getNetlifyToken(userId);
  if (!token) throw new Error('Netlify not integrated');

  const sites = await netlifyFetch('/sites', { method: 'GET' }, token);
  
  return (sites || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    url: s.url,
    adminUrl: s.admin_url,
    gitRepo: s.build_settings?.repo_path,
  }));
}

export async function createNetlifySite(
  userId: string,
  name: string,
  repoOrg: string,
  repoName: string,
  branch: string = 'main'
): Promise<NetlifySite> {
  if (userId.startsWith('usr_mock')) {
    return {
      id: 'n_site_new',
      name: name,
      url: `https://${name}.netlify.app`,
      adminUrl: '#',
    };
  }

  const token = await getNetlifyToken(userId);
  if (!token) throw new Error('Netlify not integrated');

  const payload = {
    name,
    repo: {
      provider: 'github',
      repo: `${repoOrg}/${repoName}`,
      private: true,
      branch,
      cmd: 'npm run build',
      dir: '.next',
    },
  };

  const site = await netlifyFetch('/sites', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);

  return {
    id: site.id,
    name: site.name,
    url: site.url,
    adminUrl: site.admin_url,
    gitRepo: site.build_settings?.repo_path,
  };
}

export async function triggerNetlifyBuild(userId: string, siteId: string): Promise<void> {
  if (userId.startsWith('usr_mock')) {
    return;
  }

  const token = await getNetlifyToken(userId);
  if (!token) throw new Error('Netlify not integrated');

  await netlifyFetch(`/sites/${siteId}/builds`, {
    method: 'POST',
  }, token);
}
