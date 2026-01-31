import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Heart, Github, MessageCircle, ExternalLink, Terminal, Sparkles, Code2, Zap, Users, Rocket, Star, BarChart3, Lock, Info, FileCheck, Activity } from "lucide-react";

const socialLinks = [
  { icon: Github, href: "https://github.com/ManagerX-Development/ManagerX", label: "GitHub" },
  { icon: MessageCircle, href: "https://discord.gg/dein-link", label: "Discord Support" },
];

export const Footer = memo(function Footer() {
  return (
    <footer className="relative py-32 bg-background overflow-hidden border-t border-white/5">
      {/* Premium Hintergrund-Effekte */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,0,0,0.05),transparent)]" />

      <div className="container relative z-10 px-4">
        <div className="flex flex-col items-center">

          {/* --- HERO LOGO REPLICA --- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-5 mb-14"
          >
            <div className="relative group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center shadow-2xl shadow-primary/40 border border-white/10 backdrop-blur-xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Shield className="w-16 h-16 text-white drop-shadow-glow" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center shadow-xl shadow-accent/50 border border-white/10 z-10"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          </motion.div>

          {/* --- BRAND TITLE --- */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black mb-8 tracking-tighter text-center"
          >
            <span className="text-foreground">Manager</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary ml-2 filter drop-shadow-glow">X</span>
          </motion.h2>

          {/* --- SLOGAN --- */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-3xl text-muted-foreground/80 mb-24 font-black tracking-tight flex items-center gap-6 flex-wrap justify-center uppercase italic"
          >
            <span className="flex items-center gap-2 hover:text-primary transition-colors cursor-default"><Zap className="w-6 h-6 text-primary" /> Sicher</span>
            <span className="text-primary/20">•</span>
            <span className="flex items-center gap-2 hover:text-accent transition-colors cursor-default"><Rocket className="w-6 h-6 text-accent" /> Schnell</span>
            <span className="text-primary/20">•</span>
            <Link to="/legal/license" className="flex items-center gap-2 text-muted-foreground/80 hover:text-primary transition-colors cursor-pointer group">
              <Code2 className="w-6 h-6 text-primary group-hover:rotate-12 transition-transform" />
              <span>Open Source</span>
            </Link>
          </motion.p>

          {/* --- SOCIAL BUTTONS --- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6 mb-32"
          >
            {socialLinks.map((link, idx) => (
              <motion.a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -8, scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={{ delay: idx * 0.1 }}
                className="group px-10 py-5 rounded-[1.5rem] border border-primary/20 bg-primary/5 backdrop-blur-md flex items-center gap-4 text-sm font-black uppercase tracking-widest hover:bg-primary/10 transition-all shadow-xl hover:shadow-primary/30 hover:border-primary/40 text-white"
              >
                <link.icon className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
                {link.label}
              </motion.a>
            ))}
          </motion.div>

          {/* --- NAVIGATION & TECH GRID --- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-16 text-center md:text-left border-y border-white/5 py-24 w-full max-w-7xl mb-24 backdrop-blur-sm"
          >
            {/* column 1 */}
            <div className="flex flex-col gap-6">
              <span className="text-xs font-black uppercase tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">Navigation</span>
              <a href="#features" className="text-sm text-muted-foreground hover:text-white transition-all font-bold group flex items-center justify-center md:justify-start gap-3">
                <Star className="w-4 h-4 text-primary transition-transform group-hover:rotate-12" />
                <span className="group-hover:translate-x-1 transition-transform">Features</span>
              </a>
              <a href="#stats" className="text-sm text-muted-foreground hover:text-white transition-all font-bold group flex items-center justify-center md:justify-start gap-3">
                <BarChart3 className="w-4 h-4 text-accent transition-transform group-hover:scale-110" />
                <span className="group-hover:translate-x-1 transition-transform">Statistiken</span>
              </a>
              <Link to="/plugins" className="text-sm text-muted-foreground hover:text-white transition-all font-bold group flex items-center justify-center md:justify-start gap-3">
                <Terminal className="w-4 h-4 text-primary transition-transform group-hover:rotate-12" />
                <span className="group-hover:translate-x-1 transition-transform">Plugin System</span>
              </Link>
            </div>

            {/* column 2 */}
            <div className="flex flex-col gap-6">
              <span className="text-xs font-black uppercase tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">Ressourcen</span>
              <a href="https://docs.oppro-network.de/" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-white transition-all font-bold group flex items-center justify-center md:justify-start gap-3">
                <ExternalLink className="w-4 h-4 text-accent" />
                <span className="group-hover:translate-x-1 transition-transform">Documentation</span>
              </a>
              <a href="https://discord.gg/oppro" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-white transition-all font-bold group flex items-center justify-center md:justify-start gap-3">
                <Users className="w-4 h-4 text-primary" />
                <span className="group-hover:translate-x-1 transition-transform">Support Server</span>
              </a>
              <Link to="/status" className="text-sm text-muted-foreground hover:text-white transition-all font-bold group flex items-center justify-center md:justify-start gap-3">
                <Activity className="w-4 h-4 text-accent" />
                <span className="group-hover:translate-x-1 transition-transform">Network Status</span>
              </Link>
            </div>

            {/* column 3 */}
            <div className="flex flex-col gap-6">
              <span className="text-xs font-black uppercase tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">Legal</span>
              <Link to="/legal/privacy" className="text-sm text-muted-foreground hover:text-white transition-all font-bold group flex items-center justify-center md:justify-start gap-3">
                <Lock className="w-4 h-4 text-primary" />
                <span className="group-hover:translate-x-1 transition-transform">Datenschutz</span>
              </Link>
              <Link to="/legal/imprint" className="text-sm text-muted-foreground hover:text-white transition-all font-bold group flex items-center justify-center md:justify-start gap-3">
                <Info className="w-4 h-4 text-accent" />
                <span className="group-hover:translate-x-1 transition-transform">Impressum</span>
              </Link>
              <Link to="/legal/terms" className="text-sm text-muted-foreground hover:text-white transition-all font-bold group flex items-center justify-center md:justify-start gap-3">
                <FileCheck className="w-4 h-4 text-primary" />
                <span className="group-hover:translate-x-1 transition-transform">AGB</span>
              </Link>
              <Link to="/legal/license" className="text-sm text-muted-foreground hover:text-white transition-all font-bold group flex items-center justify-center md:justify-start gap-3">
                <Code2 className="w-4 h-4 text-accent" />
                <span className="group-hover:translate-x-1 transition-transform">Lizenz</span>
              </Link>
            </div>

            {/* column 4 */}
            <div className="flex flex-col gap-8">
              <span className="text-xs font-black uppercase tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">Architecture</span>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                    <span className="text-foreground">Python Core</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">66.6%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "66.6%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_15px_rgba(255,0,0,0.5)] rounded-full"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                    <span className="text-foreground">React/TS Web</span>
                    <span className="text-accent">32.0%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "32.0%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-accent to-primary shadow-[0_0_15px_rgba(255,0,0,0.3)] rounded-full"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 shadow-lg">
                    <Terminal className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">v2.0.0 Stable</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* --- FOOTER BOTTOM --- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-between w-full gap-10 pt-10"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-white transition-all cursor-default"
            >
              <span>Made with</span>
              <Heart className="w-5 h-5 text-primary fill-primary animate-pulse" />
              <span>by ManagerX Team</span>
            </motion.div>
            <div className="flex items-center gap-10">
              <Link to="/legal/license" className="flex items-center gap-3 opacity-40 text-xs font-black uppercase tracking-widest hover:opacity-100 hover:text-primary transition-all cursor-pointer">
                <Code2 className="w-4 h-4 text-primary" />
                <span>Open Source Community</span>
              </Link>
              <p className="text-xs font-black text-muted-foreground/50 hover:text-white transition-all tracking-[0.3em] uppercase">
                © {new Date().getFullYear()} ALL RIGHTS RESERVED
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
});