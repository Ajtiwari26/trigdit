import { Octokit } from 'octokit';
import { getGitHubToken } from '@/lib/db';
export { getGitHubToken };

export async function getOctokitClient(userId: string, customToken?: string): Promise<Octokit> {
  const token = customToken || await getGitHubToken(userId);
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

export async function listUserRepositories(userId: string, customToken?: string): Promise<GitHubRepo[]> {
  if (userId.startsWith('usr_mock')) {
    return [
      { id: 101, name: 'nextjs-company-website', fullName: 'mock-org/nextjs-company-website', description: 'Corporate landing page built with Next.js App Router.', private: false, htmlUrl: '#', defaultBranch: 'main' },
      { id: 102, name: 'react-vite-storefront', fullName: 'mock-org/react-vite-storefront', description: 'Vite + Tailwind visual shop template.', private: true, htmlUrl: '#', defaultBranch: 'main' },
      { id: 103, name: 'vanilla-html-portfolio', fullName: 'mock-org/vanilla-html-portfolio', description: 'Sleek portfolio built with raw static HTML and CSS.', private: false, htmlUrl: '#', defaultBranch: 'master' }
    ];
  }

  const octokit = await getOctokitClient(userId, customToken);
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

export async function getRepoBranches(userId: string, owner: string, repo: string, customToken?: string): Promise<string[]> {
  if (userId.startsWith('usr_mock')) {
    return ['main', 'development', 'staging'];
  }

  const octokit = await getOctokitClient(userId, customToken);
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
  ref?: string,
  customToken?: string
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

  const octokit = await getOctokitClient(userId, customToken);
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
  sha?: string,
  customToken?: string
): Promise<{ sha: string }> {
  if (userId.startsWith('usr_mock')) {
    return { sha: 'mock-new-commit-sha-' + Math.random().toString(36).substr(2, 9) };
  }

  const octokit = await getOctokitClient(userId, customToken);
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
  secret: string,
  customToken?: string
): Promise<number> {
  if (userId.startsWith('usr_mock')) {
    return 99999;
  }

  const octokit = await getOctokitClient(userId, customToken);
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

export async function scanAndGenerateSchema(
  userId: string,
  owner: string,
  repo: string,
  branch: string,
  customToken?: string
): Promise<{ schema: any; content: any }> {
  if (userId.startsWith('usr_mock')) {
    const defaultSchema = {
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
                { key: 'hero_title', label: 'Title Text', type: 'text', defaultValue: 'Visual Web Builder Platform' },
                { key: 'hero_subtitle', label: 'Subtitle Description', type: 'textarea', defaultValue: 'Empower non-technical owners to edit modern frameworks visually.' },
                { key: 'hero_accentColor', label: 'Theme Accent Color', type: 'color', defaultValue: '#6366F1' }
              ]
            }
          ]
        }
      ]
    };
    const defaultContent = {
      '/': {
        'hero': {
          'hero_title': 'Visual Web Builder Platform',
          'hero_subtitle': 'Empower non-technical owners to edit modern frameworks visually.',
          'hero_accentColor': '#6366F1'
        }
      }
    };
    return { schema: defaultSchema, content: defaultContent };
  }

  try {
    const octokit = await getOctokitClient(userId, customToken);
    const { data: treeData } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: 'true',
    });

    const files = treeData.tree || [];
    const scanCandidates = files.filter(f => {
      if (f.type !== 'blob') return false;
      const path = f.path || '';
      return (
        path.endsWith('page.tsx') ||
        path.endsWith('page.jsx') ||
        path.endsWith('index.html') ||
        path.endsWith('App.tsx') ||
        path.endsWith('App.jsx')
      );
    }).slice(0, 3);

    const sections: any[] = [];
    const contentMap: any = { '/': {} };

    for (const file of scanCandidates) {
      const path = file.path || '';
      const contentRes = await getFileContent(userId, owner, repo, path, branch, customToken);
      if (!contentRes) continue;

      const code = contentRes.content;
      const fileName = path.split('/').pop() || 'index';
      const fileSlug = fileName.replace(/\.[^/.]+$/, "").toLowerCase();
      
      const fields: any[] = [];
      const sectionId = `section_${fileSlug}`;
      contentMap['/'][sectionId] = {};

      const headingRegex = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi;
      let headingMatch;
      let headingIndex = 1;
      while ((headingMatch = headingRegex.exec(code)) !== null && headingIndex <= 5) {
        const textVal = headingMatch[1].trim();
        if (textVal && !textVal.includes('{') && !textVal.includes('}')) {
          const key = `${fileSlug}_heading_${headingIndex}`;
          fields.push({
            key,
            label: `Heading ${headingIndex}`,
            type: 'text',
            defaultValue: textVal
          });
          contentMap['/'][sectionId][key] = textVal;
          headingIndex++;
        }
      }

      const paraRegex = /<p[^>]*>([^<]+)<\/p>/gi;
      let paraMatch;
      let paraIndex = 1;
      while ((paraMatch = paraRegex.exec(code)) !== null && paraIndex <= 5) {
        const textVal = paraMatch[1].trim();
        if (textVal && !textVal.includes('{') && !textVal.includes('}')) {
          const key = `${fileSlug}_para_${paraIndex}`;
          fields.push({
            key,
            label: `Paragraph ${paraIndex}`,
            type: 'textarea',
            defaultValue: textVal
          });
          contentMap['/'][sectionId][key] = textVal;
          paraIndex++;
        }
      }

      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      let imgMatch;
      let imgIndex = 1;
      while ((imgMatch = imgRegex.exec(code)) !== null && imgIndex <= 5) {
        const imgSrc = imgMatch[1].trim();
        if (imgSrc && !imgSrc.includes('{') && !imgSrc.includes('}')) {
          const key = `${fileSlug}_image_${imgIndex}`;
          fields.push({
            key,
            label: `Image ${imgIndex}`,
            type: 'image',
            defaultValue: imgSrc
          });
          contentMap['/'][sectionId][key] = imgSrc;
          imgIndex++;
        }
      }

      if (fields.length > 0) {
        sections.push({
          id: sectionId,
          name: `${fileSlug.charAt(0).toUpperCase() + fileSlug.slice(1)} Section`,
          description: `Visual elements scanned from ${path}`,
          fields
        });
      }
    }

    if (sections.length === 0) {
      sections.push({
        id: 'hero',
        name: 'Hero Section',
        description: 'Auto-generated visual editor section.',
        fields: [
          { key: 'hero_title', label: 'Title Text', type: 'text', defaultValue: 'Modern Website Platform' },
          { key: 'hero_subtitle', label: 'Subtitle Description', type: 'textarea', defaultValue: 'Link, sync, and deploy visual themes instantly.' }
        ]
      });
      contentMap['/']['hero'] = {
        hero_title: 'Modern Website Platform',
        hero_subtitle: 'Link, sync, and deploy visual themes instantly.'
      };
    }

    const finalSchema = {
      version: '1.0',
      pages: [
        {
          path: '/',
          name: 'Home Page',
          sections
        }
      ]
    };

    return {
      schema: finalSchema,
      content: contentMap
    };
  } catch (error) {
    console.error('Codebase scanning failed:', error);
    const fallbackSchema = {
      version: '1.0',
      pages: [
        {
          path: '/',
          name: 'Home Page',
          sections: [
            {
              id: 'hero',
              name: 'Hero Section',
              fields: [
                { key: 'hero_title', label: 'Title Text', type: 'text', defaultValue: 'Visual Web Builder' }
              ]
            }
          ]
        }
      ]
    };
    const fallbackContent = {
      '/': {
        'hero': {
          'hero_title': 'Visual Web Builder'
        }
      }
    };
    return { schema: fallbackSchema, content: fallbackContent };
  }
}
