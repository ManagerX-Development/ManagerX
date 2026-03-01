import { memo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Users, MessageCircle, Sparkles, Zap, Activity, ArrowRight } from "lucide-react";
import { useStats } from "@/hooks/useStats";

export const Hero = memo(function Hero() {
  const { data, isLoading } = useStats();

  const stats = [
    { label: "Aktive Server", value: isLoading ? "..." : `${data.guilds}`, icon: Users },
    { label: "Nutzer", value: isLoading ? "..." : `${data.users}`, icon: MessageCircle },
    { label: "Netzwerk", value: isLoading ? "..." : data.uptime, icon: Activity },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20">
      {/* Animated Background Layers */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,132,255,0.05)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,0,0,0.05)_0%,transparent_50%)]" />

      {/* Dynamic Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full opacity-50" />
      <div className="absolute -bottom-48 right-0 w-[600px] h-[600px] bg-accent/5 blur-[100px] rounded-full" />

      {/* Subtle Grid */}
      <div className="absolute inset-0 opacity-[0.05] grid-pattern" />

      <div className="container mx-auto relative z-10 px-4">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto w-full">
          {/* Version Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass border border-white/10 mb-10 shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/70">Version 2.0.0 Stable</span>
          </motion.div>

          {/* Main Logo Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative mb-12 group"
          >
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 group-hover:bg-primary/30 transition-colors" />
            <div className="relative w-28 h-28 rounded-[2rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/20 border border-white/20 backdrop-blur-xl">
              <Shield className="w-14 h-14 text-white drop-shadow-glow" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -top-4 -right-4 w-10 h-10 bg-card border border-white/10 rounded-xl flex items-center justify-center shadow-xl"
            >
              <Zap className="w-5 h-5 text-primary" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-7xl md:text-9xl font-bold mb-8 tracking-tighter leading-tight"
          >
            Manager<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent drop-shadow-[0_0_30px_rgba(255,0,0,0.3)]">X</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-12 font-medium leading-relaxed"
          >
            Die nächste Generation der Discord Server-Verwaltung. <br className="hidden md:block" />
            <span className="text-foreground">Sicher, schnell und vollständig anpassbar.</span>
          </motion.p>

          {/* Action Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-5 mb-20"
          >
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="https://discord.com/oauth2/authorize?client_id=1368201272624287754&permissions=1669118160151&integration_type=0&scope=bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-4.5 rounded-2xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all border border-white/10"
            >
              <span>Bot einladen</span>
              <ArrowRight className="w-5 h-5" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
              whileTap={{ scale: 0.98 }}
              href="#features"
              className="inline-flex items-center gap-2 px-10 py-4.5 rounded-2xl glass border border-white/10 font-bold text-lg text-white transition-all shadow-lg"
            >
              Features entdecken
            </motion.a>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="glass rounded-3xl p-6 border border-white/5 hover:border-primary/20 transition-colors group"
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span className="text-3xl font-bold text-foreground mb-1">{stat.value}</span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground opacity-60">{stat.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
});