import { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Puzzle, Gamepad2, Globe, ShieldCheck,
  Users, Zap, Settings2, Code2, Layers, Mail,
  Github, ChevronRight, CheckCircle2, Bot, Cpu,
  MessagesSquare, Trophy, BellRing, UserPlus, ShieldAlert
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { motion } from "framer-motion";

const SECTIONS = [
  { id: "ai-entertainment", title: "AI Entertainment", icon: Gamepad2 },
  { id: "global-network", title: "Global Network", icon: Globe },
  { id: "security-core", title: "Security Core", icon: ShieldCheck },
  { id: "social-engagement", title: "Social & Engagement", icon: Users },
  { id: "automation", title: "Automation", icon: Zap },
  { id: "system-control", title: "System Control", icon: Settings2 },
  { id: "developer-sdk", title: "Developer SDK", icon: Code2 },
];

const Section = ({ id, title, icon: Icon, children }: { id: string; title: string; icon: any; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-32 group">
    <div className="flex items-center gap-6 mb-10">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/10 group-hover:scale-110 transition-transform duration-500">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <div>
        <h2 className="text-3xl font-black text-white uppercase italic tracking-tight group-hover:text-primary transition-colors">
          {title}
        </h2>
        <div className="h-1 w-12 bg-primary/30 mt-2 rounded-full group-hover:w-20 transition-all duration-500" />
      </div>
    </div>
    <div className="space-y-6">
      {children}
    </div>
  </section>
);

const FeatureList = ({ features }: { features: string[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
    {features.map((feature, i) => (
      <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-colors group/item">
        <CheckCircle2 className="w-4 h-4 text-primary group-hover/item:scale-110 transition-transform" />
        <span className="text-sm font-bold text-slate-300 group-hover/item:text-white transition-colors">{feature}</span>
      </div>
    ))}
  </div>
);

export const PluginsPage = memo(function PluginsPage() {
  const [activeSection, setActiveSection] = useState("ai-entertainment");

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = SECTIONS.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 200;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && scrollPosition >= el.offsetTop) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 120,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 pt-48 pb-24 flex flex-col lg:flex-row gap-12 relative">

        {/* Sidebar */}
        <aside className="lg:w-80 shrink-0">
          <div className="sticky top-32 space-y-8">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 px-4">Modules</h3>
              <nav className="space-y-1">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group text-sm font-semibold border ${activeSection === section.id
                        ? "bg-primary/10 text-primary border-primary/20 shadow-lg shadow-primary/5"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent"
                      }`}
                  >
                    <section.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeSection === section.id ? "text-primary" : "text-slate-500"
                      }`} />
                    {section.title}
                    {activeSection === section.id && (
                      <motion.div layoutId="active-indicator-plugins" className="ml-auto">
                        <ChevronRight className="w-3 h-3" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8 rounded-[2rem] bg-primary/[0.02] border border-primary/20">
              <Bot className="w-8 h-8 text-primary mb-4" />
              <h4 className="text-white font-bold mb-2">Modular Core</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Alle Plugins sind nativ integriert und für maximale Performance optimiert.</p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-grow max-w-3xl">
          <header className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 text-primary mb-6"
            >
              <Puzzle className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">Features & Modules</span>
            </motion.div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.9] mb-6">
              Built-in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">Modules</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium max-w-2xl leading-relaxed">
              ManagerX ist kein einfacher Bot, sondern ein modulares Ökosystem. Entdecke die Power unserer nativen Plugins.
            </p>
          </header>

          <article className="space-y-32">
            <Section id="ai-entertainment" title="AI Entertainment" icon={Gamepad2}>
              <p className="text-lg text-slate-400">Unsere Spiele-Engine basiert auf modernen Algorithmen, die ein forderndes Spielerlebnis direkt in Discord ermöglichen.</p>
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 space-y-6">
                <div className="flex items-center gap-4">
                  <Cpu className="w-6 h-6 text-primary" />
                  <h4 className="text-xl font-bold text-white">Neural Minigames</h4>
                </div>
                <p className="text-sm leading-relaxed">Die Minispiele verfügen über verschiedene Schwierigkeitsstufen und ein globales Ranking-System, um den Wettbewerb zu fördern.</p>
                <FeatureList features={["4-Gewinnt (VS KI)", "TicTacToe (VS KI)", "Global Leaderboards", "Match History", "Elo System"]} />
              </div>
            </Section>

            <Section id="global-network" title="Global Network" icon={Globe}>
              <p className="text-lg text-slate-400">Verbinde deine Community mit tausenden anderen Servern weltweit durch unser hochperformantes Globalchat-System.</p>
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 space-y-6">
                <div className="flex items-center gap-4">
                  <MessagesSquare className="w-6 h-6 text-primary" />
                  <h4 className="text-xl font-bold text-white">Real-time Syncing</h4>
                </div>
                <p className="text-sm leading-relaxed">Nachrichten werden in Millisekunden über das gesamte Netzwerk synchronisiert, inklusive Support für Embeds und Media-Vorschauen.</p>
                <FeatureList features={["Cross-Server Chat", "Automatic Moderation", "User Profiles", "Custom Stickers", "Verified System"]} />
              </div>
            </Section>

            <Section id="security-core" title="Security Core" icon={ShieldCheck}>
              <p className="text-lg text-slate-400">Der Security Core ist das Herzstück der Moderation. Er schützt deinen Server 24/7 vor Spam, Raids und Fehlverhalten.</p>
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 space-y-6">
                <div className="flex items-center gap-4">
                  <ShieldAlert className="w-6 h-6 text-primary" />
                  <h4 className="text-xl font-bold text-white">Advanced Protection</h4>
                </div>
                <p className="text-sm leading-relaxed">Ein intelligentes Warn-System trackt Verstöße serverübergreifend und ermöglicht deinem Team eine effiziente Verwaltung.</p>
                <FeatureList features={["Anti-Spam / Anti-Raid", "Warn & Strike System", "Case History", "Automated Filters", "Notes per User"]} />
              </div>
            </Section>

            <Section id="social-engagement" title="Social & Engagement" icon={Users}>
              <p className="text-lg text-slate-400">Steigere die Aktivität auf deinem Server durch ein motivierendes Leveling-System und automatisierte Interaktionen.</p>
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 space-y-6">
                <div className="flex items-center gap-4">
                  <Trophy className="w-6 h-6 text-primary" />
                  <h4 className="text-xl font-bold text-white">Incentive Engine</h4>
                </div>
                <p className="text-sm leading-relaxed">Vergib automatisch Rollen bei bestimmten Leveln und erstelle beeindruckende Willkommens-Karten für neue Mitglieder.</p>
                <FeatureList features={["XP & Level System", "Rank Cards", "Role Rewards", "Custom Welcome Cards", "Member Tracking"]} />
              </div>
            </Section>

            <Section id="automation" title="Automation" icon={Zap}>
              <p className="text-lg text-slate-400">Spare wertvolle Zeit durch intelligente Automatisierung von Routineaufgaben im Hintergrund.</p>
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 space-y-6">
                <div className="flex items-center gap-4">
                  <BellRing className="w-6 h-6 text-primary" />
                  <h4 className="text-xl font-bold text-white">Silent Workers</h4>
                </div>
                <p className="text-sm leading-relaxed">Vom automatischen Löschen unerwünschter Nachrichten bis hin zur Zuweisung von Start-Rollen – alles läuft vollautomatisch.</p>
                <FeatureList features={["Auto-Delete System", "Autorole on Join", "Detailed Logging", "Temp Channel Core", "Scheduled Tasks"]} />
              </div>
            </Section>

            <Section id="system-control" title="System Control" icon={Settings2}>
              <p className="text-lg text-slate-400">Behalte die volle Kontrolle über alle Bot-Funktionen mit unserem intuitiven Konfigurations-System.</p>
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 space-y-6">
                <div className="flex items-center gap-4">
                  <UserPlus className="w-6 h-6 text-primary" />
                  <h4 className="text-xl font-bold text-white">Command Center</h4>
                </div>
                <p className="text-sm leading-relaxed">Detaillierte Statistiken und einfache Slash-Commands ermöglichen eine schnelle Anpassung an die Bedürfnisse deines Servers.</p>
                <FeatureList features={["Full Slash Commands", "Real-time Stats", "Server Settings", "Toggle Modules", "Permissions Sync"]} />
              </div>
            </Section>

            <Section id="developer-sdk" title="Developer SDK" icon={Code2}>
              <p className="text-lg text-slate-400">Bauen Sie auf der ManagerX-Architektur auf und erweitern Sie den Bot um eigene, maßgeschneiderte Funktionen.</p>
              <div className="p-10 rounded-[2.5rem] bg-primary/[0.05] border border-primary/20 flex flex-col items-center text-center">
                <Layers className="w-12 h-12 text-primary mb-6 animate-pulse" />
                <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">Extend the Core</h4>
                <p className="text-lg text-slate-400 font-medium mb-8">Unsere Open-Source SDK ermöglicht es Entwicklern, eigene Cogs zu schreiben und nahtlos zu integrieren.</p>
                <div className="flex gap-4">
                  <a
                    href="https://github.com/ManagerX-Development/ManagerX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold group"
                  >
                    <Github className="w-5 h-5" />
                    Source Code
                  </a>
                  <div className="px-6 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold">
                    v2.4.0-Stable
                  </div>
                </div>
              </div>
            </Section>

            {/* Final Call to Action */}
            <div className="p-12 rounded-[3.5rem] glass-strong border border-primary/20 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 -translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
              <div className="relative z-10">
                <Mail className="w-16 h-16 text-primary mx-auto mb-6" />
                <h4 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">Bereit für den<br />nächsten Schritt?</h4>
                <p className="text-slate-400 font-medium mb-12 max-w-sm mx-auto">Installiere ManagerX noch heute und verwandle deinen Discord-Server in ein Powerhouse.</p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-4 px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-primary/20"
                >
                  Jetzt Starten
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <p className="mt-12 text-[10px] uppercase font-black tracking-[0.5em] text-slate-600">© 2026 ManagerX Development • Built for Communities</p>
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
});

export default PluginsPage;