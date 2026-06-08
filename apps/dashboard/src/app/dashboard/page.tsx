'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Github, 
  ExternalLink,
  ChevronRight,
  ChevronDown,
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
  
  // Repo selector dropdown state
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleLinkRepo = async (repo: GitHubRepo) => {
    setShowRepoDropdown(false);
    setGlobalLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Format repository name (e.g. nextjs-company-website -> Nextjs Company Website)
    const formattedName = repo.name
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formattedName,
          repoName: repo.fullName,
          branch: repo.defaultBranch || 'main',
          framework: 'nextjs', // Default framework
          hostingProvider: vercelAvailable ? 'vercel' : netlifyAvailable ? 'netlify' : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to link repository');

      setProjects((prev) => [data.project, ...prev]);
      setSuccessMsg(`Successfully linked repository: ${repo.name}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while linking repository');
    } finally {
      setGlobalLoading(false);
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
        
        {/* Dropdown Selector */}
        <div className="relative">
          <button
            onClick={() => setShowRepoDropdown(!showRepoDropdown)}
            disabled={globalLoading}
            className="flex items-center gap-2 bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-indigo-650/15 cursor-pointer btn-shimmer border border-indigo-500/20 disabled:opacity-50"
          >
            {globalLoading ? (
              <RefreshCw className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Plus className="h-4.5 w-4.5" />
            )}
            <span>Link Repository</span>
            <ChevronDown className="h-4 w-4 opacity-70 ml-1" />
          </button>
          
          {showRepoDropdown && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-950 border border-slate-900 shadow-2xl z-50 overflow-hidden py-1 max-h-96 overflow-y-auto">
              <div className="px-3.5 py-2 border-b border-slate-900/60">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select GitHub Repository</span>
              </div>
              {gitRepos.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No repositories found.<br/>Connect GitHub in Settings.
                </div>
              ) : (
                gitRepos.map((repo) => (
                  <button
                    key={repo.fullName}
                    onClick={() => handleLinkRepo(repo)}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-600/10 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between border-b border-slate-900/30 last:border-b-0 cursor-pointer"
                  >
                    <div className="truncate pr-4 flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-200">{repo.name}</span>
                      <span className="text-[9px] text-slate-500 truncate">{repo.fullName}</span>
                    </div>
                    <span className="text-[9px] font-mono bg-slate-900 px-1.5 py-0.5 rounded text-indigo-400 border border-slate-850">
                      {repo.defaultBranch || 'main'}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-2xl text-xs flex justify-between items-center">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-rose-300 font-bold ml-4">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-2xl text-xs flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-350 font-bold ml-4">✕</button>
        </div>
      )}

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

          {/* Inline Repo list in empty state */}
          <div className="w-full max-w-sm space-y-2 text-left">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-center mb-1">Quick Link Repository</span>
            {gitRepos.length === 0 ? (
              <Link href="/dashboard/settings" className="block p-4 text-center text-xs bg-slate-900/40 border border-slate-850 hover:border-slate-800 text-indigo-400 rounded-2xl cursor-pointer transition-all">
                No repositories found. Connect GitHub in Settings.
              </Link>
            ) : (
              <div className="border border-slate-900 bg-slate-950 rounded-2xl overflow-hidden py-1 max-h-48 overflow-y-auto divide-y divide-slate-900/40">
                {gitRepos.map((repo) => (
                  <button
                    key={repo.fullName}
                    onClick={() => handleLinkRepo(repo)}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-650/10 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="truncate pr-4 flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-200">{repo.name}</span>
                      <span className="text-[9px] text-slate-500 truncate">{repo.fullName}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                  </button>
                ))}
              </div>
            )}
          </div>
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
    </div>
  );
}
