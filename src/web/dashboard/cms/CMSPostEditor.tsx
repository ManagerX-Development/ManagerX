import { useState, useEffect } from "react";
import { X, Save, Globe, Eye, History, Image as ImageIcon, Sparkles, Hash, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "../../lib/api";
import { useAuth } from "../../components/core/AuthProvider";
import { cn } from "../../lib/utils";
import { Post, POST_TYPES, slugify, Revision } from "./cmsTypes";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CMSPostEditorProps {
  post: Partial<Post>;
  onClose: () => void;
  onSave: () => void;
}

export default function CMSPostEditor({ post: initialPost, onClose, onSave }: CMSPostEditorProps) {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState<Partial<Post>>(initialPost);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'revisions'>('edit');
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  
  // Tag Selection State
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  useEffect(() => {
    fetchTags();
    if (initialPost.id) {
      fetchRevisions();
    }
  }, [initialPost.id]);

  const fetchTags = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/tags`);
      const json = await res.json();
      if (json.success) setAvailableTags(json.data);
    } catch (err) {
      console.error("Failed to fetch tags");
    }
  };

  const fetchRevisions = async () => {
    if (!initialPost.id) return;
    setLoadingRevisions(true);
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/posts/${initialPost.id}/revisions`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "X-User-ID": user?.id || "1427994077332373554"
        }
      });
      const data = await res.json();
      if (data.success) {
        setRevisions(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch revisions");
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleTitleChange = (title: string) => {
    const updates: Partial<Post> = { title };
    if (!initialPost.id || !formData.slug) {
      updates.slug = slugify(title);
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Titel und Inhalt sind erforderlich");
      return;
    }

    setSaving(true);
    try {
      const method = initialPost.id ? "PUT" : "POST";
      const url = initialPost.id 
        ? `${API_URL}/dashboard/cms/posts/${initialPost.id}` 
        : `${API_URL}/dashboard/cms/posts`;

      const res = await fetch(url, {
        method,
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-User-ID": user?.id || "1427994077332373554"
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(initialPost.id ? "Beitrag aktualisiert" : "Beitrag erstellt");
        onSave();
      } else {
        toast.error(data.detail || "Fehler beim Speichern");
      }
    } catch (err) {
      toast.error("Verbindungsfehler zum Server");
    } finally {
      setSaving(false);
    }
  };

  const restoreRevision = async (revId: number) => {
    if (!confirm("Diesen Stand wirklich wiederherstellen? Aktuelle Änderungen gehen verloren.")) return;
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/posts/${initialPost.id}/restore/${revId}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "X-User-ID": user?.id || "1427994077332373554"
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Revision wiederhergestellt");
        onSave(); // Reload everything
      }
    } catch (err) {
      toast.error("Fehler beim Wiederherstellen");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-6xl h-full max-h-[900px] bg-[#0a0a0a] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-tight uppercase">
                {initialPost.id ? "Beitrag bearbeiten" : "Neuer Beitrag"}
              </h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                {formData.post_type} • {formData.title ? "Draft" : "Unbenannt"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 mr-4">
              <button 
                onClick={() => setActiveTab('edit')}
                className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", activeTab === 'edit' ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-white")}
              >
                Editor
              </button>
              <button 
                onClick={() => setActiveTab('preview')}
                className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", activeTab === 'preview' ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-white")}
              >
                Vorschau
              </button>
              {initialPost.id && (
                <button 
                  onClick={() => setActiveTab('revisions')}
                  className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", activeTab === 'revisions' ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-white")}
                >
                  Historie
                </button>
              )}
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              className="btn-primary !px-6 !py-2.5 !text-xs flex items-center gap-2 group"
            >
              <Save className={cn("w-4 h-4 transition-transform", saving ? "animate-spin" : "group-hover:scale-110")} />
              {saving ? "Speichert..." : "Speichern"}
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'edit' && (
            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Fields */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Titel</label>
                  <input 
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Einen packenden Titel wählen..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg font-bold focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-white/20 italic"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inhalt (Markdown)</label>
                    <span className="text-[9px] text-muted-foreground">Wörter: {formData.content?.split(/\s+/).filter(Boolean).length || 0}</span>
                  </div>
                  <textarea 
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Schreibe deinen Beitrag hier..."
                    className="w-full h-[400px] bg-white/5 border border-white/10 rounded-2xl px-6 py-6 text-sm font-medium focus:ring-1 focus:ring-primary outline-none transition-all resize-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kurzfassung (Optional)</label>
                  <textarea 
                    value={formData.excerpt || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Ein kurzer Teaser für die Übersicht..."
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-medium focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="glass-strong rounded-3xl border border-white/10 p-6 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                      <Globe className="w-3.5 h-3.5" /> Publishing
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-muted-foreground ml-1">Typ</label>
                       <select 
                        value={formData.post_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, post_type: e.target.value as any }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                       >
                         {POST_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#0a0a0a]">{t.label}</option>)}
                       </select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-xs font-bold">Veröffentlicht</span>
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, is_published: !prev.is_published }))}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors relative",
                          formData.is_published ? "bg-primary" : "bg-white/10"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                          formData.is_published ? "left-6" : "left-1"
                        )} />
                      </button>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-muted-foreground ml-1 flex items-center gap-1">
                         <Clock className="w-3 h-3" /> Geplant für (Optional)
                       </label>
                       <input 
                        type="datetime-local"
                        value={formData.scheduled_at?.slice(0, 16) || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold outline-none text-white invert-calendar-icon"
                       />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400">
                      <Sparkles className="w-3.5 h-3.5" /> Metadata
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-muted-foreground ml-1">Slug</label>
                       <div className="relative">
                        <input 
                          type="text"
                          value={formData.slug || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 pl-8 text-xs font-mono outline-none"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">/</div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-muted-foreground ml-1">Tags</label>
                       
                       {/* Selected Tags Chips */}
                       <div className="flex flex-wrap gap-2 mb-2">
                         {formData.tags?.split(',').filter(Boolean).map(tag => {
                           const tagData = availableTags.find(t => t.name === tag.trim());
                           return (
                             <span 
                               key={tag}
                               className="px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all animate-in zoom-in-95"
                               style={{ 
                                 backgroundColor: (tagData?.color || '#3b82f6') + '20', 
                                 color: tagData?.color || '#3b82f6',
                                 border: `1px solid ${tagData?.color || '#3b82f6'}40`
                               }}
                             >
                               {tagData?.emoji} {tag}
                               <button 
                                 onClick={() => {
                                   const newTags = formData.tags?.split(',')
                                     .filter(t => t.trim() !== tag.trim())
                                     .join(',');
                                   setFormData(prev => ({ ...prev, tags: newTags }));
                                 }}
                                 className="hover:text-white transition-colors"
                               >
                                 <X className="w-3 h-3" />
                               </button>
                             </span>
                           );
                         })}
                       </div>

                       <div className="relative">
                        <input 
                          type="text"
                          value={tagInput}
                          placeholder="Tag suchen oder neu erstellen..."
                          onChange={(e) => {
                            setTagInput(e.target.value);
                            setShowTagSuggestions(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && tagInput.trim()) {
                              e.preventDefault();
                              const currentTags = formData.tags?.split(',').filter(Boolean) || [];
                              if (!currentTags.includes(tagInput.trim())) {
                                const newTags = [...currentTags, tagInput.trim()].join(',');
                                setFormData(prev => ({ ...prev, tags: newTags }));
                              }
                              setTagInput("");
                            }
                          }}
                          onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                          onFocus={() => setShowTagSuggestions(true)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 pl-8 text-xs outline-none focus:border-primary transition-colors"
                        />
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />

                        {/* Suggestions Dropdown */}
                        {showTagSuggestions && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl z-[110] max-h-40 overflow-y-auto p-1 no-scrollbar">
                            {availableTags
                              .filter(t => t.name.toLowerCase().includes(tagInput.toLowerCase()) && !formData.tags?.split(',').map(s => s.trim()).includes(t.name))
                              .map(tag => (
                                <button
                                  key={tag.id}
                                  onClick={() => {
                                    const currentTags = formData.tags?.split(',').filter(Boolean) || [];
                                    const newTags = [...currentTags, tag.name].join(',');
                                    setFormData(prev => ({ ...prev, tags: newTags }));
                                    setTagInput("");
                                    setShowTagSuggestions(false);
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center justify-between group transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{tag.emoji}</span>
                                    <span className="text-xs font-bold">{tag.name}</span>
                                  </div>
                                  <div 
                                    className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" 
                                    style={{ backgroundColor: tag.color, color: tag.color }} 
                                  />
                                </button>
                              ))
                            }
                            {tagInput && !availableTags.some(t => t.name.toLowerCase() === tagInput.toLowerCase()) && (
                              <button
                                onClick={() => {
                                  const currentTags = formData.tags?.split(',').filter(Boolean) || [];
                                  const newTags = [...currentTags, tagInput.trim()].join(',');
                                  setFormData(prev => ({ ...prev, tags: newTags }));
                                  setTagInput("");
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-[10px] font-bold text-primary"
                              >
                                Neu erstellen: "{tagInput}"
                              </button>
                            )}
                          </div>
                        )}
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-muted-foreground ml-1">Cover Image URL</label>
                       <div className="relative">
                        <input 
                          type="text"
                          value={formData.cover_image || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, cover_image: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 pl-8 text-xs outline-none"
                        />
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="p-8 max-w-4xl mx-auto">
              <div className="glass-strong rounded-[2.5rem] border border-white/10 overflow-hidden bg-black/40">
                {formData.cover_image && (
                  <div className="w-full h-64 overflow-hidden border-b border-white/10">
                    <img src={formData.cover_image} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-12">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                      {formData.post_type} UPDATE
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">VORSCHAU</span>
                  </div>
                  <h1 className="text-5xl font-black italic tracking-tighter mb-10 leading-tight">
                    {formData.title || "Unbenannter Beitrag"}
                  </h1>
                  <div className="prose prose-invert prose-primary max-w-none 
                    prose-p:text-muted-foreground prose-p:text-lg prose-p:font-medium
                    prose-headings:italic prose-headings:font-black
                    prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{formData.content || "_Kein Inhalt_"}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'revisions' && (
            <div className="p-8 max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-8 ml-2">
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
                          <span>•</span>
                          <span>Von {rev.changed_by_name}</span>
                          {rev.change_note && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400/80">{rev.change_note}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => restoreRevision(rev.id)}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-primary hover:text-white text-[10px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100"
                      >
                        Wiederherstellen
                      </button>
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
        .invert-calendar-icon::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
