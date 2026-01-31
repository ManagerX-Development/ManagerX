import { memo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Users, MessageCircle, Sparkles, Zap, Rocket, Code2, ArrowRight } from "lucide-react";

const stats = [
  { label: "Server", value: "10+", icon: Users },
  { label: "Befehle", value: "90+", icon: MessageCircle },
  { label: "Uptime", value: "99.9%", icon: Sparkles },
];

const StatCard = memo(({ stat, index }: { stat: typeof stats[0]; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.35 + index * 0.05 }}
    className="glass rounded-2xl px-8 py-5 text-center min-w-[140px] hover:bg-card/80 transition-colors duration-300"
  >
    <div className="flex items-center justify-center gap-2 mb-2">
      <stat.icon className="w-5 h-5 text-accent" />
      <span className="text-3xl font-bold text-foreground">{stat.value}</span>
    </div>
    <span className="text-sm text-muted-foreground">{stat.label}</span>
  </motion.div>
));

StatCard.displayName = "StatCard";

export const Hero = memo(function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Premium Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-accent/5" />

      {/* Animated gradient orbs - Optimized blur/size for legacy hardware */}
      <div
        style={{ willChange: "opacity" }}
        className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/20 rounded-full opacity-50 blur-[80px] animate-pulse"
      />
      <div
        style={{ willChange: "opacity" }}
        className="absolute -bottom-32 right-1/4 w-96 h-96 bg-accent/15 rounded-full opacity-50 blur-[80px] animate-pulse animation-delay-2000"
      />
      <div
        style={{ willChange: "opacity" }}
        className="absolute top-1/2 -right-32 w-80 h-80 bg-primary/10 rounded-full opacity-30 blur-[60px]"
      />

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] animate-drift grid-pattern" />

      <div className="container relative z-10 px-4 py-20">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.05, duration: 0.4, ease: "easeInOut" }}
            className="inline-flex items-center gap-3 glass rounded-full px-6 py-3 mb-12 border border-primary/30 backdrop-blur-md shadow-lg shadow-primary/10"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm text-foreground/90 font-bold uppercase tracking-widest">Version 2.0.0 Stable</span>
            <Sparkles className="w-4 h-4 text-accent" />
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.35, type: "spring", stiffness: 260, damping: 20 }}
            className="flex items-center justify-center gap-5 mb-14"
          >
            <div className="relative group cursor-pointer">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }} // Slowed down from 12s for better performance
                className="absolute inset-0 bg-gradient-to-tr from-primary via-accent to-primary rounded-[2.5rem] blur-xl opacity-40 group-hover:opacity-100 transition-opacity duration-300"
              />
              <motion.div
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="relative w-32 h-32 rounded-[2rem] bg-gradient-to-br from-primary via-primary/90 to-accent/80 flex items-center justify-center shadow-2xl shadow-primary/60 border border-white/20 backdrop-blur-xl group-hover:shadow-primary/80 transition-shadow"
              >
                <Shield className="w-16 h-16 text-white drop-shadow-glow" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -right-4 w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center shadow-xl shadow-accent/40 border border-white/20 z-20 group-hover:rotate-45 transition-transform"
              >
                <Zap className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-7xl md:text-8xl lg:text-[10rem] font-black mb-10 tracking-tighter leading-none"
          >
            <span className="text-foreground">Manager</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary ml-2 filter drop-shadow-[0_0_35px_rgba(255,0,0,0.5)]">X</span>
          </motion.h1>

          {/* Slogan */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: "easeInOut" }}
            className="text-2xl md:text-3xl text-muted-foreground/80 mb-16 max-w-4xl mx-auto leading-relaxed font-semibold tracking-tight flex items-center justify-center gap-5 flex-wrap"
          >
            <span className="flex items-center gap-2 hover:text-primary transition-colors cursor-default">
              <Shield className="w-7 h-7 text-primary" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Sicher</span>
            </span>
            <span className="text-primary/20">•</span>
            <span className="flex items-center gap-2 hover:text-accent transition-colors cursor-default">
              <Rocket className="w-7 h-7 text-accent" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Schnell</span>
            </span>
            <span className="text-primary/20">•</span>
            <Link to="/legal/license" className="flex items-center gap-2 text-muted-foreground/80 hover:text-primary transition-colors cursor-pointer group">
              <Code2 className="w-7 h-7 text-primary group-hover:rotate-12 transition-transform" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Open Source</span>
            </Link>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-6 justify-center mb-20"
          >
            <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <a
                href="https://discord.com/oauth2/authorize?client_id=1368201272624287754&permissions=1669118160151&integration_type=0&scope=bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-4 px-10 py-5 rounded-[1.5rem] bg-gradient-to-r from-primary to-accent text-white font-black text-xl hover:shadow-[0_20px_50px_rgba(255,0,0,0.5)] transition-all group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10">Jetzt Einladen</span>
                <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform" />
              </a>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-10 py-5 rounded-[1.5rem] glass hover:bg-white/10 border border-white/10 font-black text-xl transition-all shadow-xl relative overflow-hidden group"
              >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary to-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10">Features entdecken</span>
              </a>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {stats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />
    </section>
  );
});