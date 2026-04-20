import { memo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Users, MessageCircle, Sparkles, Zap, Activity, ArrowRight } from "lucide-react";
import { useStats } from "../hooks/useStats";

export const Hero = memo(function Hero() {
  const { data, isLoading } = useStats();

  const stats = [
    { label: "Aktive Server", value: isLoading ? "..." : `${data.guilds}`, icon: Users },
    { label: "Nutzer", value: isLoading ? "..." : `${data.users}`, icon: MessageCircle },
    { label: "Netzwerk", value: isLoading ? "..." : data.uptime, icon: Activity },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-40 pb-24">
      {/* Premium Background Layers */}
      <div className="absolute inset-0 bg-[#0a0c10]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.08)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(220,38,38,0.05)_0%,transparent_50%)]" />

      {/* Dynamic Animated Glow Orbs - Optimized */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/20 blur-[80px] rounded-full animate-pulse-slow will-change-transform" />
      <div className="absolute -bottom-48 -right-48 w-[800px] h-[800px] bg-accent/10 blur-[60px] rounded-full will-change-transform" />

      {/* High-End Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.07] grid-pattern [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

      <div className="container mx-auto relative z-10 px-4">
        <div className="flex flex-col items-center text-center max-w-6xl mx-auto w-full">
          {/* Elite Version Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full glass border border-white/10 mb-12 shadow-[0_0_30px_rgba(220,38,38,0.15)] group cursor-default"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[12px] font-black uppercase tracking-[0.3em] text-white/90">
              v2.0.0-Stable <span className="text-primary/50 mx-2">|</span> Powered by MxMariaDB
            </span>
          </motion.div>

          <div className="relative mb-16">
            {/* Main Title with Animated Gradient */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[5.5rem] md:text-[13rem] font-black mb-6 tracking-tighter leading-[0.8] select-none italic uppercase"
            >
              Manager<span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-accent to-primary animate-gradient drop-shadow-[0_0_80px_rgba(220,38,38,0.6)]">X</span>
            </motion.h1>

            {/* Sub-Headline with Floating Icon - CPU Optimized */}
            <div className="absolute -top-12 -right-12 hidden lg:block animate-float-slow">
              <div className="w-24 h-24 rounded-3xl glass-strong border border-white/20 flex items-center justify-center shadow-2xl relative group">
                <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/40 transition-colors rounded-3xl" />
                <Shield className="w-12 h-12 text-white relative z-10 drop-shadow-glow" />
              </div>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl md:text-3xl text-slate-400 max-w-3xl mb-16 font-medium leading-tight tracking-tight px-4"
          >
            Die nächste Generation der <span className="text-white font-bold italic">Discord-Exzellenz</span>. <br />
            <span className="text-primary-foreground/60 text-lg uppercase tracking-[0.2em] font-black mt-4 block">Sicher • Hochperformant • Community-getrieben</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-8 mb-32"
          >
            <motion.a
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              href="https://discord.com/oauth2/authorize?client_id=1368201272624287754&permissions=1669118160151&integration_type=0&scope=bot"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary !px-16 !py-6 !text-2xl shadow-[0_25px_60px_-15px_rgba(220,38,38,0.6)] flex items-center gap-4 group"
            >
              <span>Bot einladen</span>
              <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.08)" }}
              whileTap={{ scale: 0.95 }}
              href="#features"
              className="inline-flex items-center gap-3 px-16 py-6 rounded-3xl glass border border-white/10 font-black text-2xl text-white shadow-2xl transition-all uppercase tracking-tighter italic"
            >
              System Core
            </motion.a>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-5xl">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="glass-strong rounded-[2.5rem] p-10 border border-white/5 hover:border-primary/40 transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex flex-col items-center relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-primary group-hover:scale-110 group-hover:rotate-6 transition-all border border-white/5">
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <span className="text-4xl font-black text-white mb-2 tracking-tighter italic">{stat.value}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 group-hover:text-primary transition-colors">{stat.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0a0c10] to-transparent" />
    </section>
  );
});