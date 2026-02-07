import { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Shield, Lock, Database, UserCheck,
  Activity, Server, FileText, Mail, Bell,
  Trash2, Eye, ShieldCheck, Globe, Cpu, ChevronRight, AlertTriangle
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { motion } from "framer-motion";

const SECTIONS = [
  { id: "intro", title: "Introduction", icon: Shield },
  { id: "controller", title: "Data Controller", icon: UserCheck },
  { id: "collection", title: "Data Collection", icon: Database },
  { id: "purpose", title: "Purpose of Processing", icon: Activity },
  { id: "legal-basis", title: "Legal Basis", icon: FileText },
  { id: "storage", title: "Storage Duration", icon: Activity },
  { id: "hosting", title: "Hosting & Location", icon: Server },
  { id: "security", title: "Data Security", icon: Lock },
  { id: "rights", title: "Your Rights", icon: ShieldCheck },
  { id: "complaints", title: "Right to Complain", icon: Bell },
  { id: "decisions", title: "Automated Decisions", icon: Cpu },
  { id: "tracking", title: "Cookies & Tracking", icon: Eye },
  { id: "web-hosting", title: "Web Hosting", icon: Globe },
  { id: "deletion", title: "Data Deletion", icon: Trash2 },
  { id: "contact", title: "Contact", icon: Mail },
];

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-32 group">
    <div className="flex items-center gap-4 mb-10">
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      <h2 className="text-3xl font-black text-white uppercase italic tracking-tight group-hover:text-primary transition-colors">
        {title}
      </h2>
    </div>
    <div className="text-lg leading-relaxed text-slate-400 font-medium whitespace-pre-wrap">
      {children}
    </div>
  </section>
);

export const Datenschutz = memo(function Datenschutz() {
  const [activeSection, setActiveSection] = useState("intro");

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
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 px-4">Contents</h3>
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
                      <motion.div layoutId="active-indicator-privacy" className="ml-auto">
                        <ChevronRight className="w-3 h-3" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8 rounded-[2rem] bg-primary/[0.02] border border-primary/20">
              <Lock className="w-8 h-8 text-primary mb-4" />
              <h4 className="text-white font-bold mb-2">GDPR Compliant</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">Ihre Daten werden nach strengsten EU-Richtlinien in Frankfurt gehostet.</p>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">System Secure</span>
              </div>
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
              <Shield className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">Privacy Documentation</span>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic leading-[0.9] mb-6">
              Daten<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">schutz</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium max-w-2xl leading-relaxed">
              Transparenz ist unser Kernwert. Wir erklären genau, welche Daten ManagerX erhebt,
              warum wir dies tun und wie wir sie schützen.
            </p>
            <div className="mt-12 p-1 px-6 rounded-full bg-white/5 border border-white/10 w-fit flex items-center gap-4">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status: DSGVO / GDPR Standard v2.0</span>
            </div>
          </header>

          <article className="space-y-24">
            <Section id="intro" title="1. Einleitung">
              <p>ManagerX ("wir", "Bot") nimmt den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>
            </Section>

            <Section id="controller" title="2. Verantwortliche Stelle">
              <div className="p-8 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                <p className="font-black text-white text-2xl tracking-tight uppercase italic underline decoration-primary/30">OPPRO.NET Network</p>
                <div className="space-y-1 text-base text-slate-400 font-medium">
                  <p className="text-white font-bold">Lenny Steiger</p>
                  <p>Eulauer Str. 24</p>
                  <p>04523 Pegau, Deutschland</p>
                  <div className="h-px w-12 bg-white/10 my-4" />
                  <p>
                    E-Mail:{" "}
                    <a href="mailto:contact@oppro-network.de" className="text-primary hover:underline font-bold">
                      contact@oppro-network.de
                    </a>
                  </p>
                </div>
              </div>
            </Section>

            <Section id="collection" title="3. Erhobene Daten">
              <p>Bei der Interaktion mit ManagerX verarbeiten wir nur die absolut notwendigen Daten:</p>
              <div className="mt-8 grid gap-4">
                {[
                  { label: "Discord-IDs", desc: "Benutzer-, Server- und Channel-IDs für funktionale Zuweisungen." },
                  { label: "Metadaten", desc: "Usernames, Rollen-Namen und Avatare für Embed-Darstellungen." },
                  { label: "Moderationsdaten", desc: "Warnungen, Bann-Begründungen und Notizen zur Sicherheit." },
                  { label: "Statistiken", desc: "XP-Werte, Level und Aktivitäts-Timestamps." },
                  { label: "Configs", desc: "Server-spezifische Einstellungen (z.B. Willkommens-Kanäle)." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-[#111318] border border-white/5 group hover:border-primary/20 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-primary/10 transition-colors">
                      <Database className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h5 className="text-white font-bold text-sm mb-1">{item.label}</h5>
                      <p className="text-xs text-slate-500 leading-relaxed italic">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="purpose" title="4. Zweck der Verarbeitung">
              <p>Die Datenverarbeitung dient ausschließlich der Kernfunktionalität von ManagerX:</p>
              <ul className="mt-6 space-y-4 text-base italic">
                <li className="flex gap-4">
                  <ChevronRight className="w-5 h-5 text-primary shrink-0" />
                  <span>Bereitstellung von Moderations-Tools.</span>
                </li>
                <li className="flex gap-4">
                  <ChevronRight className="w-5 h-5 text-primary shrink-0" />
                  <span>Berechnung von Level-Fortschritten.</span>
                </li>
                <li className="flex gap-4">
                  <ChevronRight className="w-5 h-5 text-primary shrink-0" />
                  <span>Analyse von Fehlermeldungen zur Verbesserung.</span>
                </li>
              </ul>
            </Section>

            <Section id="legal-basis" title="5. Rechtsgrundlage">
              <div className="space-y-6">
                <div className="p-6 rounded-2xl border border-white/5 border-l-primary border-l-4">
                  <h6 className="text-sm font-black text-white uppercase tracking-widest mb-2">Art. 6 Abs. 1 lit. f DSGVO</h6>
                  <p className="text-sm">Berechtigtes Interesse am stabilen Betrieb eines Bots.</p>
                </div>
                <div className="p-6 rounded-2xl border border-white/5 border-l-accent border-l-4">
                  <h6 className="text-sm font-black text-white uppercase tracking-widest mb-2">Art. 6 Abs. 1 lit. b DSGVO</h6>
                  <p className="text-sm">Erfüllung der vertraglichen Vereinbarung bei Interaktion.</p>
                </div>
              </div>
            </Section>

            <Section id="storage" title="6. Speicherdauer">
              <p>Wir speichern Daten nur so lange, wie es der Zweck erfordert:</p>
              <div className="mt-8 relative border-l border-white/10 ml-4 pl-8 space-y-12">
                {[
                  { title: "Moderationsdaten", time: "2 Jahre", info: "Zur Nachverfolgung." },
                  { title: "Log-Dateien", time: "90 Tage", info: "Automatische Löschung." },
                  { title: "Server-Daten", time: "Bis Beendigung", info: "Werden gelöscht, wenn der Bot den Server verlässt." }
                ].map((t, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[2.35rem] top-1.5 w-6 h-6 rounded-full bg-[#0a0c10] border-2 border-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <h5 className="text-white font-bold">{t.title} <span className="text-primary ml-2 uppercase text-[10px] tracking-[0.2em] font-black">{t.time}</span></h5>
                    <p className="text-sm text-slate-500 mt-1 italic">{t.info}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="hosting" title="7. Hosting & Standort">
              <div className="p-10 rounded-[2.5rem] bg-primary/[0.05] border border-primary/20 flex flex-col items-center text-center">
                <Server className="w-12 h-12 text-primary mb-6 animate-pulse" />
                <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">Frankfurt am Main</h4>
                <p className="text-lg text-slate-400 font-medium">Unsere Server stehen in Deutschland (EU).</p>
                <div className="mt-6 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest">Safe EU Data Residency</div>
              </div>
            </Section>

            <Section id="security" title="8. Datensicherheit">
              <p>Wir setzen moderne technische Schutzmaßnahmen ein wie verschlüsselte Backups und HTTPS-Kommunikation.</p>
            </Section>

            <Section id="rights" title="9. Ihre Rechte">
              <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Widerspruch.</p>
              <p className="mt-8 text-sm italic">Senden Sie uns eine E-Mail an <span className="text-primary font-bold">legal@oppro-network.de</span>.</p>
            </Section>

            <Section id="complaints" title="10. Beschwerderecht">
              <p>Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren.</p>
            </Section>

            <Section id="decisions" title="11. Automatische Entscheidungen">
              <p>ManagerX trifft keine vollautomatisierten Entscheidungen nach Art. 22 DSGVO.</p>
            </Section>

            <Section id="tracking" title="12. Cookies & Tracking">
              <p>Wir verzichten vollständig auf Cookies oder Tracker.</p>
            </Section>

            <Section id="web-hosting" title="13. Web-Hosting">
              <p>Diese Website wird über GitHub Pages gehostet.</p>
            </Section>

            <Section id="deletion" title="14. Daten löschen">
              <p>Verwenden Sie den Command:</p>
              <div className="mt-6 p-6 rounded-2xl bg-[#111318] border border-primary/20 font-mono text-primary flex items-center justify-between group">
                <span className="text-xl">/user data delete</span>
                <Trash2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              </div>
              <p className="mt-4 text-sm text-slate-500">Dies löscht alle persönlichen Daten permanent.</p>
            </Section>

            <Section id="contact" title="15. Kontakt">
              <div className="p-12 rounded-[3rem] glass-strong border border-primary/20 text-center relative overflow-hidden group">
                <div className="relative z-10">
                  <Mail className="w-16 h-16 text-primary mx-auto mb-6" />
                  <h4 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Privacy Support</h4>
                  <a href="mailto:legal@oppro-network.de" className="text-2xl text-slate-400 hover:text-white transition-colors underline underline-offset-8 decoration-primary/40">
                    legal@oppro-network.de
                  </a>
                  <p className="mt-12 text-[10px] uppercase font-black tracking-[0.5em] text-slate-600">© 2026 ManagerX Development</p>
                </div>
              </div>
            </Section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
});

export default Datenschutz;