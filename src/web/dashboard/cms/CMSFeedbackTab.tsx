import { useState, useEffect } from "react";
import { 
  MessageSquare, Bug, Lightbulb, CheckCircle2, 
  Trash2, XCircle, Map, User, Clock
} from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "../../lib/api";
import { useAuth } from "../../components/core/AuthProvider";
import { FeedbackItem } from "./cmsTypes";
import { cn } from "../../lib/utils";

export default function CMSFeedbackTab() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "read" | "accepted" | "rejected">("all");

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/feedback`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "X-User-ID": user?.id || ""
        }
      });
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch (err) {
      toast.error("Fehler beim Laden des Feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    const oldItems = [...items];
    // Optimistic Update
    setItems(items.map(i => i.id === id ? { ...i, status: status as any } : i));

    try {
      const res = await fetch(`${API_URL}/dashboard/cms/feedback/${id}/status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-User-ID": user?.id || ""
        },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Status aktualisiert");
      } else {
        setItems(oldItems);
        toast.error("Fehler beim Aktualisieren");
      }
    } catch (err) {
      setItems(oldItems);
      toast.error("Fehler beim Aktualisieren");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Feedback wirklich löschen?")) return;
    
    const oldItems = [...items];
    // Optimistic Update
    setItems(items.filter(i => i.id !== id));

    try {
      const res = await fetch(`${API_URL}/dashboard/cms/feedback/${id}`, {
        method: "DELETE",
        headers: { 
            "Authorization": `Bearer ${token}`,
            "X-User-ID": user?.id || ""
        }
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Feedback gelöscht");
      } else {
        setItems(oldItems);
        toast.error("Fehler beim Löschen");
      }
    } catch (err) {
      setItems(oldItems);
      toast.error("Fehler beim Löschen");
    }
  };

  const handleToRoadmap = async (id: number) => {
    if (!confirm("Diesen Vorschlag direkt in die Roadmap aufnehmen?")) return;
    
    const oldItems = [...items];
    // Optimistic Update
    setItems(items.map(i => i.id === id ? { ...i, status: 'accepted' } : i));

    try {
      const res = await fetch(`${API_URL}/dashboard/cms/feedback/${id}/to-roadmap`, {
        method: "POST",
        headers: { 
            "Authorization": `Bearer ${token}`,
            "X-User-ID": user?.id || ""
        }
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Erfolgreich zur Roadmap hinzugefügt!");
      } else {
        setItems(oldItems);
        toast.error(json.detail || "Fehler beim Übernehmen");
      }
    } catch (err) {
      setItems(oldItems);
      toast.error("Fehler beim Übernehmen in die Roadmap");
    }
  };

  const filteredItems = items.filter(i => filter === "all" || i.status === filter);

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'new': return <span className="bg-primary/20 text-primary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">Neu</span>;
          case 'read': return <span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">Gelesen</span>;
          case 'accepted': return <span className="bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">In Roadmap</span>;
          case 'rejected': return <span className="bg-rose-500/20 text-rose-500 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">Abgelehnt</span>;
          default: return null;
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-black italic tracking-tight uppercase">Feedback & Bugs</h2>
        </div>
        
        {/* Filter */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 w-full md:w-auto overflow-x-auto no-scrollbar">
            {(["all", "new", "read", "accepted", "rejected"] as const).map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                        filter === f ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                    )}
                >
                    {f === "all" ? "Alle" : f === "new" ? "Neu" : f === "read" ? "Gelesen" : f === "accepted" ? "Angenommen" : "Abgelehnt"}
                </button>
            ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
         <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
           <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
           <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Kein Feedback gefunden</p>
         </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className={cn(
                  "glass-strong rounded-3xl border p-6 flex flex-col md:flex-row gap-6 transition-all",
                  item.status === 'new' ? "border-primary/50 shadow-[0_0_30px_-10px_rgba(var(--primary-rgb),0.2)]" : "border-white/5"
              )}
            >
              {/* Type Icon */}
              <div className="shrink-0">
                  <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      item.type === 'bug' ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                      {item.type === 'bug' ? <Bug className="w-6 h-6" /> : <Lightbulb className="w-6 h-6" />}
                  </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                      {getStatusBadge(item.status)}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">
                          <User className="w-3 h-3" />
                          <span className="font-bold">{item.user_name}</span>
                          <span className="opacity-50 text-[10px]">({item.user_id})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(item.created_at).toLocaleString('de-DE')}</span>
                      </div>
                  </div>
                  
                  <div className="text-sm text-slate-300 bg-black/40 p-4 rounded-2xl whitespace-pre-wrap font-medium leading-relaxed border border-white/5">
                      {item.content}
                  </div>
              </div>

              {/* Actions */}
              <div className="flex flex-row md:flex-col gap-2 shrink-0 md:w-48">
                  {item.status === 'new' && (
                      <button 
                        onClick={() => handleUpdateStatus(item.id, 'read')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-blue-500 hover:text-white text-muted-foreground rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
                      >
                          <CheckCircle2 className="w-4 h-4" />
                          Als gelesen
                      </button>
                  )}
                  
                  {item.status !== 'accepted' && (
                      <button 
                        onClick={() => handleToRoadmap(item.id)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
                      >
                          <Map className="w-4 h-4" />
                          In Roadmap
                      </button>
                  )}

                  {item.status !== 'rejected' && item.status !== 'accepted' && (
                      <button 
                        onClick={() => handleUpdateStatus(item.id, 'rejected')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 text-muted-foreground rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
                      >
                          <XCircle className="w-4 h-4" />
                          Ablehnen
                      </button>
                  )}

                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="flex-none flex items-center justify-center p-2.5 bg-white/5 hover:bg-red-500 hover:text-white text-muted-foreground rounded-xl transition-all"
                    title="Löschen"
                  >
                      <Trash2 className="w-4 h-4" />
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
