import { useState } from "react";
import { Plus, Trash2, Save, FileText, Sparkles, Wrench, Zap, Eye } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "../../lib/api";
import { useAuth } from "../../components/core/AuthProvider";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../../lib/utils";

interface ChangelogItem {
  id: string;
  type: 'new' | 'fix' | 'improve';
  text: string;
}

const CATEGORIES = {
  new: { label: 'Neu', icon: Sparkles, color: 'text-emerald-400', emoji: '✨' },
  fix: { label: 'Fixes', icon: Wrench, color: 'text-rose-400', emoji: '🛠️' },
  improve: { label: 'Verbesserungen', icon: Zap, color: 'text-amber-400', emoji: '⚡' },
};

export default function CMSChangelogTab() {
  const { user, token } = useAuth();
  const [version, setVersion] = useState("v2.0.0");
  const [items, setItems] = useState<ChangelogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const addItem = (type: 'new' | 'fix' | 'improve') => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), type, text: "" }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, text: string) => {
    setItems(items.map(i => i.id === id ? { ...i, text } : i));
  };

  const generateMarkdown = () => {
    let md = `# Changelog ${version}\n\n`;
    
    (['new', 'fix', 'improve'] as const).forEach(cat => {
      const catItems = items.filter(i => i.type === cat);
      if (catItems.length > 0) {
        md += `### ${CATEGORIES[cat].emoji} ${CATEGORIES[cat].label}\n`;
        catItems.forEach(item => {
          if (item.text) md += `- ${item.text}\n`;
        });
        md += `\n`;
      }
    });

    return md;
  };

  const handleSave = async () => {
    if (!version) return toast.error("Bitte Version angeben");
    if (items.length === 0) return toast.error("Bitte mindestens einen Eintrag hinzufügen");

    setLoading(true);
    try {
      const content = generateMarkdown();
      const res = await fetch(`${API_URL}/dashboard/cms/posts`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-User-ID": user?.id || "1427994077332373554"
        },
        body: JSON.stringify({
          title: `Update ${version}`,
          slug: `update-${version.replace(/\./g, '-')}`,
          content: content,
          post_type: 'changelog',
          is_published: true,
          author_id: user?.id,
          tags: 'Update,Changelog'
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Changelog veröffentlicht!");
        setItems([]); // Clear after success
      } else {
        toast.error(data.detail || "Fehler beim Speichern");
      }
    } catch (err) {
      toast.error("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Editor Side */}
      <div className="space-y-6">
        <div className="glass-strong rounded-[2.5rem] border border-white/10 p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black italic uppercase tracking-tight">Changelog Generator</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Einfach professionelle Updates erstellen</p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase">Version</span>
              <input 
                type="text" 
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-black text-primary w-16 text-right"
              />
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-3 gap-3">
            {(['new', 'fix', 'improve'] as const).map((cat) => {
                const Icon = CATEGORIES[cat].icon;
                return (
                  <button
                    key={cat}
                    onClick={() => addItem(cat)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group",
                      CATEGORIES[cat].color
                    )}
                  >
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{CATEGORIES[cat].label}</span>
                  </button>
                );
              })}
          </div>

          {/* Items List */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
            {items.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl">
                <FileText className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Noch keine Einträge hinzugefügt</p>
              </div>
            ) : (
              items.map((item) => {
                const ItemIcon = CATEGORIES[item.type].icon;
                return (
                  <div key={item.id} className="flex items-start gap-3 group animate-in slide-in-from-left-4 duration-300">
                    <div className={cn("mt-3 shrink-0", CATEGORIES[item.type].color)}>
                      <ItemIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={item.text}
                        onChange={(e) => updateItem(item.id, e.target.value)}
                        placeholder={`${CATEGORIES[item.type].label} beschreiben...`}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-primary outline-none transition-all resize-none h-16"
                      />
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="mt-3 p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 !py-4 group"
          >
            <Save className={cn("w-5 h-5", loading ? "animate-spin" : "group-hover:rotate-12 transition-transform")} />
            <span className="font-black uppercase tracking-widest text-sm">Update veröffentlichen</span>
          </button>
        </div>
      </div>

      {/* Preview Side */}
      <div className="space-y-6">
        <div className="glass-strong rounded-[2.5rem] border border-white/10 p-8 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-black italic uppercase tracking-tight">Live Vorschau</h2>
          </div>

          <div className="flex-1 bg-black/40 rounded-3xl p-8 border border-white/5 overflow-y-auto no-scrollbar">
            <div className="prose prose-invert prose-primary max-w-none 
              prose-headings:font-black prose-headings:italic
              prose-p:text-muted-foreground prose-p:text-sm
              prose-li:text-muted-foreground prose-li:text-sm
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{generateMarkdown()}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
