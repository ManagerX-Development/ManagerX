import { useState, useEffect } from "react";
import { MessageSquare, ShieldAlert, Trash2, Search, X, Clock, User as UserIcon, Globe, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "../../lib/api";
import { useAuth } from "../../components/core/AuthProvider";
import { cn } from "../../lib/utils";

interface ChatLog {
  id: number;
  user_id: string;
  guild_id: string;
  content: string;
  timestamp: string;
}

interface ChatBlacklist {
  id: number;
  entity_type: string;
  entity_id: string;
  reason: string;
  banned_at: string;
}

interface AdminGlobalChatProps {
  onClose: () => void;
}

export default function AdminGlobalChat({ onClose }: AdminGlobalChatProps) {
  const { token } = useAuth();
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [blacklist, setBlacklist] = useState<ChatBlacklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'blacklist'>('logs');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'logs' ? 'logs' : 'blacklist';
      const res = await fetch(`${API_URL}/dashboard/admin/global-chat/${endpoint}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        if (activeTab === 'logs') setLogs(json.data);
        else setBlacklist(json.data);
      }
    } catch (err) {
      toast.error("Daten konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-5xl h-full max-h-[850px] bg-[#0a0a0a] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-tight uppercase">Global Chat Control</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Cross-Server Communication Moderation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 py-4 bg-white/[0.01] border-b border-white/5 flex gap-4">
          <button 
            onClick={() => setActiveTab('logs')}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'logs' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-muted-foreground hover:text-white hover:bg-white/5"
            )}
          >
            Live Logs
          </button>
          <button 
            onClick={() => setActiveTab('blacklist')}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'blacklist' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-muted-foreground hover:text-white hover:bg-white/5"
            )}
          >
            Chat Blacklist
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : activeTab === 'logs' ? (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-emerald-500/30 transition-colors">
                      <UserIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-400 uppercase tracking-tighter">User ID: {log.user_id}</span>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <span className="text-[10px] text-muted-foreground font-bold">Guild: {log.guild_id}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground font-bold uppercase">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-white/90 break-words leading-relaxed font-medium">
                        {log.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-[2.5rem]">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">Noch keine Nachrichten im Global Chat</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {blacklist.map((entry) => (
                <div key={entry.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-rose-500/30 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm tracking-tight">{entry.entity_id}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-500 font-black uppercase border border-rose-500/20">{entry.entity_type} Banned</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 italic font-medium">"{entry.reason}"</p>
                      <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                        <Clock className="w-3 h-3" /> Gesperrt am {new Date(entry.banned_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button className="p-3 rounded-xl bg-white/5 hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-all opacity-0 group-hover:opacity-100">
                    <ShieldCheck className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {blacklist.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-[2.5rem]">
                  <ShieldCheck className="w-12 h-12 text-emerald-500/20 mx-auto mb-4" />
                  <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">Die Global Chat Blacklist ist leer</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
