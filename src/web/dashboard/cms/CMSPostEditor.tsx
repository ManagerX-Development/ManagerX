import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X, Save, History, FileText,
  Columns, Maximize2, AlignLeft
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

interface CMSPostEditorProps {
  post: Partial<Post>;
  onClose: () => void;
  onSave: () => void;
}

export default function CMSPostEditor({ post: initialPost, onClose, onSave }: CMSPostEditorProps) {
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
  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolbarActions = useMemo(() => buildToolbarActions(), []);

  // ─── Side Effects ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "revisions" && initialPost.id) {
      fetchRevisions();
    }
  }, [activeTab, initialPost.id]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const setContent = useCallback((content: string) => {
    setFormData((prev) => ({ ...prev, content }));
  }, []);

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.id ? prev.slug : slugify(title),
    }));
  };

  const fetchRevisions = async () => {
    setLoadingRevisions(true);
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/posts/${initialPost.id}/revisions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setRevisions(data.data);
    } catch {
      toast.error("Revisionen konnten nicht geladen werden");
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Titel und Inhalt sind erforderlich");
      return;
    }
    setSaving(true);
    setStatus("sending");
    setStatusMessage("Beitrag wird gespeichert...");
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
        toast.success(initialPost.id ? "Beitrag aktualisiert" : "Beitrag erstellt");
        setStatus("success");
        setStatusMessage(initialPost.id ? "Änderungen gespeichert" : "Beitrag veröffentlicht");
        
        setTimeout(() => {
          setStatus("idle");
          onSave();
        }, 1200);
      } else {
        toast.error(data.detail || "Fehler beim Speichern");
        setStatus("error");
        setStatusMessage(data.detail || "Speichern fehlgeschlagen");
      }
    } catch (err: any) {
      toast.error("Verbindungsfehler zum Server");
      setStatus("error");
      setStatusMessage(err.message || "Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  };

  const restoreRevision = async (revId: number) => {
    if (!confirm("Diesen Stand wirklich wiederherstellen?")) return;
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/posts/${initialPost.id}/restore/${revId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "X-User-ID": user?.id || "1427994077332373554" }
      });
      const data = await res.json();
      if (data.success) {
        setFormData(data.data);
        setActiveTab("edit");
        toast.success("Revision wiederhergestellt");
      }
    } catch {
      toast.error("Fehler beim Wiederherstellen");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      ta.value = ta.value.substring(0, start) + "  " + ta.value.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 2;
      setContent(ta.value);
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
          "w-full bg-[#0a0a0a] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden transition-all duration-300",
          editorMode === "fullscreen" ? "h-screen max-w-full rounded-none" : "max-w-7xl h-full max-h-[920px]"
        )}
      >
        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0 relative">
          <CMSStatusIndicator status={status} message={statusMessage} onClear={() => setStatus("idle")} />
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black italic tracking-tight uppercase">
                {initialPost.id ? "Beitrag bearbeiten" : "Neuer Beitrag"}
              </h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                {formData.post_type} · {wordCount} Wörter · {charCount} Zeichen
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
                <button onClick={() => setEditorMode("editor")} title="Nur Editor" className={cn("p-1.5 rounded-lg transition-all", editorMode === "editor" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}>
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditorMode("split")} title="Split View" className={cn("p-1.5 rounded-lg transition-all", editorMode === "split" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}>
                  <Columns className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditorMode(editorMode === "fullscreen" ? "editor" : "fullscreen")} title="Vollbild" className={cn("p-1.5 rounded-lg transition-all", editorMode === "fullscreen" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}>
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
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Einen packenden Titel wählen..."
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
                          onMouseDown={(e) => { e.preventDefault(); if (textareaRef.current) action.action(textareaRef.current, setContent); }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                        >
                          {action.icon}
                        </button>
                      </span>
                    ))}
                    <span className="w-px h-5 bg-white/10 mx-1.5" />
                    <button
                      title="Codeblock mit Sprache"
                      onMouseDown={(e) => { e.preventDefault(); if (textareaRef.current) insertBlock(textareaRef.current, setContent, "```javascript\n// Dein Code hier\n```"); }}
                      className="px-2 py-1 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all text-[9px] font-mono font-bold"
                    >
                      {"</>"}
                    </button>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={formData.content || ""}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={"Schreibe deinen Beitrag hier in Markdown...\n\nTipps:\n• **Fett**, _kursiv_, `code`\n• # Überschrift 1, ## Überschrift 2\n• - Liste oder 1. Nummeriert\n• > Zitat\n• Zweimal Enter = neuer Absatz"}
                    spellCheck
                    className="flex-1 w-full bg-transparent px-6 py-5 text-sm font-mono text-white/85 leading-relaxed focus:outline-none resize-none placeholder:text-white/15 placeholder:font-sans placeholder:not-italic overflow-y-auto"
                    style={{ tabSize: 2 }}
                  />

                  <div className="px-6 py-2 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-[10px] text-muted-foreground font-mono shrink-0">
                    <span>Markdown · UTF-8</span>
                    <span>{wordCount} Wörter · {charCount} Zeichen</span>
                  </div>
                </div>

                {isSplit && (
                  <div className="w-1/2 overflow-y-auto px-8 py-6">
                    <PremiumMarkdown content={formData.content || ""} />
                  </div>
                )}

                {!isSplit && (
                  <div className="w-80 shrink-0 flex flex-col border-l border-white/5">
                    <div className="flex border-b border-white/5 shrink-0">
                      <button onClick={() => setSidebarTab("settings")} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2", sidebarTab === "settings" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white")}>
                         Einstellungen
                      </button>
                      <button onClick={() => setSidebarTab("seo")} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 relative", sidebarTab === "seo" ? "border-emerald-400 text-emerald-400" : "border-transparent text-muted-foreground hover:text-white")}>
                         SEO
                        <span className={cn("absolute top-1.5 right-3 text-[8px] font-black px-1 rounded", seoScoreColor(seoScore) === "green" ? "bg-emerald-400/20 text-emerald-400" : seoScoreColor(seoScore) === "yellow" ? "bg-amber-400/20 text-amber-400" : "bg-red-400/20 text-red-400")}>
                          {seoScore}
                        </span>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                      {sidebarTab === "settings" ? (
                        <SidebarPanel formData={formData} setFormData={setFormData} availableTags={initialPost.id ? [] : [] /* will be passed from props in future */} tagInput={tagInput} setTagInput={setTagInput} showTagSuggestions={showTagSuggestions} setShowTagSuggestions={setShowTagSuggestions} />
                      ) : (
                        <SeoPanel formData={formData} onScoreChange={setSeoScore} />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {isSplit && (
                <div className="shrink-0 border-t border-white/5 overflow-x-auto">
                  <div className="flex gap-6 px-6 py-4 min-w-max">
                    <SidebarPanel formData={formData} setFormData={setFormData} availableTags={[]} tagInput={tagInput} setTagInput={setTagInput} showTagSuggestions={showTagSuggestions} setShowTagSuggestions={setShowTagSuggestions} horizontal />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "preview" && (
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto glass-strong rounded-[2.5rem] border border-white/10 overflow-hidden bg-black/40">
                {formData.cover_image && (
                  <div className="w-full h-64 overflow-hidden border-b border-white/10">
                    <img src={formData.cover_image} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">{formData.post_type}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Vorschau</span>
                  </div>
                  <h1 className="text-4xl font-black italic tracking-tighter mb-8 leading-tight">{formData.title || "Unbenannter Beitrag"}</h1>
                  <PremiumMarkdown content={formData.content || ""} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "revisions" && (
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
              <div className="flex items-center gap-2 mb-6 ml-2">
                <History className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold italic tracking-tight">Revisionshistorie</h3>
              </div>
              {loadingRevisions ? (
                <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : revisions.length > 0 ? (
                <div className="space-y-3">
                  {revisions.map((rev) => (
                    <div key={rev.id} className="flex items-center justify-between p-5 glass-strong rounded-2xl border border-white/5 hover:border-white/20 transition-all group">
                      <div>
                        <div className="font-bold text-sm text-white/90 group-hover:text-primary transition-colors">{rev.title}</div>
                        <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2 mt-1 uppercase tracking-wider">
                          <span>{new Date(rev.changed_at).toLocaleString()}</span>
                          <span>·</span>
                          <span>Von {rev.changed_by_name}</span>
                          {rev.change_note && (<><span>·</span><span className="text-amber-400/80">{rev.change_note}</span></>)}
                        </div>
                      </div>
                      <button onClick={() => restoreRevision(rev.id)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-primary hover:text-white text-[10px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100">Wiederherstellen</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <History className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Noch keine Revisionen vorhanden</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .invert-calendar-icon::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
        textarea::-webkit-scrollbar { width: 4px; }
        textarea::-webkit-scrollbar-track { background: transparent; }
        textarea::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>
    </div>
  );
}