import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Zap, MousePointer2, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "../../lib/api";
import { useAuth } from "../../components/core/AuthProvider";
import { cn } from "../../lib/utils";

interface CommandStat {
  command_name: string;
  usage_count: number;
}

interface AdminAnalyticsProps {
  onClose: () => void;
}

export default function AdminAnalytics({ onClose }: AdminAnalyticsProps) {
  const { token } = useAuth();
  const [stats, setStats] = useState<CommandStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/top-commands`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch (err) {
      toast.error("Statistiken konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  const maxUsage = Math.max(...stats.map(s => s.usage_count), 1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[#0a0a0a] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-tight uppercase">Bot Analytics</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Performance & Usage Insights</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest italic">Top 5 Commands</h3>
            </div>
            <button onClick={fetchStats} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-white">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : stats.length > 0 ? (
              stats.map((stat, index) => (
                <div key={stat.command_name} className="space-y-2 group">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black italic text-white/10 group-hover:text-primary/20 transition-colors">#{index + 1}</span>
                      <span className="text-xs font-black uppercase tracking-widest">{stat.command_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Zap className="w-3 h-3 fill-current" />
                      <span className="text-xs font-bold">{stat.usage_count}x</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                      style={{ width: `${(stat.usage_count / maxUsage) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl">
                <MousePointer2 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Noch keine Daten verfügbar</p>
              </div>
            )}
          </div>

          <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
              * Die Statistiken werden in Echtzeit aus der Datenbank geladen. Die Command-Nutzung wird global über alle Server hinweg aggregiert.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
