import { useState, useEffect } from "react";
import { ShieldAlert, Trash2, UserPlus, Search, ShieldCheck, Clock, User as UserIcon, X } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "../../lib/api";
import { useAuth } from "../../components/core/AuthProvider";
import { cn } from "../../lib/utils";

interface BlacklistEntry {
  user_id: string;
  reason: string;
  admin_id: string;
  admin_name: string;
  created_at: string;
}

interface AdminBlacklistProps {
  onClose: () => void;
}

export default function AdminBlacklist({ onClose }: AdminBlacklistProps) {
  const { user, token } = useAuth();
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    user_id: "",
    reason: ""
  });

  useEffect(() => {
    fetchBlacklist();
  }, []);

  const fetchBlacklist = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/blacklist`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setEntries(json.data);
    } catch (err) {
      toast.error("Blacklist konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id) return toast.error("Bitte eine Discord-ID eingeben");

    try {
      const res = await fetch(`${API_URL}/admin/blacklist`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        toast.success("User wurde bot-weit gesperrt");
        setFormData({ user_id: "", reason: "" });
        setShowAddForm(false);
        fetchBlacklist();
      }
    } catch (err) {
      toast.error("Fehler beim Sperren");
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Diesen User wirklich wieder entmuten?")) return;
    
    // Optimistic Update
    const oldEntries = [...entries];
    setEntries(entries.filter(e => e.user_id !== userId));

    try {
      const res = await fetch(`${API_URL}/admin/blacklist/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) {
        setEntries(oldEntries);
        toast.error("Fehler beim Entsperren");
      } else {
        toast.success("User entmutet");
      }
    } catch (err) {
      setEntries(oldEntries);
      toast.error("Verbindungsfehler");
    }
  };

  const filteredEntries = entries.filter(e => 
    e.user_id.includes(searchQuery) || 
    e.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.admin_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-4xl h-full max-h-[800px] bg-[#0a0a0a] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-tight uppercase">Global Blacklist</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">User & Security Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="ID oder Grund suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs outline-none focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full md:w-auto btn-primary !bg-rose-500 hover:!bg-rose-600 !border-rose-400/20 flex items-center gap-2 !py-3 !px-6"
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-[11px] font-black uppercase tracking-widest">User sperren</span>
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAdd} className="p-6 glass-strong rounded-3xl border border-rose-500/20 bg-rose-500/5 space-y-4 animate-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Discord User ID</label>
                  <input 
                    type="text"
                    value={formData.user_id}
                    onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                    placeholder="z.B. 1427994077332373554"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-rose-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Grund</label>
                  <input 
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Verstoß gegen Regeln..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-rose-500 transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Abbrechen</button>
                <button type="submit" className="px-6 py-2 bg-rose-500 hover:bg-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Bestätigen</button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <div key={entry.user_id} className="group relative glass-strong rounded-2xl border border-white/5 hover:border-rose-500/30 p-5 flex items-center justify-between transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                      <UserIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm tracking-tight">{entry.user_id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-500 font-black uppercase tracking-tighter border border-rose-500/20">Banned</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium mt-1 italic">"{entry.reason}"</div>
                      <div className="flex items-center gap-3 mt-2">
                         <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                           <ShieldCheck className="w-3 h-3 text-emerald-400" /> Von {entry.admin_name}
                         </div>
                         <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                           <Clock className="w-3 h-3" /> {new Date(entry.created_at).toLocaleDateString()}
                         </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemove(entry.user_id)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-all opacity-0 group-hover:opacity-100"
                    title="Entsperren"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-[2.5rem]">
                <ShieldCheck className="w-12 h-12 text-emerald-500/20 mx-auto mb-4" />
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">Keine User auf der Blacklist</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
