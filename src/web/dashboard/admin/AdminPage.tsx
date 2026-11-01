import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Newspaper, 
  Users, 
  ShieldCheck, 
  BarChart3, 
  MessageSquare,
  Activity,
  ArrowRight,
  Zap,
  Server,
  Clock,
  ChevronRight,
  Bot,
  Cpu,
  TrendingUp,
  Globe
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/core/AuthProvider";
import { API_URL } from "../../lib/api";
import { cn } from "../../lib/utils";
import AdminBlacklist from "./AdminBlacklist";
import AdminAnalytics from "./AdminAnalytics";
import AdminGlobalChat from "./AdminGlobalChat";

const AdminPage = () => {
  const { user, loading, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalGuilds: 0,
    totalUsers: 0,
    totalPosts: 0,
    apiLatency: "Laden...",
    uptime: "Laden..."
  });

  const [showBlacklist, setShowBlacklist] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showGlobalChat, setShowGlobalChat] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || !user.isAdmin) {
      navigate("/dash/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/global-stats`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      }
    };

    if (token) {
      fetchStats();
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const adminModules = [
    {
      title: "Content Management",
      desc: "Blog-Posts verwalten, News schreiben und Tags editieren.",
      icon: Newspaper,
      action: () => navigate("/dash/admin/cms"),
      gradient: "from-blue-600 to-cyan-500",
      glow: "rgba(59,130,246,0.3)",
      count: `${stats.totalPosts} Posts`,
      badge: "CMS"
    },
    {
      title: "User & Security",
      desc: "Globale Blacklist, Team-Berechtigungen und Bot-Admins verwalten.",
      icon: ShieldCheck,
      action: () => setShowBlacklist(true),
      gradient: "from-violet-600 to-purple-500",
      glow: "rgba(139,92,246,0.3)",
      badge: "Security"
    },
    {
      title: "Bot Analytics",
      desc: "Detaillierte Statistiken über Commands, Shards und Auslastung.",
      icon: BarChart3,
      action: () => setShowAnalytics(true),
      gradient: "from-orange-500 to-amber-500",
      glow: "rgba(249,115,22,0.3)",
      badge: "Analytics"
    },
    {
      title: "Global Chat Control",
      desc: "Chat-Filter verwalten und globale Unterhaltungen moderieren.",
      icon: MessageSquare,
      action: () => setShowGlobalChat(true),
      gradient: "from-emerald-600 to-green-500",
      glow: "rgba(16,185,129,0.3)",
      badge: "Network"
    }
  ];

  const statCards = [
    { label: "Server", value: stats.totalGuilds.toLocaleString(), icon: Server, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Nutzer", value: stats.totalUsers >= 1000 ? `${(stats.totalUsers / 1000).toFixed(1)}k` : stats.totalUsers.toString(), icon: Users, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
    { label: "Blog Posts", value: stats.totalPosts.toString(), icon: Newspaper, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "API Latenz", value: stats.apiLatency, icon: Zap, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  ];

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#030305] text-white relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-5%] w-[600px] h-[600px] rounded-full bg-red-600/[0.06] blur-[120px]" />
        <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-900/[0.05] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
            backgroundSize: "60px 60px"
          }}
        />
      </div>

      <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-red-700 flex items-center justify-center shadow-lg shadow-primary/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">ManagerX HQ</p>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter">
              Admin{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-red-400 to-primary">
                Zentrale
              </span>
            </h1>
            <p className="text-white/40 mt-2 font-medium">Volle Kontrolle über ManagerX. Nur für Admins.</p>
          </div>

          {/* User Badge + Live Indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
              <div className="relative w-2 h-2">
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                <div className="relative rounded-full bg-emerald-500 w-2 h-2" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Live</span>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] px-4 py-3 rounded-2xl backdrop-blur-xl">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-red-700 flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold leading-none">{user?.username}</p>
                <p className="text-[10px] text-primary/70 font-black uppercase tracking-widest leading-none mt-0.5">System Administrator</p>
              </div>
            </div>
          </motion.div>
        </motion.header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="relative group"
            >
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 overflow-hidden">
                {/* Top glow */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-2.5 rounded-xl border", stat.bg)}>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/20 flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5" />
                    Live
                  </span>
                </div>
                
                <p className="text-3xl font-black text-white mb-1 font-mono">{stat.value}</p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/30">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Uptime Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-4 mb-10 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]"
        >
          <Clock className="w-4 h-4 text-primary/60" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/30">Uptime:</span>
          <span className="text-sm font-black text-white/80 font-mono">{stats.uptime}</span>
          <div className="h-4 w-px bg-white/10" />
          <Globe className="w-4 h-4 text-primary/60" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/30">Region:</span>
          <span className="text-sm font-black text-white/80">Frankfurt am Main</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500">
              <div className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">Alle Systeme Stabil</span>
          </div>
        </motion.div>

        {/* Modules Grid */}
        <div className="mb-8 flex items-center gap-3">
          <Cpu className="w-5 h-5 text-primary/60" />
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Verwaltungs-Module</h2>
          <div className="flex-1 h-px bg-white/[0.05]" />
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-16">
          {adminModules.map((module, i) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.08, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={module.action}
              className="group relative cursor-pointer"
            >
              <div
                className="relative p-7 rounded-3xl border border-white/[0.07] bg-white/[0.03] overflow-hidden transition-all duration-500 hover:border-white/[0.15]"
                style={{
                  ["--glow" as string]: module.glow,
                  boxShadow: "0 0 0 transparent"
                }}
              >
                {/* Hover glow overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                  style={{ boxShadow: `inset 0 0 80px -40px ${module.glow}` }}
                />

                {/* Top gradient line */}
                <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500", `via-[${module.glow}]`)} 
                  style={{ background: `linear-gradient(90deg, transparent, ${module.glow}, transparent)` }}
                />

                {/* BG corner glow */}
                <div className={cn("absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[50px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br", module.gradient)} />

                <div className="relative flex items-start gap-5">
                  {/* Icon */}
                  <div className={cn(
                    "shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300",
                    module.gradient
                  )}>
                    <module.icon className="w-7 h-7 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-xl font-black text-white group-hover:text-white transition-colors">
                        {module.title}
                      </h3>
                      <ArrowRight className="w-5 h-5 text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all duration-300" />
                    </div>

                    <p className="text-sm text-white/40 leading-relaxed mb-4">
                      {module.desc}
                    </p>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-white/40">
                        {module.badge}
                      </span>
                      {module.count && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {module.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <footer className="border-t border-white/[0.05] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/15">
            © 2026 ManagerX System Control
          </p>
          <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-white/20">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              API Online
            </span>
            <span>v2.1.5 Stable</span>
          </div>
        </footer>
      </div>

      {showBlacklist && <AdminBlacklist onClose={() => setShowBlacklist(false)} />}
      {showAnalytics && <AdminAnalytics onClose={() => setShowAnalytics(false)} />}
      {showGlobalChat && <AdminGlobalChat onClose={() => setShowGlobalChat(false)} />}
    </div>
  );
};

export default AdminPage;
