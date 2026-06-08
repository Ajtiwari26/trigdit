'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Globe, 
  Monitor, 
  Smartphone, 
  Tablet, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sliders,
  Compass,
  FileCode,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import type { ProjectSchemaFile, ContentData } from '@trigdit/shared';

export default function EditorPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [project, setProject] = useState<any>(null);
  const [schema, setSchema] = useState<ProjectSchemaFile | null>(null);
  const [content, setContent] = useState<ContentData>({});
  
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [activePagePath, setActivePagePath] = useState('/');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [publishStatus, setPublishStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load editor details
  useEffect(() => {
    async function loadEditor() {
      try {
        const res = await fetch(`/api/projects/${id}/editor`);
        if (!res.ok) throw new Error('Failed to load project files');
        const data = await res.json();
        
        setProject(data.project);
        setSchema(data.schema);
        setContent(data.content || {});

        // Pre-select first page/section
        if (data.schema?.pages?.length > 0) {
          setActivePagePath(data.schema.pages[0].path);
          if (data.schema.pages[0].sections?.length > 0) {
            setActiveSectionId(data.schema.pages[0].sections[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadEditor();
  }, [id]);

  // Sync state changes with the iframe
  const handleFieldChange = (sectionId: string, fieldKey: string, value: any) => {
    // 1. Update local state
    const updatedContent = { ...content };
    if (!updatedContent[activePagePath]) {
      updatedContent[activePagePath] = {};
    }
    if (!updatedContent[activePagePath][sectionId]) {
      updatedContent[activePagePath][sectionId] = {};
    }
    updatedContent[activePagePath][sectionId][fieldKey] = value;
    setContent(updatedContent);

    // 2. Broadcast postMessage to the editor canvas (iframe)
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'TRIGDIT_UPDATE_FIELD',
        payload: {
          page: activePagePath,
          sectionId,
          key: fieldKey,
          value,
        }
      }, '*');
    }
  };

  // Publish to GitHub & trigger deployment
  const handlePublish = async () => {
    setPublishing(true);
    setPublishStatus(null);

    try {
      const res = await fetch(`/api/projects/${id}/editor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save changes');

      setPublishStatus({
        text: 'Changes published! GitHub commit created and redeployment triggered.',
        type: 'success',
      });
      setTimeout(() => setPublishStatus(null), 6000);
    } catch (err: any) {
      setPublishStatus({
        text: err.message || 'Error occurred while publishing',
        type: 'error',
      });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 text-white">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading editor canvas & schema maps...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 text-white space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <p className="text-slate-400">Project details could not be loaded.</p>
        <Link href="/dashboard" className="text-xs text-indigo-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Derive preview URL
  const previewUrl = project.hostingProvider === 'vercel' && project.vercelProjectName
    ? `https://${project.vercelProjectName}.vercel.app`
    : project.hostingProvider === 'netlify' && project.netlifySiteName
      ? `https://${project.netlifySiteName}.netlify.app`
      : null;

  const activePage = schema?.pages?.find((p) => p.path === activePagePath);
  const activeSection = activePage?.sections?.find((s) => s.id === activeSectionId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200">
      {/* Toast Publish Alerts */}
      {publishStatus && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-xl border shadow-xl transition-all duration-300 ${
          publishStatus.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-950/90 border-rose-500/30 text-rose-300'
        }`}>
          {publishStatus.type === 'success' 
            ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> 
            : <AlertTriangle className="h-5 w-5 text-rose-400" />
          }
          <span className="text-sm font-medium">{publishStatus.text}</span>
        </div>
      )}

      {/* Editor Header */}
      <header className="h-14 border-b border-slate-900 px-6 flex items-center justify-between bg-slate-950/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="h-4 w-[1px] bg-slate-900" />
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
              {project.name}
              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 py-0.5 px-2 rounded">
                {project.branch}
              </span>
            </h1>
          </div>
        </div>

        {/* Viewport controls */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-900/40 p-1 border border-slate-900 rounded-xl">
          <button
            onClick={() => setViewportMode('desktop')}
            className={`p-1.5 rounded-lg transition-colors ${viewportMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewportMode('tablet')}
            className={`p-1.5 rounded-lg transition-colors ${viewportMode === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewportMode('mobile')}
            className={`p-1.5 rounded-lg transition-colors ${viewportMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>

        {/* Action button */}
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/10 active:scale-[0.97]"
        >
          {publishing ? (
            <RefreshCw className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <>
              <Save className="h-4.5 w-4.5" />
              <span>Publish Changes</span>
            </>
          )}
        </button>
      </header>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls - Left */}
        <aside className="w-80 border-r border-slate-900 bg-slate-900/10 backdrop-blur-md flex flex-col overflow-y-auto">
          {/* Schema check warning */}
          {!schema && (
            <div className="p-4 m-4 bg-amber-500/5 border border-amber-500/15 rounded-xl text-amber-400 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                <h4 className="text-xs font-bold">No Schema Found</h4>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-400">
                Ensure you have a <code className="text-slate-200">trigdit.schema.json</code> file at the root of your GitHub repository.
              </p>
            </div>
          )}

          {schema && (
            <div className="p-6 space-y-6">
              {/* Pages dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Select Page
                </label>
                <select
                  value={activePagePath}
                  onChange={(e) => {
                    setActivePagePath(e.target.value);
                    const selected = schema.pages.find((p) => p.path === e.target.value);
                    if (selected && selected.sections?.length > 0) {
                      setActiveSectionId(selected.sections[0].id);
                    } else {
                      setActiveSectionId(null);
                    }
                  }}
                  className="w-full text-xs bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-xl p-2.5 text-white transition-all outline-none font-medium"
                >
                  {schema.pages.map((p) => (
                    <option key={p.path} value={p.path}>
                      {p.name} ({p.path})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sections list */}
              {activePage?.sections && activePage.sections.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5" />
                    Sections Outline
                  </label>
                  <div className="space-y-1">
                    {activePage.sections.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setActiveSectionId(s.id)}
                        className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs transition-all ${
                          activeSectionId === s.id
                            ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-semibold shadow-inner'
                            : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        <span>{s.name}</span>
                        <ChevronRight className="h-3 w-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Settings / Fields Form */}
              {activeSection && (
                <div className="pt-4 border-t border-slate-900 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-indigo-500 uppercase font-semibold">
                      Section Variables
                    </span>
                    <h3 className="text-sm font-bold text-white">{activeSection.name}</h3>
                    {activeSection.description && (
                      <p className="text-[10px] text-slate-500 leading-normal">{activeSection.description}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    {activeSection.fields.map((field) => {
                      const value = content[activePagePath]?.[activeSection.id]?.[field.key] ?? field.defaultValue ?? '';
                      return (
                        <div key={field.key} className="space-y-1.5">
                          <div className="flex justify-between">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              {field.label}
                            </label>
                            <span className="text-[9px] font-mono text-slate-600 uppercase">
                              {field.type}
                            </span>
                          </div>

                          {field.type === 'text' && (
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleFieldChange(activeSection.id, field.key, e.target.value)}
                              className="w-full text-xs bg-slate-950 border border-slate-900 hover:border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-2.5 text-white transition-all outline-none"
                            />
                          )}

                          {field.type === 'textarea' && (
                            <textarea
                              rows={3}
                              value={value}
                              onChange={(e) => handleFieldChange(activeSection.id, field.key, e.target.value)}
                              className="w-full text-xs bg-slate-950 border border-slate-900 hover:border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-2.5 text-white transition-all outline-none resize-none"
                            />
                          )}

                          {field.type === 'image' && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="https://..."
                                value={value}
                                onChange={(e) => handleFieldChange(activeSection.id, field.key, e.target.value)}
                                className="w-full text-xs bg-slate-950 border border-slate-900 hover:border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-2.5 text-white transition-all outline-none font-mono"
                              />
                            </div>
                          )}

                          {field.type === 'color' && (
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={value || '#ffffff'}
                                onChange={(e) => handleFieldChange(activeSection.id, field.key, e.target.value)}
                                className="h-9 w-9 bg-slate-950 border border-slate-900 rounded-xl cursor-pointer p-0.5 overflow-hidden"
                              />
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => handleFieldChange(activeSection.id, field.key, e.target.value)}
                                className="flex-1 text-xs bg-slate-950 border border-slate-900 hover:border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2.5 text-white transition-all outline-none font-mono"
                              />
                            </div>
                          )}

                          {field.type === 'number' && (
                            <input
                              type="number"
                              value={value}
                              onChange={(e) => handleFieldChange(activeSection.id, field.key, Number(e.target.value))}
                              className="w-full text-xs bg-slate-950 border border-slate-900 hover:border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-2.5 text-white transition-all outline-none"
                            />
                          )}

                          {field.type === 'boolean' && (
                            <label className="flex items-center gap-2 cursor-pointer py-1">
                              <input
                                type="checkbox"
                                checked={!!value}
                                onChange={(e) => handleFieldChange(activeSection.id, field.key, e.target.checked)}
                                className="h-4 w-4 bg-slate-950 border-slate-900 border text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <span className="text-xs text-slate-300">Enabled</span>
                            </label>
                          )}

                          {field.description && (
                            <p className="text-[9px] text-slate-600 leading-normal">{field.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Visual Editor Canvas - Right */}
        <section className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-8 overflow-hidden relative">
          {!previewUrl ? (
            <div className="max-w-md text-center p-8 border border-dashed border-slate-900 rounded-2xl flex flex-col items-center space-y-4">
              <Globe className="h-10 w-10 text-slate-700" />
              <h4 className="text-sm font-semibold text-slate-300">No hosting deployment active</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add Vercel/Netlify tokens to dashboard connectors, link this project, and deploy to enable real-time visual sandbox sync.
              </p>
            </div>
          ) : (
            <div className={`w-full h-full flex items-center justify-center transition-all ${
              viewportMode === 'mobile' 
                ? 'max-w-[375px]' 
                : viewportMode === 'tablet' 
                  ? 'max-w-[768px]' 
                  : 'max-w-full'
            }`}>
              <div className="w-full h-full border border-slate-900 rounded-2xl overflow-hidden bg-white shadow-2xl relative">
                <iframe
                  ref={iframeRef}
                  src={previewUrl}
                  title="Editor Preview Canvas"
                  className="w-full h-full bg-white border-0"
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
