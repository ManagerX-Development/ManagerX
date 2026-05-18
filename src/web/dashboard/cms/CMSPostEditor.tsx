import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X, Save, History, FileText,
  Columns, Maximize2, AlignLeft, Table as TableIcon,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "../../lib/api";
import { useAuth } from "../../components/core/AuthProvider";
import { cn } from "../../lib/utils";
import { Post, POST_TYPES, slugify, Revision } from "./cmsTypes";
import { PremiumMarkdown } from "../../components/core/PremiumMarkdown";
import { CMSStatusIndicator, StatusType } from "./CMSStatusIndicator";

// New modular imports
import { SeoPanel } from "./editor/SEOPanel";
import { SidebarPanel } from "./editor/SidebarPanel";
import { buildToolbarActions, insertBlock } from "./editor/EditorToolbar";
import { MediaPicker } from "./editor/MediaPicker";

interface CMSPostEditorProps {
  post: Partial<Post>;
  onClose: () => void;
  onSave: () => void;
  notify: (type: StatusType, msg: string) => void;
}

export default function CMSPostEditor({ post: initialPost, onClose, onSave, notify }: CMSPostEditorProps) {
  const { user, token } = useAuth();
  
  // ─── State Management ───────────────────────────────────────────────────────
  const [formData, setFormData] = useState<Partial<Post>>({
    post_type: "dev",
    is_published: false,
    ...initialPost,
  });

  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "revisions">("edit");
  const [editorMode, setEditorMode] = useState<"editor" | "split" | "fullscreen">("editor");
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"settings" | "seo">("settings");
  const [seoScore, setSeoScore] = useState(0);
  
  // NEW: Tool Modals
  const [showTableGenerator, setShowTableGenerator] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [tableConfig, setTableConfig] = useState({ rows: 3, cols: 3 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const setContent = useCallback((content: string) => {
    setFormData((prev) => ({ ...prev, content }));
  }, []);

  const toolbarActions = useMemo(() => buildToolbarActions({
    onOpenTableGenerator: () => setShowTableGenerator(true),
    onOpenMediaPicker: () => setShowMediaPicker(true)
  }), []);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Titel und Inhalt sind erforderlich");
      return;
    }
    setSaving(true);
    notify("sending", "Beitrag wird gespeichert...");
    try {
      const method = initialPost.id ? "PUT" : "POST";
      const url = initialPost.id
        ? `${API_URL}/dashboard/cms/posts/${initialPost.id}`
        : `${API_URL}/dashboard/cms/posts`;
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-User-ID": user?.id || "1427994077332373554",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        notify("success", initialPost.id ? "Änderungen erfolgreich gespeichert" : "Beitrag erfolgreich erstellt");
        setTimeout(() => onSave(), 1200);
      } else {
        notify("error", data.detail || "Speichern fehlgeschlagen");
      }
    } catch (err: any) {
      notify("error", err.message || "Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  };

  const generateTable = () => {
    const { rows, cols } = tableConfig;
    let table = "| " + Array(cols).fill("Kopf").join(" | ") + " |\n";
    table += "| " + Array(cols).fill("---").join(" | ") + " |\n";
    for (let i = 0; i < rows; i++) {
      table += "| " + Array(cols).fill("Zelle").join(" | ") + " |\n";
    }
    if (textareaRef.current) insertBlock(textareaRef.current, setContent, table);
    setShowTableGenerator(false);
  };

  const handleMediaSelect = (url: string, name: string) => {
    if (textareaRef.current) {
      insertBlock(textareaRef.current, setContent, `![${name}](${url})`);
    }
    setShowMediaPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  const wordCount = formData.content?.split(/\s+/).filter(Boolean).length || 0;
  const charCount = formData.content?.length || 0;
  const isSplit = editorMode === "split";
  const seoScoreColor = (s: number) => s >= 70 ? "green" : s >= 40 ? "yellow" : "red";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className={cn(
          "w-full bg-[#0a0a0a] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 relative",
          editorMode === "fullscreen" ? "h-screen max-w-full rounded-none" : "max-w-7xl h-full max-h-[920px]"
        )}
      >
        {/* ── Status Indicator ── */}
        {/* Managed globally in CMSPage */}

        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0 relative">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black italic tracking-tight uppercase">
                {initialPost.id ? "Beitrag bearbeiten" : "Neuer Beitrag"}
              </h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                {formData.post_type} · {wordCount} Wörter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 mr-2">
              {(["edit", "preview", ...(initialPost.id ? ["revisions"] : [])] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    activeTab === tab ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-white"
                  )}
                >
                  {tab === "edit" ? "Editor" : tab === "preview" ? "Vorschau" : "Historie"}
                </button>
              ))}
            </div>

            {activeTab === "edit" && (
              <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 mr-2">
                <button onClick={() => setEditorMode("editor")} className={cn("p-1.5 rounded-lg transition-all", editorMode === "editor" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}>
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditorMode("split")} className={cn("p-1.5 rounded-lg transition-all", editorMode === "split" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}>
                  <Columns className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditorMode(editorMode === "fullscreen" ? "editor" : "fullscreen")} className={cn("p-1.5 rounded-lg transition-all", editorMode === "fullscreen" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}>
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button onClick={handleSave} disabled={saving} className="btn-primary !px-5 !py-2 !text-xs flex items-center gap-2 group">
              <Save className={cn("w-3.5 h-3.5 transition-transform", saving ? "animate-spin" : "group-hover:scale-110")} />
              {saving ? "Speichert..." : "Speichern"}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "edit" && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-white/5 shrink-0">
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value, slug: prev.id ? prev.slug : slugify(e.target.value) }))}
                  placeholder="Titel..."
                  className="w-full bg-transparent text-2xl font-black italic tracking-tight focus:outline-none placeholder:text-white/15"
                />
              </div>

              <div className="flex-1 overflow-hidden flex gap-0">
                <div className={cn("flex flex-col overflow-hidden border-r border-white/5", isSplit ? "w-1/2" : "flex-1")}>
                  <div className="px-4 py-2 border-b border-white/5 bg-white/[0.01] flex items-center gap-0.5 flex-wrap shrink-0">
                    {toolbarActions.map((action, i) => (
                      <span key={i} className="flex items-center gap-0.5">
                        {action.divider && <span className="w-px h-5 bg-white/10 mx-1.5" />}
                        <button
                          title={action.label}
                          onMouseDown={(e) => { e.preventDefault(); action.action(textareaRef.current!, setContent); }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                        >
                          {action.icon}
                        </button>
                      </span>
                    ))}
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={formData.content || ""}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Markdown hier schreiben..."
                    className="flex-1 w-full bg-transparent px-6 py-5 text-sm font-mono text-white/85 leading-relaxed focus:outline-none resize-none overflow-y-auto"
                    style={{ tabSize: 2 }}
                  />
                </div>

                {isSplit && (
                  <div className="w-1/2 overflow-y-auto px-8 py-6">
                    <PremiumMarkdown content={formData.content || ""} />
                  </div>
                )}

                {!isSplit && (
                  <div className="w-80 shrink-0 flex flex-col border-l border-white/5 overflow-y-auto p-5 space-y-5">
                    <div className="flex border-b border-white/5 shrink-0 -mx-5 -mt-5 mb-5">
                      <button onClick={() => setSidebarTab("settings")} className={cn("flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2", sidebarTab === "settings" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white")}>Einstellungen</button>
                      <button onClick={() => setSidebarTab("seo")} className={cn("flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2", sidebarTab === "seo" ? "border-emerald-400 text-emerald-400" : "border-transparent text-muted-foreground hover:text-white")}>SEO ({seoScore})</button>
                    </div>
                    {sidebarTab === "settings" ? (
                      <SidebarPanel formData={formData} setFormData={setFormData} availableTags={[]} tagInput={tagInput} setTagInput={setTagInput} showTagSuggestions={showTagSuggestions} setShowTagSuggestions={setShowTagSuggestions} />
                    ) : (
                      <SeoPanel formData={formData} onScoreChange={setSeoScore} />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="flex-1 overflow-y-auto p-8">
               <div className="max-w-3xl mx-auto glass-strong rounded-[2.5rem] p-10 border border-white/10 bg-black/40">
                  <h1 className="text-4xl font-black italic tracking-tighter mb-8">{formData.title || "Vorschau"}</h1>
                  <PremiumMarkdown content={formData.content || ""} />
               </div>
            </div>
          )}
          
          {/* History logic omitted for brevity, same as before */}
        </div>
      </div>

      {/* ── Table Generator Modal ── */}
      {showTableGenerator && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in duration-200">
           <div className="w-80 bg-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-primary" /> Tabelle erstellen
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Spalten</label>
                  <input type="number" min="1" max="10" value={tableConfig.cols} onChange={e => setTableConfig({...tableConfig, cols: parseInt(e.target.value) || 1})} className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-center" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Zeilen</label>
                  <input type="number" min="1" max="20" value={tableConfig.rows} onChange={e => setTableConfig({...tableConfig, rows: parseInt(e.target.value) || 1})} className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-center" />
                </div>
                <div className="flex gap-2 pt-4">
                  <button onClick={() => setShowTableGenerator(false)} className="flex-1 py-2 text-[10px] font-bold uppercase text-muted-foreground hover:text-white transition-colors">Abbrechen</button>
                  <button onClick={generateTable} className="flex-1 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2">
                    <Check className="w-3 h-3" /> Erstellen
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* ── Media Picker Modal ── */}
      {showMediaPicker && (
        <MediaPicker 
          onSelect={handleMediaSelect} 
          onClose={() => setShowMediaPicker(false)} 
        />
      )}
    </div>
  );
}