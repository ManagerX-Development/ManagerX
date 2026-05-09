import { useState, useEffect } from "react";
import { 
  Plus, Trash2, Save, Rocket, CheckCircle2, CircleDashed, 
  Clock, Map, ChevronUp, ChevronDown, Edit3, X 
} from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "../../lib/api";
import { useAuth } from "../../components/core/AuthProvider";
import { RoadmapItem } from "./cmsTypes";
import { cn } from "../../lib/utils";

const STATUS_OPTIONS = [
  { value: "completed",   label: "Abgeschlossen", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  { value: "in-progress", label: "In Arbeit",     color: "text-primary",     bg: "bg-primary/10",     icon: CircleDashed },
  { value: "planned",     label: "Geplant",       color: "text-slate-400",   bg: "bg-white/5",        icon: Clock },
];

const ICON_OPTIONS = [
  "Rocket", "CheckCircle2", "CircleDashed", "Clock", "Sparkles", 
  "MessageSquare", "ShieldAlert", "Zap", "Globe", "Cpu", "LayoutDashboard",
  "FileText", "Image", "BookOpen", "ArrowLeft", "Hash", "ListTodo", "Map"
];

export default function CMSRoadmapTab() {
  const { token } = useAuth();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<RoadmapItem> | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/roadmap`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch (err) {
      toast.error("Fehler beim Laden der Roadmap");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem?.title || !editingItem?.description) {
      return toast.error("Bitte Titel und Beschreibung ausfüllen");
    }

    try {
      const isNew = !editingItem.id;
      const url = isNew 
        ? `${API_URL}/dashboard/cms/roadmap` 
        : `${API_URL}/dashboard/cms/roadmap/${editingItem.id}`;
      
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editingItem)
      });

      const json = await res.json();
      if (json.success) {
        toast.success(isNew ? "Eintrag erstellt" : "Eintrag aktualisiert");
        setShowModal(false);
        setEditingItem(null);
        fetchRoadmap();
      } else {
        toast.error(json.detail || "Fehler beim Speichern");
      }
    } catch (err) {
      toast.error("Verbindungsfehler");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Diesen Eintrag wirklich löschen?")) return;
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/roadmap/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Eintrag gelöscht");
        fetchRoadmap();
      }
    } catch (err) {
      toast.error("Fehler beim Löschen");
    }
  };

  const openEdit = (item: RoadmapItem | null = null) => {
    setEditingItem(item || { 
      title: "", 
      status: "planned", 
      description: "", 
      icon: "Rocket", 
      date_info: "", 
      order_index: items.length 
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Map className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-black italic tracking-tight uppercase">Roadmap Verwaltung</h2>
        </div>
        <button 
          onClick={() => openEdit()}
          className="btn-primary flex items-center gap-2 !py-2.5 !px-5"
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Eintrag hinzufügen</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => {
            const status = STATUS_OPTIONS.find(s => s.value === item.status) || STATUS_OPTIONS[2];
            const StatusIcon = status.icon;
            
            return (
              <div 
                key={item.id}
                className="glass-strong rounded-3xl border border-white/5 p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-primary/30 transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/10 group-hover:scale-110 transition-transform">
                  <Rocket className="w-8 h-8" />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                    <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5", status.bg, status.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.date_info}</span>
                  </div>
                  <h3 className="text-lg font-black italic tracking-tight text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 italic">{item.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEdit(item)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
              <Map className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Noch keine Roadmap-Einträge vorhanden</p>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {showModal && editingItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xl glass-strong rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-black italic uppercase tracking-tight">Eintrag bearbeiten</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Titel</label>
                  <input 
                    type="text"
                    value={editingItem.title}
                    onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                    placeholder="z.B. Version 2.0 Launch"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Datum/Info</label>
                  <input 
                    type="text"
                    value={editingItem.date_info}
                    onChange={e => setEditingItem({...editingItem, date_info: e.target.value})}
                    placeholder="z.B. Q1 2026"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setEditingItem({...editingItem, status: opt.value as any})}
                      className={cn(
                        "py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-tighter flex flex-col items-center gap-1 transition-all",
                        editingItem.status === opt.value 
                          ? "bg-primary/20 border-primary text-primary" 
                          : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                      )}
                    >
                      <opt.icon className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Beschreibung</label>
                <textarea 
                  value={editingItem.description}
                  onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                  placeholder="Was beinhaltet dieser Meilenstein?"
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sortierung</label>
                  <input 
                    type="number"
                    value={editingItem.order_index}
                    onChange={e => setEditingItem({...editingItem, order_index: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Icon (Name)</label>
                  <select 
                    value={editingItem.icon}
                    onChange={e => setEditingItem({...editingItem, icon: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  >
                    {ICON_OPTIONS.map(icon => <option key={icon} value={icon} className="bg-black">{icon}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/10 bg-white/[0.02] flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Abbrechen
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-4 bg-primary hover:bg-primary/80 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
