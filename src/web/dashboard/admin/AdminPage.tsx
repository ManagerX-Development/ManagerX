import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Newspaper, 
  Users, 
  ShieldCheck, 
  BarChart3, 
  Settings, 
  MessageSquare,
  Activity,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/core/AuthProvider";
import { API_URL } from "../../lib/api";
import { cn } from "../../lib/utils";
import AdminBlacklist from "./AdminBlacklist";
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
  const [showGlobalChat, setShowGlobalChat] = useState(false);

  useEffect(() => {
    // Auth Check: Nur Admins oder der cms_admin dürfen hier sein
    if (loading) return;

    if (!user || !user.isAdmin) {
      console.log("Admin Check failed:", { user });
      navigate("/dash/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/dashboard/admin/global-stats`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
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
      const interval = setInterval(fetchStats, 10000); // Alle 10 Sek aktualisieren
      return () => clearInterval(interval);
    }
  }, [token]);

  const adminModules = [
    {
      title: "Content Management",
      desc: "Blog-Posts verwalten, News schreiben und Tags editieren.",
      icon: Newspaper,
      path: "/dash/admin/cms",
      color: "from-blue-500 to-cyan-500",
      count: stats.totalPosts + " Posts"
    },
    {
      title: "User & Security",
      desc: "Globale Blacklist, Team-Berechtigungen und Bot-Admins.",
      icon: ShieldCheck,
      path: "/dash/admin/users",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Bot Analytics",
      desc: "Detaillierte Statistiken über Commands, Shards und Auslastung.",
      icon: BarChart3,
      path: "/dash/admin/stats",
      color: "from-orange-500 to-red-500"
    },
    {
      title: "Global Chat Control",
      desc: "Chat-Filter verwalten und globale Unterhaltungen moderieren.",
      icon: MessageSquare,
      path: "/dash/admin/global-chat",
      color: "from-green-500 to-emerald-500"
    }
  ];

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/20 rounded-lg">
                <LayoutDashboard className="w-6 h-6 text-primary" />
              </div>
              <span className="text-primary font-semibold tracking-wider uppercase text-sm">
                ManagerX HQ
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
              Admin Zentrale
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-md"
          >
            <div className="text-right">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-tighter">System Administrator</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/20">
              {user?.username?.[0]}
            </div>
          </motion.div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Server", value: stats.totalGuilds, icon: Activity },
            { label: "Nutzer", value: (stats.totalUsers / 1000).toFixed(1) + "k", icon: Users },
            { label: "Blog Posts", value: stats.totalPosts, icon: Newspaper },
            { label: "API Latenz", value: stats.apiLatency, icon: Settings },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/[0.08] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-4 h-4 text-primary" />
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Live</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Modules Grid */}
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Verwaltungs-Module
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {adminModules.map((module, i) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => {
                if (module.title === "User & Security") {
                  setShowBlacklist(true);
                } else if (module.title === "Global Chat Control") {
                  setShowGlobalChat(true);
                } else if (module.path) {
                  navigate(module.path);
                }
              }}
              className={cn(
                "group relative bg-white/5 border border-white/10 rounded-3xl p-8 cursor-pointer overflow-hidden transition-all",
                module.status && module.title !== "User & Security" ? "opacity-50 grayscale" : "hover:border-primary/50"
              )}
            >
              {/* Background Glow */}
              <div className={`absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 transition-opacity blur-3xl`} />
              
              <div className="relative flex items-start gap-6">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${module.color} shadow-lg shadow-black/50 group-hover:scale-110 transition-transform`}>
                  <module.icon className="w-8 h-8 text-white" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
                      {module.title}
                    </h3>
                    {module.status && module.title !== "User & Security" ? (
                      <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-2 py-1 rounded-md">
                        {module.status}
                      </span>
                    ) : (
                      <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    )}
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {module.desc}
                  </p>
                  
                  {module.count && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-white/80">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      {module.count}
                    </span>
                  )}
                  
                  {module.status && module.title !== "User & Security" && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/40 italic">
                      {module.status}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <footer className="mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-xs text-muted-foreground">
          <p>© 2026 ManagerX System Control</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> API Online
            </span>
            <span>Version 2.1.5 (Stable)</span>
          </div>
        </footer>

      </div>
      {showBlacklist && <AdminBlacklist onClose={() => setShowBlacklist(false)} />}
      {showGlobalChat && <AdminGlobalChat onClose={() => setShowGlobalChat(false)} />}
    </div>
  );
};

export default AdminPage;
