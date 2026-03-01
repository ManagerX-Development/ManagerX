import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Heart, Github, MessageCircle, ExternalLink, Terminal, Sparkles, Code2, Zap, Users, Rocket, Star, BarChart3, Lock, Info, FileCheck, Activity, LayoutGrid, Milestone } from "lucide-react";

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
            className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter text-center"
          >
            Manager<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent drop-shadow-glow ml-1">X</span>
          </motion.h2>

          {/* --- SLOGAN --- */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-8 mb-20 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 italic"
          >
            <span className="flex items-center gap-2 hover:text-primary transition-colors cursor-default">
              <Zap className="w-4 h-4" /> Sicher
            </span>
            <span className="flex items-center gap-2 hover:text-accent transition-colors cursor-default">
              <Rocket className="w-4 h-4" /> Schnell
            </span>
            <Link to="/legal/license" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Code2 className="w-4 h-4" /> Open Source
            </Link>
          </motion.div>

          {/* --- SOCIAL BUTTONS --- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4 mb-24"
          >
            {socialLinks.map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 rounded-2xl glass border border-white/5 flex items-center gap-3 text-xs font-bold uppercase tracking-widest hover:border-primary/30 transition-all shadow-lg"
              >
                <link.icon className="w-5 h-5 text-primary" />
                {link.label}
              </motion.a>
            ))}
          </motion.div>

          {/* --- NAVIGATION & TECH GRID --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left border-y border-white/5 py-20 w-full max-w-6xl mb-20">
            {/* column 1 */}
            <div className="flex flex-col gap-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">Navigation</span>
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Features</a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Feedback</a>
              <Link to="/commands" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Befehle</Link>
              <Link to="/team" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Unser Team</Link>
            </div>

            {/* column 2 */}
            <div className="flex flex-col gap-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">Ressourcen</span>
              <a href="https://docs.managerx-bot.de/" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Dokumentation</a>
              <a href="https://discord.gg/oppro" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Support Server</a>
              <a href="https://github.com/ManagerX-Development/ManagerX" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">GitHub Repository</a>
            </div>

            {/* column 3 */}
            <div className="flex flex-col gap-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">Rechtliches</span>
              <Link to="/legal/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Datenschutz</Link>
              <Link to="/legal/imprint" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Impressum</Link>
              <Link to="/legal/license" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Lizenz (GPL-3.0)</Link>
            </div>

            {/* column 4 */}
            <div className="flex flex-col gap-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">Core Tech</span>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                    <span>Python Core</span>
                    <span>66%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full">
                    <div className="h-full w-[66%] bg-primary rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                    <span>Web Stack</span>
                    <span>34%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full">
                    <div className="h-full w-[34%] bg-accent rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- FOOTER BOTTOM --- */}
          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-8 pt-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-primary fill-primary" />
              <span>by ManagerX Team</span>
            </div>
            <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest">
              <p>© {new Date().getFullYear()} ALL RIGHTS RESERVED</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});