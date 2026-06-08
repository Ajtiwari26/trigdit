'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Link2, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Github,
  Globe,
  Zap,
  Layers,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function SettingsPage() {
  // Vercel State
  const [vercelToken, setVercelToken] = useState('');
  const [vercelTeamId, setVercelTeamId] = useState('');
  const [vercelConnected, setVercelConnected] = useState(false);
  const [vercelProjectsCount, setVercelProjectsCount] = useState(0);
  const [loadingVercel, setLoadingVercel] = useState(false);
  const [showVercelManual, setShowVercelManual] = useState(false);

  // Netlify State
  const [netlifyToken, setNetlifyToken] = useState('');
  const [netlifyConnected, setNetlifyConnected] = useState(false);
  const [netlifySitesCount, setNetlifySitesCount] = useState(0);
  const [loadingNetlify, setLoadingNetlify] = useState(false);
  const [showNetlifyManual, setShowNetlifyManual] = useState(false);

  // General Loading State
  const [loadingPage, setLoadingPage] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // Fetch current integration statuses & check url query parameters
  useEffect(() => {
    async function loadIntegrations() {
      try {
        const [vRes, nRes] = await Promise.all([
          fetch('/api/integrations/vercel'),
          fetch('/api/integrations/netlify')
        ]);

        if (vRes.ok) {
          const vData = await vRes.json();
          if (vData.integrated) {
            setVercelConnected(true);
            setVercelProjectsCount(vData.projects?.length || 0);
            setVercelTeamId(vData.workspaceId || '');
          }
        }

        if (nRes.ok) {
          const nData = await nRes.json();
          if (nData.integrated) {
            setNetlifyConnected(true);
            setNetlifySitesCount(nData.sites?.length || 0);
          }
        }
      } catch (err) {
        console.error('Failed to load integration states', err);
      } finally {
        setLoadingPage(false);
      }
    }

    // Check for success/error redirect parameters
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success) {
      setTimeout(() => showToast(`Successfully connected ${success} via OAuth!`, 'success'), 0);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      setTimeout(() => showToast(decodeURIComponent(error), 'error'), 0);
      window.history.replaceState({}, '', window.location.pathname);
    }

    loadIntegrations();
  }, []);

  const handleConnectVercel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vercelToken) return;

    setLoadingVercel(true);
    try {
      const res = await fetch('/api/integrations/vercel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: vercelToken, workspaceId: vercelTeamId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save Vercel connection');

      setVercelConnected(true);
      setVercelToken('');
      
      // Refresh project list size
      const refreshed = await fetch('/api/integrations/vercel').then(r => r.json());
      setVercelProjectsCount(refreshed.projects?.length || 0);

      showToast('Successfully connected Vercel hosting provider!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to connect Vercel', 'error');
    } finally {
      setLoadingVercel(false);
    }
  };

  const handleDisconnectVercel = async () => {
    if (!confirm('Are you sure you want to disconnect Vercel? Linked projects will remain in Vercel but cannot be redeployed.')) return;

    setLoadingVercel(true);
    try {
      const res = await fetch('/api/integrations/vercel', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove Vercel integration');

      setVercelConnected(false);
      setVercelProjectsCount(0);
      setVercelTeamId('');
      showToast('Disconnected Vercel connection successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to disconnect Vercel', 'error');
    } finally {
      setLoadingVercel(false);
    }
  };

  const handleConnectNetlify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!netlifyToken) return;

    setLoadingNetlify(true);
    try {
      const res = await fetch('/api/integrations/netlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: netlifyToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save Netlify connection');

      setNetlifyConnected(true);
      setNetlifyToken('');

      // Refresh sites list size
      const refreshed = await fetch('/api/integrations/netlify').then(r => r.json());
      setNetlifySitesCount(refreshed.sites?.length || 0);

      showToast('Successfully connected Netlify hosting provider!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to connect Netlify', 'error');
    } finally {
      setLoadingNetlify(false);
    }
  };

  const handleDisconnectNetlify = async () => {
    if (!confirm('Are you sure you want to disconnect Netlify?')) return;

    setLoadingNetlify(true);
    try {
      const res = await fetch('/api/integrations/netlify', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove Netlify integration');

      setNetlifyConnected(false);
      setNetlifySitesCount(0);
      showToast('Disconnected Netlify connection successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to disconnect Netlify', 'error');
    } finally {
      setLoadingNetlify(false);
    }
  };

  if (loadingPage) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Fetching connector statuses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-10">
      {/* Toast Alert */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-xl border shadow-xl transition-all duration-300 ${
          message.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-950/90 border-rose-500/30 text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <XCircle className="h-5 w-5 text-rose-400" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-heading">Integrations & Connectors</h1>
          <p className="text-slate-400 mt-1.5 text-sm max-w-2xl">
            Link and authorize external cloud platforms to sync development variables and deploy visual templates to the edge.
          </p>
        </div>
      </div>

      {/* SVG Interactive Node Network Graph (Visual Metaphor) */}
      <div className="border border-slate-900 bg-slate-950/40 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <svg className="w-full max-w-2xl h-40" viewBox="0 0 500 160" fill="none">
          <defs>
            <linearGradient id="gitVercelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="gitNetlifyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#2DD4BF" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* GitHub -> Vercel Path */}
          <path
            d="M 100 80 C 180 30, 280 30, 400 50"
            stroke={vercelConnected ? 'url(#gitVercelGrad)' : '#1E293B'}
            strokeWidth={vercelConnected ? '3' : '1.5'}
            fill="none"
            className={vercelConnected ? 'animate-[dash_12s_linear_infinite] [stroke-dasharray:6,6]' : ''}
          />

          {/* GitHub -> Netlify Path */}
          <path
            d="M 100 80 C 180 130, 280 130, 400 110"
            stroke={netlifyConnected ? 'url(#gitNetlifyGrad)' : '#1E293B'}
            strokeWidth={netlifyConnected ? '3' : '1.5'}
            fill="none"
            className={netlifyConnected ? 'animate-[dash_12s_linear_infinite] [stroke-dasharray:6,6] delay-wave-1' : ''}
          />

          {/* Node 1: GitHub (Primary Source) */}
          <g transform="translate(100, 80)">
            <circle r="22" className="fill-slate-900 stroke-indigo-500/40" strokeWidth="1.5" />
            <circle r="16" className="fill-slate-950 stroke-indigo-500" strokeWidth="2" filter="url(#glow)" />
            <Github className="h-5 w-5 text-indigo-400 -translate-x-2.5 -translate-y-2.5" />
          </g>

          {/* Node 2: Vercel (Top-Right Destination) */}
          <g transform="translate(400, 50)">
            <circle r="18" className={`fill-slate-950 transition-all ${vercelConnected ? 'stroke-emerald-400' : 'stroke-slate-800'}`} strokeWidth="1.5" />
            <path d="M 0 -6 L 6 5 L -6 5 Z" className={vercelConnected ? 'fill-emerald-400' : 'fill-slate-700'} />
            {vercelConnected && <circle r="4" className="fill-emerald-400 translate-x-3 -translate-y-3 pulse-dot-active" />}
          </g>

          {/* Node 3: Netlify (Bottom-Right Destination) */}
          <g transform="translate(400, 110)">
            <circle r="18" className={`fill-slate-950 transition-all ${netlifyConnected ? 'stroke-teal-400' : 'stroke-slate-800'}`} strokeWidth="1.5" />
            <Globe className={`h-4.5 w-4.5 -translate-x-2.25 -translate-y-2.25 ${netlifyConnected ? 'text-teal-400 font-semibold' : 'text-slate-700'}`} />
            {netlifyConnected && <circle r="4" className="fill-teal-400 translate-x-3 -translate-y-3 pulse-dot-active" />}
          </g>

          <text x="100" y="122" textAnchor="middle" fill="#94A3B8" className="text-[10px] font-mono tracking-wider uppercase">GitHub Account</text>
          <text x="400" y="24" textAnchor="middle" fill={vercelConnected ? '#10B981' : '#475569'} className="text-[10px] font-mono tracking-wider uppercase font-semibold">Vercel Node</text>
          <text x="400" y="142" textAnchor="middle" fill={netlifyConnected ? '#2DD4BF' : '#475569'} className="text-[10px] font-mono tracking-wider uppercase font-semibold">Netlify Node</text>
        </svg>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Vercel Card */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase tracking-widest rounded border border-slate-800">
                  Vercel
                </span>
                <h3 className="text-lg font-semibold text-white mt-2.5">Vercel Integration</h3>
              </div>
              {vercelConnected ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900 text-slate-500 border border-slate-850">
                  Disconnected
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Enables live preview sandbox, automated preview branch builds, and edge API setups through Vercel.
            </p>

            {vercelConnected && (
              <div className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Connected Projects</span>
                  <span className="text-slate-300 font-semibold">{vercelProjectsCount} Projects</span>
                </div>
                {vercelTeamId && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Team ID Scope</span>
                    <span className="text-slate-300 font-mono text-[10px]">{vercelTeamId}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {vercelConnected ? (
              <button
                onClick={handleDisconnectVercel}
                disabled={loadingVercel}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-450 bg-rose-500/5 border border-rose-500/15 hover:bg-rose-500/10 hover:border-rose-500/25 transition-all cursor-pointer"
              >
                {loadingVercel ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Disconnect Account
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                {/* 1-Click GUI Connect Button */}
                <button
                  onClick={() => window.location.href = '/api/auth/connect/vercel'}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-650 hover:bg-indigo-600 transition-all shadow-md shadow-indigo-600/10 cursor-pointer btn-shimmer border border-indigo-500/20 text-center"
                >
                  <Link2 className="h-4 w-4" />
                  Connect Vercel via OAuth
                </button>

                {/* Developer Manual Token Toggle */}
                <div className="border-t border-slate-900/80 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowVercelManual(!showVercelManual)}
                    className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <span>Or Connect Manually with API Token</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${showVercelManual ? 'rotate-180' : ''}`} />
                  </button>

                  {showVercelManual && (
                    <form onSubmit={handleConnectVercel} className="space-y-3 mt-3 animate-fadeIn">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Vercel Access Token
                        </label>
                        <input
                          type="password"
                          placeholder="Enter Vercel User Token..."
                          required
                          value={vercelToken}
                          onChange={(e) => setVercelToken(e.target.value)}
                          className="w-full text-xs bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-2.5 text-white transition-all outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          Team ID <span className="text-[9px] text-slate-600 font-normal lowercase">(optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="team_..."
                          value={vercelTeamId}
                          onChange={(e) => setVercelTeamId(e.target.value)}
                          className="w-full text-xs bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-2.5 text-white transition-all outline-none font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loadingVercel}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-indigo-650 hover:bg-indigo-600/90 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {loadingVercel ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Save Token'
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Netlify Card */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-teal-950 text-teal-300 px-2.5 py-1 text-xs font-bold uppercase tracking-widest rounded border border-teal-850/60">
                  Netlify
                </span>
                <h3 className="text-lg font-semibold text-white mt-2.5">Netlify Integration</h3>
              </div>
              {netlifyConnected ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900 text-slate-500 border border-slate-850">
                  Disconnected
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Provides deployment triggers, DNS linkages, and web hooks registrations directly for Netlify sites.
            </p>

            {netlifyConnected && (
              <div className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Connected Sites</span>
                  <span className="text-slate-300 font-semibold">{netlifySitesCount} Sites</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {netlifyConnected ? (
              <button
                onClick={handleDisconnectNetlify}
                disabled={loadingNetlify}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-450 bg-rose-500/5 border border-rose-500/15 hover:bg-rose-500/10 hover:border-rose-500/25 transition-all cursor-pointer"
              >
                {loadingNetlify ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Disconnect Account
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                {/* 1-Click GUI Connect Button */}
                <button
                  onClick={() => window.location.href = '/api/auth/connect/netlify'}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-teal-650 hover:bg-teal-650/80 transition-all shadow-md shadow-teal-600/10 cursor-pointer btn-shimmer border border-teal-500/20 text-center"
                >
                  <Link2 className="h-4 w-4" />
                  Connect Netlify via OAuth
                </button>

                {/* Developer Manual Token Toggle */}
                <div className="border-t border-slate-900/80 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowNetlifyManual(!showNetlifyManual)}
                    className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <span>Or Connect Manually with API Token</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${showNetlifyManual ? 'rotate-180' : ''}`} />
                  </button>

                  {showNetlifyManual && (
                    <form onSubmit={handleConnectNetlify} className="space-y-3 mt-3 animate-fadeIn">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Netlify Personal Token
                        </label>
                        <input
                          type="password"
                          placeholder="Enter Netlify API Key..."
                          required
                          value={netlifyToken}
                          onChange={(e) => setNetlifyToken(e.target.value)}
                          className="w-full text-xs bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl p-2.5 text-white transition-all outline-none font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loadingNetlify}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-teal-650 hover:bg-teal-600/90 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {loadingNetlify ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Save Token'
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security info card */}
      <div className="border border-indigo-500/10 bg-indigo-500/5 rounded-2xl p-6 flex gap-4 items-start">
        <ShieldCheck className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-100">Secure Token Handling</h4>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            API Keys and tokens are sent over HTTPS and stored securely in our PostgreSQL database. These keys are only used to automate repo linkages and trigger builds on Vercel and Netlify on your explicit command.
          </p>
        </div>
      </div>
    </div>
  );
}
