import { memo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Puzzle, Gamepad2, Globe, ShieldCheck,
  Users, Zap, Settings2, Code2, Layers, Mail, Github
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { motion } from "framer-motion";

const corePlugins = [
  {
    title: "AI Entertainment",
    features: ["4-Gewinnt (VS KI)", "TicTacToe (VS KI)"],
    description: "Intelligente Minispiele direkt im Discord-Chat durch moderne KI-Integration.",
    icon: Gamepad2,
    gradient: "from-primary to-accent",
  },
  {
    title: "Global Network",
    features: ["Globalchat", "Server-übergreifend"],
    description: "Verbinde deine Community mit dem gesamten ManagerX-Netzwerk weltweit.",
    icon: Globe,
    gradient: "from-accent to-primary",
  },
  {
    title: "Security Core",
    features: ["Antispam", "Moderation", "Warn-System", "Notes"],
    description: "Vollständiger Schutz und Verwaltung für dein Team mit intelligenten Filtern.",
    icon: ShieldCheck,
    gradient: "from-primary via-accent to-primary",
  },
  {
    title: "Social & Engagement",
    features: ["Levelsystem", "Welcome-Engine", "TempVC"],
    description: "Steigere die Aktivität durch Belohnungen und vollautomatische Sprachkanäle.",
    icon: Users,
    gradient: "from-accent to-primary",
  },
  {
    title: "Automation",
    features: ["Autodelete", "Autorole", "Loggingsystem"],
    description: "Halte deinen Server sauber und organisiert – alles vollautomatisch im Hintergrund.",
    icon: Zap,
    gradient: "from-primary to-accent",
  },
  {
    title: "System Control",
    features: ["Settings", "Stats"],
    description: "Behalte den vollen Überblick mit detaillierten Analysen und einfacher Konfiguration.",
    icon: Settings2,
    gradient: "from-accent via-primary to-accent",
  }
];

export const PluginsPage = memo(function PluginsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow container relative z-10 px-4 pt-32 pb-24">
        <div className="max-w-5xl mx-auto">

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all mb-12 group text-sm font-black uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Zurück zur Zentrale
            </Link>
          </motion.div>

          {/* Header */}
          <header className="mb-16">
            <div className="flex items-center gap-6 mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="relative w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/10"
              >
                <Puzzle className="w-8 h-8 text-primary" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl animate-pulse" />
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl md:text-7xl font-black tracking-tighter text-foreground uppercase italic leading-none mb-2"
                >
                  Built-in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">Modules</span>
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ delay: 0.3 }}
                  className="flex gap-4"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Version 2.4.0</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">•</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Native Core</span>
                </motion.div>
              </div>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground max-w-2xl leading-relaxed text-lg"
            >
              ManagerX ist modular aufgebaut. Die folgenden Kern-Module sind bereits vorinstalliert und können über das Dashboard konfiguriert werden.
            </motion.p>
          </header>

          {/* Core Plugins Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
            {corePlugins.map((plugin, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.35 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative glass rounded-[2rem] p-8 border border-white/5 hover:border-primary/20 transition-all duration-500 flex flex-col overflow-hidden"
              >
                {/* Gradient Border Effect on Hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className={`absolute inset-0 bg-gradient-to-r ${plugin.gradient} opacity-10 blur-xl`} />
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <motion.div
                      whileHover={{ rotate: 12, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${plugin.gradient} flex items-center justify-center text-white shadow-lg group-hover:shadow-primary/50 transition-shadow`}
                    >
                      <plugin.icon className="w-6 h-6" />
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                    </motion.div>
                    <span className="text-[10px] font-mono text-primary/40 uppercase tracking-tighter group-hover:text-primary transition-colors">
                      Module 0{index + 1}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent transition-all duration-300 uppercase italic tracking-tight">
                    {plugin.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {plugin.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {plugin.features.map(f => (
                      <span
                        key={f}
                        className="text-[9px] font-mono bg-white/5 border border-white/10 text-white/50 px-2 py-1 rounded lowercase group-hover:border-primary/30 group-hover:bg-primary/5 transition-all"
                      >
                        #{f.replace(/\s+/g, '_')}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* External Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pt-12 border-t border-white/5"
          >
            <div className="flex items-center gap-3 mb-8">
              <Layers className="w-5 h-5 text-primary/50" />
              <h2 className="text-xl font-bold uppercase tracking-tight">External Marketplace</h2>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono animate-pulse">COMING SOON</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                className="p-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col gap-4 hover:border-primary/20 transition-all"
              >
                <Code2 className="w-6 h-6 text-muted-foreground" />
                <h3 className="font-bold">Developer SDK</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Erstelle eigene Python-Module und integriere sie nahtlos in das ManagerX Ökosystem.
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                className="p-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col gap-4 hover:border-primary/20 transition-all"
              >
                <Github className="w-6 h-6 text-muted-foreground" />
                <h3 className="font-bold">Community Library</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Teile deine Plugins mit der Community oder entdecke Module von anderen Entwicklern.
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Contact Footer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-24 p-10 glass-strong rounded-[2.5rem] border border-primary/20 bg-primary/[0.02] flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="text-center md:text-left space-y-2">
              <h3 className="font-black text-3xl text-white tracking-tighter uppercase italic">Modul-Wunsch?</h3>
              <p className="text-sm text-muted-foreground font-medium">
                Kontaktiere uns für individuelle Funktions-Ideen.
              </p>
            </div>
            <div className="flex gap-4">
              <motion.a
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                href="mailto:development@oppro-network.de"
                className="p-5 rounded-2xl glass-strong border border-white/10 hover:text-primary hover:border-primary/30 transition-all"
                title="Email"
              >
                <Mail className="w-6 h-6" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                href="https://github.com/ManagerX-Development/ManagerX"
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-2xl glass-strong border border-white/10 hover:text-primary hover:border-primary/30 transition-all"
                title="GitHub"
              >
                <Github className="w-6 h-6" />
              </motion.a>
            </div>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
});

export default PluginsPage;