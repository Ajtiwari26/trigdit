'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Github, 
  ExternalLink,
  ChevronRight,
  Globe,
  Settings,
  FolderDot,
  RefreshCw,
  FolderGit2,
  Layers,
  Sparkles
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  framework: string;
  repoName: string;
  branch: string;
  hostingProvider: string | null;
  vercelProjectName: string | null;
  netlifySiteName: string | null;
  createdAt: string;
}

interface GitHubRepo {
  fullName: string;
  name: string;
  defaultBranch: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [gitRepos, setGitRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [framework, setFramework] = useState('nextjs');
  const [hostingProvider, setHostingProvider] = useState('none');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Hosting integrations state (to verify availability before connecting)
  const [vercelAvailable, setVercelAvailable] = useState(false);
  const [netlifyAvailable, setNetlifyAvailable] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [projRes, gitRes, vercelRes, netlifyRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/integrations/github'),
          fetch('/api/integrations/vercel'),
          fetch('/api/integrations/netlify')
        ]);

        if (projRes.ok) {
          const data = await projRes.json();
          setProjects(data);
        }

        if (gitRes.ok) {
          const repos = await gitRes.json();
          setGitRepos(repos);
          if (repos.length > 0) {
            setSelectedRepo(repos[0].fullName);
            setBranch(repos[0].defaultBranch || 'main');
          }
        }

        if (vercelRes.ok) {
          const vData = await vercelRes.json();
          setVercelAvailable(vData.integrated);
        }

        if (netlifyRes.ok) {
          const nData = await netlifyRes.json();
          setNetlifyAvailable(nData.integrated);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Sync default branch when repository changes
  const handleRepoChange = (repoName: string) => {
    setSelectedRepo(repoName);
    const repo = gitRepos.find((r) => r.fullName === repoName);
    if (repo) {
      setBranch(repo.defaultBranch || 'main');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setCreating(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          repoName: selectedRepo,
          branch,
          framework,
          hostingProvider: hostingProvider === 'none' ? null : hostingProvider,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project');

      setProjects((prev) => [data.project, ...prev]);
      setShowModal(false);
      setName('');
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Fetching workspace details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-heading">Project Workspaces</h1>
          <p className="text-slate-400 mt-1 text-sm">Link Git repos to visual layouts and publish headless websites live.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-indigo-650/15 cursor-pointer btn-shimmer border border-indigo-500/20"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="border border-slate-900 bg-slate-950/40 backdrop-blur-md rounded-3xl p-16 text-center max-w-xl mx-auto flex flex-col items-center space-y-6 glass-card">
          
          {/* Telemetry empty state visual (Creative Metaphor: File sync path) */}
          <div className="w-full relative overflow-hidden bg-slate-950/50 border border-slate-900 rounded-2xl p-4">
            <svg className="w-full max-w-sm h-36 mx-auto" viewBox="0 0 320 140" fill="none">
              <defs>
                <linearGradient id="flowGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Connecting dash line */}
              <path
                d="M 60 70 L 260 70"
                stroke="url(#flowGlow)"
                strokeWidth="2"
                strokeDasharray="6 6"
                className="stroke-slate-800 animate-[dash_10s_linear_infinite]"
              />

              {/* Node 1: Git Icon */}
              <g transform="translate(60, 70)">
                <circle r="18" className="fill-slate-950 stroke-indigo-500/40" strokeWidth="1.5" />
                <FolderGit2 className="h-4.5 w-4.5 text-indigo-400 -translate-x-2.25 -translate-y-2.25" />
              </g>

              {/* Sliding telemetry packet */}
              <circle r="4.5" className="fill-indigo-400 animate-telemetry-slide filter drop-shadow-[0_0_4px_rgba(99,102,241,0.6)]" />

              {/* Node 2: Hosting Globe */}
              <g transform="translate(260, 70)">
                <circle r="18" className="fill-slate-950 stroke-emerald-500/40" strokeWidth="1.5" />
                <Globe className="h-4.5 w-4.5 text-emerald-400 -translate-x-2.25 -translate-y-2.25" />
              </g>

              <text x="60" y="106" textAnchor="middle" fill="#475569" className="text-[9px] font-mono tracking-widest uppercase">Git Source</text>
              <text x="160" y="44" textAnchor="middle" fill="#818CF8" className="text-[10px] font-mono tracking-widest uppercase font-semibold">Metadata Stream</text>
              <text x="260" y="106" textAnchor="middle" fill="#475569" className="text-[9px] font-mono tracking-widest uppercase">Edge DNS</text>
            </svg>
          </div>

          <div className="space-y-2 max-w-sm">
            <h3 className="text-lg font-bold text-slate-200">No Projects Configured</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect a GitHub repository containing a modern tech framework, define your variables, and trigger immediate edge builds.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Link Your First Repository
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-5 group"
            >
              <div className="space-y-3.5">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-950 py-1 px-2.5 rounded text-indigo-400 border border-slate-900 font-mono">
                    {proj.framework}
                  </span>
                  {proj.hostingProvider && (
                    <span className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                      <Globe className="h-3 w-3 text-slate-600" />
                      {proj.hostingProvider}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {proj.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500 font-mono">
                    <Github className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[180px]">{proj.repoName}</span>
                    <span className="text-slate-700">•</span>
                    <span className="text-indigo-500/80">{proj.branch}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900/60 flex gap-3">
                <Link
                  href={`/dashboard/project/${proj.id}`}
                  className="flex-1 flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-950 border border-slate-900 hover:bg-slate-900/60 transition-all cursor-pointer"
                >
                  Visual Editor
                  <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-900 rounded-3xl shadow-2xl relative p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white font-heading">Link New Visual Project</h3>
              <p className="text-xs text-slate-400 mt-1">Setup live postMessage variable editing for your repository template.</p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Project Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="My Creative Portfolio Site"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-3 text-white transition-all outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  GitHub Repository Source
                </label>
                {gitRepos.length === 0 ? (
                  <div className="p-3 text-xs bg-slate-900 border border-slate-850 text-slate-400 rounded-xl flex items-center gap-2">
                    <FolderGit2 className="h-4.5 w-4.5 text-slate-500" />
                    <span>No repositories linked. Check settings.</span>
                  </div>
                ) : (
                  <select
                    value={selectedRepo}
                    onChange={(e) => handleRepoChange(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-3 text-white transition-all outline-none font-medium"
                  >
                    {gitRepos.map((repo) => (
                      <option key={repo.fullName} value={repo.fullName}>
                        {repo.fullName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                    Git Branch
                  </label>
                  <input
                    type="text"
                    required
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-3 text-white transition-all outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Tech Stack
                  </label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-3 text-white transition-all outline-none font-medium"
                  >
                    <option value="nextjs">Next.js (App Router)</option>
                    <option value="vite">Vite + React</option>
                    <option value="vanilla">Vanilla HTML / JS</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Edge Host Connector
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold transition-all ${
                    hostingProvider === 'none' 
                      ? 'bg-indigo-650/15 border-indigo-500 text-indigo-400' 
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-800'
                  }`}>
                    <input
                      type="radio"
                      name="hosting"
                      value="none"
                      checked={hostingProvider === 'none'}
                      onChange={() => setHostingProvider('none')}
                      className="sr-only"
                    />
                    <span>None</span>
                  </label>

                  <label className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
                    !vercelAvailable 
                      ? 'opacity-30 cursor-not-allowed bg-slate-950 border-slate-950 text-slate-650'
                      : hostingProvider === 'vercel'
                        ? 'bg-indigo-650/15 border-indigo-500 text-indigo-400 cursor-pointer'
                        : 'bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-800 cursor-pointer'
                  }`}>
                    <input
                      type="radio"
                      name="hosting"
                      value="vercel"
                      disabled={!vercelAvailable}
                      checked={hostingProvider === 'vercel'}
                      onChange={() => setHostingProvider('vercel')}
                      className="sr-only"
                    />
                    <span>Vercel</span>
                  </label>

                  <label className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
                    !netlifyAvailable 
                      ? 'opacity-30 cursor-not-allowed bg-slate-950 border-slate-950 text-slate-650'
                      : hostingProvider === 'netlify'
                        ? 'bg-indigo-650/15 border-indigo-500 text-indigo-400 cursor-pointer'
                        : 'bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-800 cursor-pointer'
                  }`}>
                    <input
                      type="radio"
                      name="hosting"
                      value="netlify"
                      disabled={!netlifyAvailable}
                      checked={hostingProvider === 'netlify'}
                      onChange={() => setHostingProvider('netlify')}
                      className="sr-only"
                    />
                    <span>Netlify</span>
                  </label>
                </div>
                {!vercelAvailable && !netlifyAvailable && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    To link hosting automatically, configure Vercel or Netlify tokens inside{' '}
                    <span onClick={() => setShowModal(false)} className="text-indigo-400 hover:underline cursor-pointer">
                      Connectors Settings
                    </span>.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || gitRepos.length === 0}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-650 hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-650/15 disabled:opacity-50 cursor-pointer btn-shimmer border border-indigo-500/20"
                >
                  {creating ? (
                    <RefreshCw className="h-4.5 w-4.5 animate-spin mx-auto" />
                  ) : (
                    'Link Repository'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
