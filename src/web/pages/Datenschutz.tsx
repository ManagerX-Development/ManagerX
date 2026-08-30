import { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield, Lock, Database, UserCheck,
  Activity, Server, FileText, Mail, Bell,
  Trash2, Eye, ShieldCheck, Globe, Cpu, ChevronRight,
  AlertTriangle, Clock, CheckCircle2, Scale, Info
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { motion } from "framer-motion";
import { LEGAL_CONFIG } from "../lib/legal";

const SECTIONS = [
  { id: "intro", title: "Einleitung & Geltungsbereich", icon: Shield },
  { id: "controller", title: "Verantwortliche Stelle", icon: UserCheck },
  { id: "collection", title: "Erhobene Daten", icon: Database },
  { id: "purpose", title: "Zweck der Verarbeitung", icon: Activity },
  { id: "legal-basis", title: "Rechtsgrundlagen", icon: Scale },
  { id: "storage", title: "Speicherdauer", icon: Clock },
  { id: "hosting", title: "Hosting & Standort", icon: Server },
  { id: "security", title: "Datensicherheit", icon: Lock },
  { id: "third-party", title: "Drittdienste", icon: Globe },
  { id: "rights", title: "Ihre Rechte (Art. 15–22)", icon: ShieldCheck },
  { id: "complaints", title: "Beschwerderecht", icon: Bell },
  { id: "decisions", title: "Automatisierte Entscheidungen", icon: Cpu },
  { id: "tracking", title: "Cookies & Tracking", icon: Eye },
  { id: "deletion", title: "Datenlöschung", icon: Trash2 },
  { id: "contact", title: "Datenschutzkontakt", icon: Mail },
];

const Section = ({ id, title, icon: Icon, children }: { id: string; title: string; icon: any; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-32 group">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h2 className="text-2xl font-black text-white uppercase italic tracking-tight group-hover:text-primary transition-colors">
        {title}
      </h2>
    </div>
    <div className="text-base leading-relaxed text-slate-400 font-medium">
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
    if (el) window.scrollTo({ top: el.offsetTop - 120, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 pt-48 pb-24 flex flex-col lg:flex-row gap-12 relative">

        {/* Sidebar */}
        <aside className="lg:w-80 shrink-0">
          <div className="sticky top-32 space-y-6">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 px-4">Inhalt</h3>
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
                    <section.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeSection === section.id ? "text-primary" : "text-slate-500"}`} />
                    <span className="truncate">{section.title}</span>
                    {activeSection === section.id && (
                      <motion.div layoutId="active-indicator-privacy" className="ml-auto shrink-0">
                        <ChevronRight className="w-3 h-3" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* GDPR Badge */}
            <div className="p-6 rounded-[2rem] bg-primary/[0.03] border border-primary/20 space-y-3">
              <Lock className="w-7 h-7 text-primary" />
              <h4 className="text-white font-bold text-sm">DSGVO-konform</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ihre Daten werden ausschließlich in {LEGAL_CONFIG.hosting.location} verarbeitet und gemäß EU-DSGVO behandelt.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600">System Secure</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                <Clock className="w-3 h-3 text-slate-600" />
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-600">Stand: {LEGAL_CONFIG.lastUpdate}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-2">Weitere Dokumente</p>
              <Link to="/legal/imprint" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-sm font-semibold text-slate-400 hover:text-white">
                <Info className="w-4 h-4 text-slate-500" />Impressum
              </Link>
              <Link to="/legal/terms" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-sm font-semibold text-slate-400 hover:text-white">
                <FileText className="w-4 h-4 text-slate-500" />Nutzungsbedingungen
              </Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-grow max-w-3xl">
          <header className="mb-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 text-primary mb-6">
              <Shield className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">Datenschutzerklärung · DSGVO / GDPR</span>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic leading-[0.9] mb-6">
              Daten<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">schutz</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium max-w-2xl leading-relaxed">
              Transparenz ist unser Grundsatz. Diese Erklärung informiert Sie gemäß Art. 13 DSGVO
              über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten durch ManagerX.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">DSGVO-konform</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-black uppercase tracking-widest text-blue-400">EU-Datenhaltung</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Stand: {LEGAL_CONFIG.lastUpdate}</span>
              </div>
            </div>
          </header>

          <article className="space-y-20">

            <Section id="intro" title="1. Einleitung & Geltungsbereich" icon={Shield}>
              <p>
                Diese Datenschutzerklärung gilt für den Discord-Bot <strong className="text-white">ManagerX</strong>, die Website <strong className="text-white">managerx-bot.de</strong> sowie das zugehörige Web-Dashboard. ManagerX wird betrieben von ManagerX Development Network (im Folgenden „wir", „uns").
              </p>
              <p className="mt-4">
                Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst und behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften – insbesondere der EU-Datenschutz-Grundverordnung (DSGVO), des Bundesdatenschutzgesetzes (BDSG) sowie des Digitale-Dienste-Gesetzes (DDG).
              </p>
              <div className="mt-6 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                <p className="text-sm font-bold text-blue-400 mb-2">Wichtiger Hinweis</p>
                <p className="text-sm text-slate-400">
                  ManagerX ist ein nicht-kommerzielles Open-Source-Projekt. Es werden keine Daten zu Werbezwecken verkauft oder weitergegeben.
                </p>
              </div>
            </Section>

            <Section id="controller" title="2. Verantwortliche Stelle (Art. 4 Nr. 7 DSGVO)" icon={UserCheck}>
              <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/20 transition-colors space-y-4">
                <p className="font-black text-white text-xl tracking-tight uppercase italic">ManagerX Development Network</p>
                <div className="space-y-1 text-sm text-slate-400">
                  <p className="text-white font-bold">{LEGAL_CONFIG.owner.name}</p>
                  <p>{LEGAL_CONFIG.owner.address.street}</p>
                  <p>{LEGAL_CONFIG.owner.address.city}, {LEGAL_CONFIG.owner.address.country}</p>
                  <div className="h-px w-12 bg-white/10 my-4" />
                  <p>E-Mail: <a href={`mailto:${LEGAL_CONFIG.contact.legalEmail}`} className="text-primary hover:underline font-bold">{LEGAL_CONFIG.contact.legalEmail}</a></p>
                </div>
              </div>
            </Section>

            <Section id="collection" title="3. Erhobene Daten" icon={Database}>
              <p>Bei der Interaktion mit ManagerX verarbeiten wir ausschließlich die für den Betrieb notwendigen Daten nach dem Grundsatz der Datensparsamkeit (Art. 5 Abs. 1 lit. c DSGVO):</p>
              <div className="mt-6 grid gap-3">
                {[
                  { label: "Discord-Benutzer-IDs", desc: "Numerische Identifikatoren zur Zuordnung von Befehlen, Strafen und Statistiken. Keine Klarnamen.", art: "Art. 6 Abs. 1 lit. f" },
                  { label: "Discord-Server-IDs & Kanal-IDs", desc: "Zur serverseitigen Konfiguration, Logging und Moderation.", art: "Art. 6 Abs. 1 lit. f" },
                  { label: "Benutzernamen & Avatare (Metadaten)", desc: "Werden temporär zur Darstellung in Embeds und Leaderboards genutzt; keine dauerhafte Speicherung.", art: "Art. 6 Abs. 1 lit. b" },
                  { label: "Moderationsdaten", desc: "Warnungen, Timeouts, Bans und zugehörige Begründungen zur Aufrechterhaltung der Netzwerksicherheit.", art: "Art. 6 Abs. 1 lit. f" },
                  { label: "Aktivitäts- & Statistikdaten", desc: "Nachrichten-Zählungen, Voice-Minuten, XP-Werte und Level für das Leveling-System.", art: "Art. 6 Abs. 1 lit. b" },
                  { label: "Server-Konfigurationsdaten", desc: "Einstellungen zu Kanälen, Rollen, Willkommensnachrichten und Berechtigungen.", art: "Art. 6 Abs. 1 lit. b" },
                  { label: "Web-Dashboard-Sitzungsdaten", desc: "OAuth2-Zugriffstoken von Discord für die Authentifizierung im Dashboard (Sitzungsdauer begrenzt).", art: "Art. 6 Abs. 1 lit. b" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-[#111318] border border-white/5 group hover:border-primary/20 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                      <Database className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h5 className="text-white font-bold text-sm">{item.label}</h5>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 shrink-0">{item.art}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="purpose" title="4. Zweck der Verarbeitung" icon={Activity}>
              <p>Die Verarbeitung personenbezogener Daten erfolgt ausschließlich für folgende Zwecke:</p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Bereitstellung der Kernfunktionen des Bots (Moderation, Leveling, Globaler Chat, Spiele).",
                  "Berechnung und Anzeige von XP-Fortschritten, Level-Aufstiegen und automatisierter Rollenzuweisung.",
                  "Sicherstellung der Netzwerksicherheit durch Erfassung und Verwaltung von Moderationsdaten.",
                  "Authentifizierung von Serveradministratoren im Web-Dashboard via Discord OAuth2.",
                  "Analyse von Systemfehlern und Bot-Performance zur Qualitätsverbesserung.",
                  "Bereitstellung serverübergreifender Statistiken und des globalen Leaderboards.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 p-4 rounded-xl bg-[#111318] border border-white/5">
                    <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="legal-basis" title="5. Rechtsgrundlagen (Art. 6 DSGVO)" icon={Scale}>
              <div className="space-y-4">
                {[
                  { art: "Art. 6 Abs. 1 lit. b DSGVO", title: "Vertragserfüllung", desc: "Verarbeitung zur Erfüllung des Nutzungsvertrages bei Interaktion mit dem Bot (Befehle ausführen, Dashboard nutzen)." },
                  { art: "Art. 6 Abs. 1 lit. f DSGVO", title: "Berechtigtes Interesse", desc: "Sicherung des stabilen Betriebs, Schutz vor Missbrauch und Spam, Verwaltung der Moderation und Netzwerkintegrität." },
                  { art: "Art. 6 Abs. 1 lit. a DSGVO", title: "Einwilligung", desc: "Für optionale Funktionen wie das öffentliche Leaderboard. Diese Einwilligung kann jederzeit widerrufen werden (Opt-out im Dashboard)." },
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-[#111318] border border-white/5 hover:border-primary/20 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="text-sm font-black text-white uppercase tracking-widest">{item.title}</h6>
                      <span className="text-[10px] font-black text-primary/60 tracking-wider">{item.art}</span>
                    </div>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="storage" title="6. Speicherdauer (Art. 5 Abs. 1 lit. e DSGVO)" icon={Clock}>
              <p>Wir speichern personenbezogene Daten nur so lange, wie es der jeweilige Verarbeitungszweck erfordert oder gesetzliche Aufbewahrungsfristen dies vorschreiben:</p>
              <div className="mt-8 relative border-l-2 border-primary/20 ml-4 pl-8 space-y-10">
                {[
                  { title: "Aktivitäts-Rohdaten", time: "30 Tage", info: "Rohdaten der Aktivität (z.B. stündliche Nachrichten-Counts) werden nach 30 Tagen gelöscht. Aggregierte Level-Werte bleiben erhalten." },
                  { title: "System-Log-Dateien", time: "90 Tage", info: "Technische Fehler-Logs und Zugriffsprotokolle zur Systemwartung werden nach 90 Tagen automatisch gelöscht." },
                  { title: "Moderationsdaten", time: "180 Tage", info: "Verwarnungen und Timeouts werden nach 180 Tagen automatisch aus dem aktiven System entfernt und archiviert." },
                  { title: "Server-Konfiguration", time: "Bis Bot-Entfernung", info: "Wird sofort und vollständig gelöscht, sobald ManagerX den Server verlässt (Discord-Event: guild_remove)." },
                  { title: "Dashboard-Sitzungen", time: "24 Stunden", info: "OAuth2-Tokens für das Web-Dashboard verfallen nach 24 Stunden Inaktivität automatisch." },
                  { title: "Account-Löschung", time: "Sofort auf Anfrage", info: "Alle mit einer Discord-ID verknüpften Daten werden auf Anfrage sofort und dauerhaft gelöscht (/user data delete)." },
                ].map((t, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[2.35rem] top-1 w-5 h-5 rounded-full bg-[#0a0c10] border-2 border-primary flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                      <h5 className="text-white font-bold text-sm">{t.title}</h5>
                      <span className="text-primary text-[10px] uppercase tracking-[0.2em] font-black px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">{t.time}</span>
                    </div>
                    <p className="text-sm text-slate-500 italic">{t.info}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="hosting" title="7. Hosting & Datenstandort" icon={Server}>
              <div className="p-8 rounded-[2.5rem] bg-primary/[0.03] border border-primary/20 flex flex-col items-center text-center space-y-4">
                <Server className="w-10 h-10 text-primary" />
                <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic">{LEGAL_CONFIG.hosting.location}</h4>
                <p className="text-slate-400 font-medium">{LEGAL_CONFIG.hosting.provider}</p>
                <p className="text-sm text-slate-500 max-w-md">{LEGAL_CONFIG.hosting.details}</p>
                <div className="flex gap-3 flex-wrap justify-center">
                  <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest">EU-Datenhaltung</div>
                  <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400">DSGVO-konform</div>
                </div>
              </div>
              <p className="mt-6 text-sm text-slate-500">
                Es findet keine Übermittlung von Daten in Drittländer außerhalb der EU/EWR statt.
                Alle Verarbeitungen erfolgen auf Servern innerhalb der Europäischen Union.
              </p>
            </Section>

            <Section id="security" title="8. Datensicherheit (Art. 32 DSGVO)" icon={Lock}>
              <p>Wir setzen dem Stand der Technik entsprechende technische und organisatorische Sicherheitsmaßnahmen ein:</p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: Lock, label: "HTTPS / TLS-Verschlüsselung", desc: "Alle Verbindungen sind via TLS 1.3 verschlüsselt." },
                  { icon: Database, label: "Verschlüsselte Backups", desc: "Datenbankbackups werden verschlüsselt gespeichert." },
                  { icon: Shield, label: "Zugriffskontrolle", desc: "Datenzugriff nur für autorisierte Systeme und Personen." },
                  { icon: Activity, label: "Monitoring", desc: "Automatische Erkennung von Anomalien und Angriffsversuchen." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-[#111318] border border-white/5">
                    <item.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-slate-500">
                Trotz technischer Schutzmaßnahmen kann keine absolute Sicherheit garantiert werden.
                Im Fall einer Datenpanne werden betroffene Nutzer und zuständige Behörden gemäß Art. 33/34 DSGVO informiert.
              </p>
            </Section>

            <Section id="third-party" title="9. Drittdienste & Datenweitergabe" icon={Globe}>
              <p>Eine Weitergabe Ihrer Daten an Dritte erfolgt <strong className="text-white">nicht</strong>, außer in folgenden Ausnahmefällen:</p>
              <div className="mt-6 space-y-4">
                <div className="p-5 rounded-2xl bg-[#111318] border border-white/5">
                  <h5 className="text-white font-bold text-sm mb-2">Discord API (Discord Inc., San Francisco, USA)</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Zur Kernfunktion interagiert ManagerX mit der Discord API. Discord Inc. verarbeitet dabei Daten gemäß ihrer eigenen Datenschutzrichtlinie (<a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">discord.com/privacy</a>).
                    Discord Inc. hat sich dem EU-U.S. Data Privacy Framework verpflichtet (Art. 45 DSGVO).
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-[#111318] border border-white/5">
                  <h5 className="text-white font-bold text-sm mb-2">Gesetzliche Verpflichtung</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Wir können zur Herausgabe von Daten verpflichtet sein, wenn eine gesetzliche Verpflichtung besteht (z.B. auf behördliche Anordnung). In diesem Fall handeln wir gemäß Art. 6 Abs. 1 lit. c DSGVO.
                  </p>
                </div>
              </div>
            </Section>

            <Section id="rights" title="10. Ihre Rechte (Art. 15–22 DSGVO)" icon={ShieldCheck}>
              <p>Als betroffene Person haben Sie gegenüber uns folgende Rechte:</p>
              <div className="mt-6 grid gap-3">
                {[
                  { art: "Art. 15", right: "Auskunftsrecht", desc: "Sie haben das Recht zu erfahren, ob und welche Daten wir über Sie verarbeiten." },
                  { art: "Art. 16", right: "Recht auf Berichtigung", desc: "Sie können die Berichtigung unrichtiger oder die Vervollständigung unvollständiger Daten verlangen." },
                  { art: "Art. 17", right: "Recht auf Löschung", desc: "Sie können die Löschung Ihrer Daten verlangen, sofern kein Aufbewahrungsrecht entgegensteht." },
                  { art: "Art. 18", right: "Recht auf Einschränkung", desc: "Sie können unter bestimmten Umständen die Einschränkung der Verarbeitung verlangen." },
                  { art: "Art. 20", right: "Recht auf Datenportabilität", desc: "Sie haben das Recht, Ihre Daten in einem strukturierten, maschinenlesbaren Format zu erhalten." },
                  { art: "Art. 21", right: "Widerspruchsrecht", desc: "Sie können der Verarbeitung Ihrer Daten auf Basis berechtigter Interessen jederzeit widersprechen." },
                  { art: "Art. 22", right: "Automatisierte Entscheidungen", desc: "Sie haben das Recht, nicht ausschließlich einer automatisierten Entscheidung mit rechtlicher Wirkung unterworfen zu werden." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-[#111318] border border-white/5 hover:border-primary/20 transition-all">
                    <span className="text-[10px] font-black text-primary/60 tracking-wider shrink-0 mt-1 w-16">{item.art}</span>
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">{item.right}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-slate-400">
                Zur Ausübung Ihrer Rechte wenden Sie sich bitte per E-Mail an{" "}
                <a href={`mailto:${LEGAL_CONFIG.contact.legalEmail}`} className="text-primary font-bold hover:underline">{LEGAL_CONFIG.contact.legalEmail}</a>.
                Wir werden Ihre Anfrage innerhalb von <strong className="text-white">30 Tagen</strong> bearbeiten (Art. 12 Abs. 3 DSGVO).
              </p>
            </Section>

            <Section id="complaints" title="11. Beschwerderecht bei der Aufsichtsbehörde (Art. 77 DSGVO)" icon={Bell}>
              <p>
                Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer
                personenbezogenen Daten durch uns zu beschweren. Die zuständige Aufsichtsbehörde für unseren Standort ist:
              </p>
              <div className="mt-6 p-6 rounded-2xl bg-[#111318] border border-white/5">
                <p className="text-white font-bold mb-1">Sächsischer Datenschutzbeauftragter (SächsDSB)</p>
                <p className="text-sm text-slate-400">Devrientstraße 5, 01067 Dresden</p>
                <p className="text-sm text-slate-400">Tel.: +49 351 85471 101</p>
                <a href="https://www.saechsdsb.de" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-bold mt-2 block">www.saechsdsb.de</a>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Sie können sich auch an die Aufsichtsbehörde Ihres Wohnortes oder Arbeitsortes wenden.
              </p>
            </Section>

            <Section id="decisions" title="12. Automatisierte Entscheidungen (Art. 22 DSGVO)" icon={Cpu}>
              <p>
                ManagerX trifft <strong className="text-white">keine vollautomatisierten Entscheidungen</strong> im Sinne des Art. 22 DSGVO,
                die Ihnen gegenüber rechtliche Wirkung entfalten oder Sie in ähnlicher Weise erheblich beeinträchtigen.
              </p>
              <p className="mt-4">
                Der Bot führt jedoch <em>funktionale Automatisierungen</em> durch, die explizit vom Serveradministrator konfiguriert werden:
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  "Automatische Rollenzuweisung bei Erreichen bestimmter Level-Schwellen.",
                  "Automatisches Löschen von Nachrichten, die Spam-Kriterien erfüllen.",
                  "Automatische Zeitstrafen bei Überschreiten von Verwarnungs-Schwellen.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 p-3 rounded-xl bg-[#111318] border border-white/5">
                    <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-6 rounded-2xl bg-[#111318] border border-primary/20">
                <h5 className="text-white font-bold mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" /> Anonymisierung im Leaderboard
                </h5>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Sie haben das Recht und die technische Möglichkeit, Ihr Profil auf dem globalen Leaderboard zu anonymisieren. Im Dashboard können Sie unter „Privatsphäre" festlegen, dass Ihr Discord-Name und Avatar ausgeblendet werden. Sie erscheinen dann als „Anonymer Nutzer". Die XP-Daten bleiben zur technischen Aufrechterhaltung des Systems gespeichert, werden jedoch nicht mit Ihrer Identität verknüpft.
                </p>
              </div>
            </Section>

            <Section id="tracking" title="13. Cookies & Tracking" icon={Eye}>
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-400 mb-1">Keine Cookies. Kein Tracking.</p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Wir verzichten vollständig auf den Einsatz von Tracking-Cookies, Web-Analytics-Diensten (wie Google Analytics), Werbe-Trackern oder Social-Media-Plugins von Drittanbietern.
                    Das Web-Dashboard verwendet ausschließlich notwendige Session-Tokens (kein Cookie-Banner erforderlich).
                  </p>
                </div>
              </div>
            </Section>

            <Section id="deletion" title="14. Datenlöschung (Art. 17 DSGVO)" icon={Trash2}>
              <p>Sie können Ihre bei ManagerX gespeicherten Daten jederzeit selbst einsehen oder löschen:</p>
              <div className="mt-6 grid gap-4">
                <div className="p-6 rounded-2xl bg-[#111318] border border-primary/20">
                  <p className="text-white font-bold text-sm mb-3">📥 Daten exportieren (Art. 15 & 20 DSGVO)</p>
                  <div className="font-mono text-primary text-lg mb-2">/user data get</div>
                  <p className="text-xs text-slate-500 italic">Erstellt ein vollständiges JSON-Paket mit allen mit Ihrer Discord-ID verknüpften Daten.</p>
                </div>
                <div className="p-6 rounded-2xl bg-[#111318] border border-red-500/20">
                  <p className="text-white font-bold text-sm mb-3">🗑️ Alle Daten löschen (Art. 17 DSGVO)</p>
                  <div className="font-mono text-red-400 text-lg mb-2">/user data delete</div>
                  <p className="text-xs text-slate-500 italic">Löscht unwiderruflich Ihr Profil, Levels, XP, Moderation-History und alle Einstellungen.</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Alternativ können Sie die Löschung per E-Mail an{" "}
                <a href={`mailto:${LEGAL_CONFIG.contact.legalEmail}`} className="text-primary font-bold hover:underline">{LEGAL_CONFIG.contact.legalEmail}</a>{" "}
                beantragen. Wir werden Ihrem Antrag innerhalb von 30 Tagen nachkommen.
              </p>
            </Section>

            <Section id="contact" title="15. Datenschutzkontakt" icon={Mail}>
              <div className="p-10 rounded-[3rem] glass-strong border border-primary/20 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="relative z-10">
                  <Mail className="w-12 h-12 text-primary mx-auto mb-5" />
                  <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Datenschutz-Anfragen</h4>
                  <a href={`mailto:${LEGAL_CONFIG.contact.legalEmail}`} className="text-xl text-primary hover:text-white transition-colors font-bold">
                    {LEGAL_CONFIG.contact.legalEmail}
                  </a>
                  <p className="mt-4 text-sm text-slate-500">Für alle Fragen zu Datenschutz, DSGVO-Rechten und Datenlöschung.</p>
                  <p className="mt-8 text-[10px] uppercase font-black tracking-[0.5em] text-slate-600">© {new Date().getFullYear()} ManagerX Development · Stand: {LEGAL_CONFIG.lastUpdate}</p>
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