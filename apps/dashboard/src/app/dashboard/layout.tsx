'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  Layers, 
  Settings, 
  LogOut, 
  User,
  Plug,
  Terminal,
  PanelLeft,
  PanelLeftClose
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [sidebarHovered, setSidebarHovered] = React.useState(false);

  const navItems = [
    { name: 'Projects', href: '/dashboard', icon: Layers },
    { name: 'Connectors & Settings', href: '/dashboard/settings', icon: Settings },
  ];

  if (status === 'loading') {
    return (
      <div className="flex-1 flex justify-center items-center bg-slate-950 text-white min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading your Trigdit workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-screen bg-slate-950 text-slate-200 relative">
      {/* Sidebar Navigation */}
      <aside 
        onMouseEnter={() => sidebarCollapsed && setSidebarHovered(true)}
        onMouseLeave={() => sidebarCollapsed && setSidebarHovered(false)}
        className={`border-r border-slate-900 bg-slate-950 flex flex-col justify-between p-6 transition-all duration-300 z-30 ${
          sidebarCollapsed 
            ? `absolute left-0 top-0 bottom-0 shadow-2xl ${sidebarHovered ? 'w-64 opacity-100 translate-x-0' : 'w-3 translate-x-0 p-0 border-r-2 border-indigo-500/30 bg-indigo-950/10'}` 
            : 'relative w-64'
        }`}
      >
        <div className={`space-y-8 transition-opacity duration-200 ${sidebarCollapsed && !sidebarHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-xl text-white">
              <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg text-white">
                <Layers className="h-5 w-5" />
              </div>
              <span>Trigdit</span>
            </Link>
            
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
              title={sidebarCollapsed ? "Pin Sidebar Open" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-4 w-4 text-indigo-400" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border-l-2 border-indigo-500 font-semibold'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Sign Out */}
        <div className={`pt-6 border-t border-slate-900 space-y-4 transition-opacity duration-200 ${sidebarCollapsed && !sidebarHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center gap-3">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User avatar'}
                className="h-9 w-9 rounded-full border border-slate-800"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                <User className="h-4 w-4" />
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Workspace Owner'}</p>
              <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2.5 justify-center py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-900 hover:border-rose-500/20 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className={`flex-1 flex flex-col overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'pl-0' : ''}`}>
        <header className="h-16 border-b border-slate-900 flex items-center justify-between px-8 bg-slate-950/40 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Expand Sidebar"
              >
                <PanelLeft className="h-4.5 w-4.5 text-indigo-400" />
              </button>
            )}
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Plug className="h-4 w-4 text-indigo-500" />
              Active Workspace
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/60 py-1.5 px-3 rounded-lg border border-slate-800/80">
            <Terminal className="h-3.5 w-3.5 text-emerald-500" />
            <span>Connected via GitHub OAuth</span>
          </div>
        </header>
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
