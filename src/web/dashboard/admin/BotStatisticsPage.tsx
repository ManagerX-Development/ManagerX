import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, Activity, Users, Database, 
  ArrowLeft, RefreshCw, Cpu, HardDrive, 
  Zap, TrendingUp, Calendar, Server
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line 
} from "recharts";
import { useAuth } from "../../components/core/AuthProvider";
import { API_URL } from "../../lib/api";
import { cn } from "../../lib/utils";

interface LiveStats {
  cpu: number;
  ram: number;
  latency: number;
  activeVoice?: number;
  timestamp: string;
}

interface CommandUsage {
  command_name: string;
  usage_count: number;
}

interface AnalyticsStats {
  top_commands: CommandUsage[];
  interactions_24h: number;
  active_servers_24h: number;
  top_guild: string;
}

interface HistoryStats {
  date: string;
  guild_count: number;
  user_count: number;
  command_count: number;
}

export default function BotStatisticsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [liveData, setLiveData] = useState<LiveStats[]>([]);
  const [historyData, setHistoryData] = useState<HistoryStats[]>([]);
  const [currentStats, setCurrentStats] = useState<LiveStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/admin/performance/history?days=14`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setHistoryData(json.data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const res = await fetch(`${API_URL}/dashboard/admin/performance/analytics`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setAnalyticsData(json.data);
    } catch (err) {
      console.error("Failed to fetch dashboard analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchLive = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/admin/performance/live`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        const newData = json.data;
        setCurrentStats(newData);
        setLiveData(prev => {
          const updated = [...prev, newData];
          if (updated.length > 20) return updated.slice(1);
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to fetch live stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchAnalytics();
    fetchLive();
    const interval = setInterval(fetchLive, 5000); // Alle 5 Sek Live-Update
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation & Header */}
        <div className="mb-12">
          <button 
            onClick={() => navigate("/dash/admin")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Zurück zur Zentrale
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-orange-500" />
                </div>
                <span className="text-orange-500 font-bold uppercase tracking-widest text-xs">Analytics Engine</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tight uppercase">Bot Statistics</h1>
            </div>
            
            <div className="flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
               <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Bot Status</span>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-sm font-bold">ONLINE</span>
                  </div>
               </div>
               <div className="w-px h-8 bg-white/10 mx-2" />
               <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Latenz</span>
                  <span className="text-sm font-bold text-primary">{currentStats?.latency || "0"}ms</span>
               </div>
            </div>
          </div>
        </div>

        {/* Real-time Performance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           {/* CPU Chart */}
           <div className="col-span-1 md:col-span-2 glass-strong rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Cpu className="w-32 h-32" />
              </div>
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">CPU Auslastung (%)</h3>
                 </div>
                 <span className="text-2xl font-black text-primary">{currentStats?.cpu.toFixed(1)}%</span>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liveData}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)" animationDuration={1000} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* RAM & Voice Info */}
           <div className="flex flex-col gap-6">
              {/* RAM Card */}
              <div className="glass-strong rounded-[2.5rem] p-8 border border-white/5">
                 <div className="flex items-center gap-3 mb-6">
                    <HardDrive className="w-5 h-5 text-accent" />
                    <h3 className="text-sm font-black uppercase tracking-widest">RAM Nutzung</h3>
                 </div>
                 <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-black">{currentStats?.ram.toFixed(0)}</span>
                    <span className="text-muted-foreground font-bold">MB</span>
                 </div>
                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                       className="h-full bg-accent transition-all duration-1000" 
                       style={{ width: `${Math.min(100, (currentStats?.ram || 0) / 10.24)}%` }} 
                    />
                 </div>
                 <p className="text-[10px] text-muted-foreground mt-4 font-medium italic">Max. Speicherlimit: 1024 MB</p>
              </div>

              {/* Voice Status Card */}
              <div className="glass-strong rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Users className="w-32 h-32 text-green-500" />
                 </div>
                 <div className="flex items-center gap-3 mb-6">
                    <Users className="w-5 h-5 text-green-400 animate-pulse" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-green-400">Live Voice</h3>
                 </div>
                 <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-black text-white">{currentStats?.activeVoice ?? 0}</span>
                    <span className="text-muted-foreground text-xs font-black uppercase tracking-widest">User aktiv</span>
                 </div>
                 <p className="text-[10px] text-muted-foreground font-medium italic">In allen Sprachkanälen</p>
              </div>
              
              {/* System Health Card */}
              <div className="glass-strong rounded-[2.5rem] p-8 border border-white/5 bg-primary/5">
                 <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">System Health</h3>
                 </div>
                 <p className="text-xs text-muted-foreground leading-relaxed">
                    Alle Systeme laufen stabil. Die API-Latenz liegt im optimalen Bereich von &lt;100ms.
                 </p>
              </div>
           </div>

        {/* Growth & History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Guild Growth */}
           <div className="glass-strong rounded-[2.5rem] p-8 border border-white/5">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <Server className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Server Wachstum</h3>
                 </div>
                 <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={(str) => str.split('-').slice(1).reverse().join('.')} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Line type="monotone" dataKey="guild_count" name="Server" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* User Growth */}
           <div className="glass-strong rounded-[2.5rem] p-8 border border-white/5">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-accent" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Nutzer Basis</h3>
                 </div>
                 <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={(str) => str.split('-').slice(1).reverse().join('.')} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Area type="monotone" dataKey="user_count" name="Nutzer" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* Analytics & Command Usage Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
           {/* Left side: Overview Stats Cards */}
           <div className="lg:col-span-2 glass-strong rounded-[2.5rem] p-8 border border-white/5 flex flex-col justify-between">
              <div>
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                       <Zap className="w-5 h-5 text-orange-500" />
                       <h3 className="text-sm font-black uppercase tracking-widest">Aktivitäts-Übersicht</h3>
                    </div>
                    <button 
                       onClick={fetchAnalytics}
                       className="p-2 hover:bg-white/5 rounded-xl border border-white/10 text-muted-foreground hover:text-white transition-colors"
                       title="Aktualisieren"
                       disabled={loadingAnalytics}
                    >
                       <RefreshCw className={loadingAnalytics ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                       { label: "Top Command (24h)", value: analyticsData?.top_commands?.[0]?.command_name ? `/${analyticsData.top_commands[0].command_name}` : "Keines", color: "text-orange-500" },
                       { label: "Interaktionen (24h)", value: analyticsData?.interactions_24h.toLocaleString() ?? "0", color: "text-white" },
                       { label: "Aktivster Server", value: analyticsData?.top_guild ?? "Keine Aktivität", color: "text-white" },
                       { label: "User in Voice (Live)", value: `${currentStats?.activeVoice ?? 0} aktiv`, color: "text-green-400" }
                    ].map(item => (
                      <div key={item.label} className="p-5 bg-white/5 rounded-2xl border border-white/5">
                         <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-2">{item.label}</p>
                         <p className={item.color + " text-xl font-black truncate"} title={String(item.value)}>{item.value}</p>
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/5 text-[10px] text-muted-foreground flex justify-between items-center italic">
                 <span>Statistiken basieren auf Live-Bot-Interaktionen der letzten 24h</span>
                 {loadingAnalytics && <span>Lade Daten...</span>}
              </div>
           </div>

           {/* Right side: Top 5 Commands with percentage progress bars */}
           <div className="glass-strong rounded-[2.5rem] p-8 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                 <TrendingUp className="w-5 h-5 text-primary" />
                 <h3 className="text-sm font-black uppercase tracking-widest">Top 5 Befehle</h3>
              </div>
              
              <div className="flex flex-col gap-4">
                 {analyticsData && analyticsData.top_commands && analyticsData.top_commands.length > 0 ? (
                   (() => {
                     const totalUsage = analyticsData.top_commands.reduce((sum, c) => sum + c.usage_count, 0);
                     return analyticsData.top_commands.map((cmd, idx) => {
                       const percentage = totalUsage > 0 ? (cmd.usage_count / totalUsage) * 100 : 0;
                       return (
                         <div key={cmd.command_name} className="flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                               <span className="text-xs font-bold text-white">/{cmd.command_name}</span>
                               <span className="text-xs text-muted-foreground font-medium">{cmd.usage_count} Aufrufe</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                               <div 
                                  className="h-full bg-primary transition-all duration-1000" 
                                  style={{ width: `${percentage}%` }} 
                               />
                            </div>
                         </div>
                       );
                     });
                   })()
                 ) : (
                   <p className="text-xs text-muted-foreground italic py-4 text-center">Keine Befehlsdaten verfügbar</p>
                 )}
              </div>
           </div>
        </div></div>

      </div>
    </div>
  );
}
