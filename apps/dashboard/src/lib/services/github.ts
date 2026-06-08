import { Octokit } from 'octokit';
import { db, accounts, eq, and } from '@trigdit/db';

export async function getGitHubToken(userId: string): Promise<string | null> {
  const account = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.userId, userId),
      eq(accounts.provider, 'github')
    ),
  });
  return account?.access_token || null;
}

export async function getOctokitClient(userId: string): Promise<Octokit> {
  const token = await getGitHubToken(userId);
  if (!token) {
    throw new Error('GitHub account is not connected or token not found');
  }
  return new Octokit({ auth: token });
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  htmlUrl: string;
  defaultBranch: string;
}

export async function listUserRepositories(userId: string): Promise<GitHubRepo[]> {
  if (userId.startsWith('usr_mock')) {
    return [
      { id: 101, name: 'nextjs-company-website', fullName: 'mock-org/nextjs-company-website', description: 'Corporate landing page built with Next.js App Router.', private: false, htmlUrl: '#', defaultBranch: 'main' },
      { id: 102, name: 'react-vite-storefront', fullName: 'mock-org/react-vite-storefront', description: 'Vite + Tailwind visual shop template.', private: true, htmlUrl: '#', defaultBranch: 'main' },
      { id: 103, name: 'vanilla-html-portfolio', fullName: 'mock-org/vanilla-html-portfolio', description: 'Sleek portfolio built with raw static HTML and CSS.', private: false, htmlUrl: '#', defaultBranch: 'master' }
    ];
  }

  const octokit = await getOctokitClient(userId);
  const response = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100,
  });

  return response.data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    private: repo.private,
    htmlUrl: repo.html_url,
    defaultBranch: repo.default_branch,
  }));
}

export async function getRepoBranches(userId: string, owner: string, repo: string): Promise<string[]> {
  if (userId.startsWith('usr_mock')) {
    return ['main', 'development', 'staging'];
  }

  const octokit = await getOctokitClient(userId);
  const response = await octokit.rest.repos.listBranches({
    owner,
    repo,
    per_page: 100,
  });
  return response.data.map((branch) => branch.name);
}

export async function getFileContent(
  userId: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<{ sha: string; content: string } | null> {
  if (userId.startsWith('usr_mock')) {
    if (path.endsWith('trigdit.schema.json')) {
      return {
        sha: 'mock-schema-sha',
        content: JSON.stringify({
          version: '1.0',
          pages: [
            {
              path: '/',
              name: 'Home Page',
              sections: [
                {
                  id: 'hero',
                  name: 'Hero Banner',
                  description: 'Primary visual section at the top of the homepage.',
                  fields: [
                    { key: 'title', label: 'Title Text', type: 'text', defaultValue: 'Visual Web Builder Platform' },
                    { key: 'subtitle', label: 'Subtitle Description', type: 'textarea', defaultValue: 'Empower non-technical owners to edit modern frameworks visually.' },
                    { key: 'accentColor', label: 'Theme Accent Color', type: 'color', defaultValue: '#6366F1' },
                    { key: 'featuresCount', label: 'Stats Count', type: 'number', defaultValue: 45 },
                    { key: 'isLive', label: 'Publish Sandbox Live', type: 'boolean', defaultValue: true }
                  ]
                }
              ]
            }
          ]
        }, null, 2)
      };
    } else if (path.endsWith('content.json')) {
      return {
        sha: 'mock-content-sha',
        content: JSON.stringify({
          '/': {
            'hero': {
              'title': 'Visual Web Builder Platform',
              'subtitle': 'Empower non-technical owners to edit modern frameworks visually.',
              'accentColor': '#6366F1',
              'featuresCount': 45,
              'isLive': true
            }
          }
        }, null, 2)
      };
    }
    return null;
  }

  const octokit = await getOctokitClient(userId);
  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if ('content' in response.data && typeof response.data.content === 'string') {
      const decodedContent = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return {
        sha: response.data.sha,
        content: decodedContent,
      };
    }
    return null;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function commitFileContent(
  userId: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  commitMessage: string,
  branch: string,
  sha?: string
): Promise<{ sha: string }> {
  if (userId.startsWith('usr_mock')) {
    return { sha: 'mock-new-commit-sha-' + Math.random().toString(36).substr(2, 9) };
  }

  const octokit = await getOctokitClient(userId);
  const response = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: commitMessage,
    content: Buffer.from(content).toString('base64'),
    branch,
    sha,
  });

  return {
    sha: response.data.content?.sha || '',
  };
}

export async function createRepoWebhook(
  userId: string,
  owner: string,
  repo: string,
  webhookUrl: string,
  secret: string
): Promise<number> {
  if (userId.startsWith('usr_mock')) {
    return 99999;
  }

  const octokit = await getOctokitClient(userId);
  const response = await octokit.rest.repos.createWebhook({
    owner,
    repo,
    config: {
      url: webhookUrl,
      content_type: 'json',
      secret,
      insecure_ssl: '0',
    },
    events: ['push'],
    active: true,
  });

  return response.data.id;
}
