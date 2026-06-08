'use client';

import { signIn } from 'next-auth/react';
import { Github, Code, Sparkles, Cpu, Layers, Globe, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn('github', { callbackUrl: '/dashboard' });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleMockLogin = async () => {
    setLoading(true);
    try {
      await signIn('credentials', { callbackUrl: '/dashboard', redirect: true });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-[#090d16] bg-grid-glow">
      {/* Visual background gradient bubbles */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl p-8 rounded-3xl border border-slate-900 bg-slate-950/60 backdrop-blur-xl shadow-2xl relative z-10 space-y-8 glass-card">
        
        {/* Workspace Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="p-3.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl mb-4 text-white shadow-xl shadow-indigo-500/15">
            <Layers className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight font-heading text-white">
            Trigdit Platform
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-sm">
            Decoupled Visual Content Sync & Git-Backed CMS for Modern Developer Frameworks.
          </p>
        </div>

        {/* Dynamic Concept Visual (Creative Metaphor: Node network deployment flow) */}
        <div className="border border-slate-900 bg-slate-950/40 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center">
          <svg className="w-full h-32" viewBox="0 0 400 120" fill="none">
            <defs>
              <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818CF8" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#C084FC" stopOpacity="1" />
                <stop offset="100%" stopColor="#34D399" stopOpacity="0.2" />
              </linearGradient>
              <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <shadowCardBlur />
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Connecting Bezier paths showing deploy flow */}
            <path
              d="M 60 60 C 130 10, 170 110, 240 60"
              stroke="url(#glowGrad)"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="6 6"
              className="animate-[dash_10s_linear_infinite]"
            />
            <path
              d="M 240 60 C 290 20, 310 100, 340 60"
              stroke="url(#glowGrad)"
              strokeWidth="1.5"
              fill="none"
            />

            {/* Node 1: GitHub Source */}
            <g transform="translate(60, 60)">
              <circle r="16" className="fill-slate-900 stroke-indigo-500/40" strokeWidth="1.5" />
              <Github className="h-4.5 w-4.5 text-indigo-400 -translate-x-2.25 -translate-y-2.25" />
            </g>

            {/* Node 2: Trigdit Visual Editor Core */}
            <g transform="translate(240, 60)">
              <circle r="20" className="fill-slate-900 stroke-purple-500" strokeWidth="2" filter="url(#glowFilter)" />
              <Layers className="h-5 w-5 text-purple-400 -translate-x-2.5 -translate-y-2.5" />
              <circle r="4" className="fill-emerald-400 translate-x-3 -translate-y-3 pulse-dot-active" />
            </g>

            {/* Node 3: Edge Hosting (Vercel) */}
            <g transform="translate(340, 60)">
              <circle r="14" className="fill-slate-900 stroke-emerald-500/40" strokeWidth="1.5" />
              <Globe className="h-4 w-4 text-emerald-400 -translate-x-2 -translate-y-2" />
            </g>

            {/* Labels */}
            <text x="60" y="94" textAnchor="middle" fill="#94A3B8" className="text-[10px] font-mono tracking-wider uppercase">Git Source</text>
            <text x="240" y="98" textAnchor="middle" fill="#C084FC" className="text-[10px] font-mono tracking-wider uppercase font-semibold">Trigdit Editor</text>
            <text x="340" y="94" textAnchor="middle" fill="#94A3B8" className="text-[10px] font-mono tracking-wider uppercase">Edge Web</text>
          </svg>
        </div>

        {/* Credentials info / Actions */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-900/60 hover:border-slate-800 transition-all">
              <Sparkles className="h-5 w-5 text-indigo-400 mb-2" />
              <h4 className="text-xs font-semibold text-slate-200">Decoupled Editing</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                Visual overlays edit metadata while your code compiles cleanly from Git.
              </p>
            </div>

            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-900/60 hover:border-slate-800 transition-all">
              <Cpu className="h-5 w-5 text-purple-400 mb-2" />
              <h4 className="text-xs font-semibold text-slate-200">Edge Redirection</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                Auto-sync deployments directly with Vercel and Netlify platform APIs.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-2xl font-semibold text-white transition-all bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] border border-indigo-400/20 btn-shimmer cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Github className="h-5 w-5" />
                  <span>Connect with GitHub OAuth</span>
                </>
              )}
            </button>

            <button
              onClick={handleMockLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-semibold text-indigo-400 hover:text-indigo-300 transition-all bg-slate-950 border border-slate-900 hover:border-slate-800 disabled:opacity-50 active:scale-[0.98] cursor-pointer text-xs"
            >
              Bypass OAuth (Developer Demo Mode)
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900/80 text-center flex items-center justify-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
          <Code className="h-3.5 w-3.5" />
          <span>Universal Developer SDK Layer</span>
        </div>
      </div>
    </div>
  );
}
