import { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText, ChevronRight, Shield, Scale, Info,
  CheckCircle2, UserCheck, Lock, Zap, Users,
  Copyright, ExternalLink, Slash, ShieldAlert,
  AlertCircle, RefreshCw, Mail, Gavel, AlertTriangle,
  Clock, XCircle
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { motion } from "framer-motion";
import { LEGAL_CONFIG } from "../lib/legal";

const SECTIONS = [
  { id: "overview", title: "Übersicht & Geltungsbereich", icon: Info },
  { id: "acceptance", title: "Zustimmung zu den Bedingungen", icon: CheckCircle2 },
  { id: "eligibility", title: "Nutzungsvoraussetzungen", icon: UserCheck },
  { id: "security", title: "Konten & Sicherheit", icon: Lock },
  { id: "acceptable-use", title: "Zulässige Nutzung", icon: Zap },
  { id: "prohibited", title: "Verbotene Handlungen", icon: XCircle },
  { id: "community", title: "Community-Richtlinien", icon: Users },
  { id: "content-ip", title: "Geistiges Eigentum", icon: Copyright },
  { id: "third-party", title: "Drittanbieter-Dienste", icon: ExternalLink },
  { id: "termination", title: "Sperrung & Kündigung", icon: Slash },
  { id: "disclaimers", title: "Haftungsausschluss", icon: ShieldAlert },
  { id: "liability", title: "Haftungsbeschränkung", icon: AlertCircle },
  { id: "indemnity", title: "Freistellung", icon: Shield },
  { id: "changes", title: "Änderungen der Bedingungen", icon: RefreshCw },
  { id: "law", title: "Anwendbares Recht & Gerichtsstand", icon: Gavel },
  { id: "contact", title: "Kontakt", icon: Mail },
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

export const Nutzungsbedingungen = memo(function Nutzungsbedingungen() {
  const [activeSection, setActiveSection] = useState("overview");

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
                    <span className="truncate text-left">{section.title}</span>
                    {activeSection === section.id && (
                      <motion.div layoutId="active-indicator-tos" className="ml-auto shrink-0">
                        <ChevronRight className="w-3 h-3" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6 rounded-[2rem] bg-primary/[0.03] border border-primary/20 space-y-3">
              <Gavel className="w-7 h-7 text-primary" />
              <h4 className="text-white font-bold text-sm">Rechtlich bindend</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Durch die Nutzung von ManagerX stimmen Sie diesen Bedingungen zu.
              </p>
              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                <Clock className="w-3 h-3 text-slate-600" />
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-600">Stand: {LEGAL_CONFIG.lastUpdate}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-2">Weitere Dokumente</p>
              <Link to="/legal/imprint" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-sm font-semibold text-slate-400 hover:text-white">
                <Info className="w-4 h-4 text-slate-500" /> Impressum
              </Link>
              <Link to="/legal/privacy" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-sm font-semibold text-slate-400 hover:text-white">
                <Shield className="w-4 h-4 text-slate-500" /> Datenschutzerklärung
              </Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-grow max-w-3xl">
          <header className="mb-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 text-primary mb-6">
              <FileText className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">Nutzungsbedingungen · Terms of Service</span>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic leading-[0.9] mb-6">
              Nutzungs<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">bedingungen</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium max-w-2xl leading-relaxed">
              Bitte lesen Sie diese Bedingungen sorgfältig, bevor Sie ManagerX nutzen.
              Sie regeln die Rechtsbeziehung zwischen Ihnen und ManagerX Development Network.
            </p>

            <div className="mt-8 flex items-start gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-400 mb-1">Durch die Nutzung stimmen Sie zu</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mit dem Hinzufügen des Bots zu einem Server, der Nutzung der Website oder des Dashboards erklären Sie sich mit diesen Bedingungen einverstanden.
                  Wenn Sie nicht zustimmen, nutzen Sie ManagerX bitte nicht.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 opacity-60">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Letzte Änderung</span>
                <span className="text-sm font-bold text-white">{LEGAL_CONFIG.lastUpdate}</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Version</span>
                <span className="text-sm font-bold text-white">{LEGAL_CONFIG.version}</span>
              </div>
            </div>
          </header>

          <article className="space-y-20">

            <Section id="overview" title="1. Übersicht & Geltungsbereich" icon={Info}>
              <p>
                ManagerX ist ein Discord-Bot, der Server-Management, Moderation, Leveling und Unterhaltungsfunktionen bereitstellt.
                Dienstanbieter ist <strong className="text-white">ManagerX Development Network</strong> (im Folgenden „ManagerX", „wir", „uns").
              </p>
              <p className="mt-4">
                Diese Nutzungsbedingungen gelten für die Nutzung von:
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  "Den Discord-Bot ManagerX (Bot-ID: 1542970562588975135)",
                  "Die Website managerx-bot.de",
                  "Das Web-Dashboard (dash.managerx-bot.de)",
                  "Alle öffentlichen APIs von ManagerX",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 p-3 rounded-xl bg-[#111318] border border-white/5">
                    <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4">
                Die Nutzung erfolgt ergänzend in Übereinstimmung mit unserer <Link to="/datenschutz" className="text-primary hover:underline font-bold">Datenschutzerklärung</Link>.
              </p>
            </Section>

            <Section id="acceptance" title="2. Zustimmung zu den Bedingungen" icon={CheckCircle2}>
              <p>
                Durch das Hinzufügen von ManagerX zu einem Discord-Server, die Nutzung unserer Website oder den Zugriff auf unser Dashboard
                erklären Sie sich – als natürliche Person oder als Serveradministrator im Namen Ihres Servers – mit diesen Bedingungen
                in ihrer jeweils gültigen Fassung einverstanden.
              </p>
              <div className="mt-6 p-6 rounded-2xl bg-[#111318] border border-l-4 border-l-primary border-white/5">
                <p className="text-sm font-bold text-white mb-2">Wichtiger Hinweis</p>
                <p className="text-sm">
                  Wenn Sie diesen Bedingungen nicht zustimmen, ist Ihnen die Nutzung unserer Dienste untersagt.
                  Bitte entfernen Sie in diesem Fall den Bot von Ihrem Server und stellen Sie die Nutzung unserer Website ein.
                </p>
              </div>
            </Section>

            <Section id="eligibility" title="3. Nutzungsvoraussetzungen" icon={UserCheck}>
              <p>Die Nutzung von ManagerX setzt Folgendes voraus:</p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-primary font-black">01</span>
                  <span>Sie müssen mindestens <strong className="text-white">13 Jahre alt</strong> sein (Discord-Mindestalter gemäß deren ToS). In manchen EU-Ländern gilt ein höheres Mindestalter (bis 16 Jahre).</span>
                </li>
                <li className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-primary font-black">02</span>
                  <span>Sie benötigen ein gültiges, aktives Discord-Konto gemäß den <a href="https://discord.com/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Nutzungsbedingungen von Discord</a>.</span>
                </li>
                <li className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-primary font-black">03</span>
                  <span>Um ManagerX auf einem Server hinzuzufügen, benötigen Sie auf diesem Server die Discord-Berechtigung <strong className="text-white">„Server verwalten"</strong>.</span>
                </li>
                <li className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-primary font-black">04</span>
                  <span>Sie müssen rechtlich handlungsfähig sein und dürfen durch keine geltenden Gesetze von der Nutzung ausgeschlossen sein.</span>
                </li>
              </ul>
            </Section>

            <Section id="security" title="4. Konten & Sicherheit" icon={Lock}>
              <p>Die Sicherheit Ihres Discord-Kontos und der Bot-Konfiguration auf Ihrem Server liegt in Ihrer Verantwortung:</p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Korrekte und umsichtige Konfiguration der Bot-Berechtigungen auf Ihrem Server.",
                  "Schutz Ihres Discord-Accounts vor unbefugtem Zugriff (starkes Passwort, 2FA).",
                  "Verantwortung für alle Aktionen, die durch Ihrer Anweisung ausgeführte Bot-Befehle entstehen.",
                  "Sofortige Benachrichtigung, falls Sie Kenntnis von einem Missbrauch des Bots auf Ihrem Server erlangen.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-6 rounded-2xl bg-primary/[0.03] border border-primary/20">
                <h5 className="text-white font-bold mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> Serverübergreifende Funktionen (Global XP)
                </h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Das globale Level-System (Global XP) wirkt serverübergreifend aus. Durch Ihre Aktivität in teilnehmenden Servern
                  willigen Sie ein, dass Ihre Aktivitätsdaten in einem globalen Kontext verarbeitet werden.
                  Sie können Ihr Profil im Dashboard jederzeit anonymisieren (Opt-out).
                </p>
              </div>
            </Section>

            <Section id="acceptable-use" title="5. Zulässige Nutzung" icon={Zap}>
              <p>ManagerX darf ausschließlich für seine vorgesehenen Zwecke genutzt werden:</p>
              <div className="mt-6 grid gap-3">
                {[
                  "Server-Moderation und Verwaltung von Discord-Servern.",
                  "Engagement und Gamification durch das XP- und Leveling-System.",
                  "Community-Kommunikation über den Global-Chat.",
                  "Unterhaltung durch integrierte Minispiele.",
                  "Verwaltung des eigenen Nutzerprofils über das Dashboard.",
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-4 rounded-xl bg-[#111318] border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="prohibited" title="6. Verbotene Handlungen" icon={XCircle}>
              <p>Folgende Nutzungen sind ausdrücklich untersagt. Verstöße können zur sofortigen Sperrung führen:</p>
              <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {[
                  "Durchführung illegaler Aktivitäten jeglicher Art",
                  "Belästigung, Stalking oder Bedrohung anderer Nutzer",
                  "Versenden von Spam oder unerwünschten Massennachrichten",
                  "Umgehung von Sicherheitsfunktionen oder Sperren",
                  "DDoS-Angriffe oder andere Cyberangriffe",
                  "Verbreitung von Malware, Viren oder Phishing-Links",
                  "Automatisierte API-Abfragen ohne Genehmigung (Scraping)",
                  "Reverse Engineering oder Dekompilierung des Bot-Codes",
                  "Raiding, Massen-Beitritt oder koordiniertes Massen-Spamming",
                  "Nutzung von Self-Bots oder unautorisierten Bot-Clients",
                  "Verbreitung von Hassrede, Diskriminierung oder illegalen Inhalten",
                  "Missbrauch von Moderationsfunktionen gegen unschuldige Nutzer",
                  "Impersonation (Identitätsmissbrauch) von ManagerX oder unseren Mitarbeitern",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#111318] border border-red-500/10 text-sm">
                    <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="community" title="7. Community-Richtlinien" icon={Users}>
              <p>
                Wir fördern eine sichere und respektvolle Umgebung für alle. Als Dienstanbieter behalten wir uns das Recht vor,
                Server oder Nutzer von unseren Diensten auszuschließen, die gegen Community-Standards verstoßen.
              </p>
              <div className="mt-6 grid gap-4">
                {[
                  { title: "Null-Toleranz bei Hassrede & Gewalt", desc: "Server, die Hassrede, Gewaltverherrlichung, extremistische Ideologien oder illegale Inhalte (insbesondere CSAM) fördern, werden ohne Vorwarnung dauerhaft gesperrt.", color: "border-red-500/20" },
                  { title: "Einhaltung der Discord ToS", desc: "Alle Nutzer müssen zusätzlich die aktuellen Nutzungsbedingungen und Community-Richtlinien von Discord einhalten.", color: "border-blue-500/20" },
                  { title: "Respektvoller Umgang", desc: "Persönliche Angriffe, Doxxing oder die gezielte Schädigung anderer Nutzer im Global-Chat oder über Bot-Funktionen werden nicht toleriert.", color: "border-amber-500/20" },
                ].map((item, i) => (
                  <div key={i} className={`p-6 rounded-2xl bg-white/5 border ${item.color}`}>
                    <h5 className="text-white font-bold mb-2">{item.title}</h5>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="content-ip" title="8. Geistiges Eigentum" icon={Copyright}>
              <p>
                Die Markenrechte an <strong className="text-white">ManagerX</strong>, die Logos, das UI-Design und die Website liegen bei ManagerX Development Network.
                Eine Nutzung des Namens oder der Markenzeichen ohne ausdrückliche schriftliche Genehmigung ist untersagt.
              </p>
              <p className="mt-4">
                Der Quellcode des Bots ist unter der <strong className="text-white">GNU General Public License v3.0 (GPL-3.0)</strong> lizenziert.
                Dies bedeutet: Sie können den Code frei verwenden, kopieren, verbreiten und modifizieren – sofern Sie die GPL-Lizenzbedingungen einhalten
                und Ihre Ableitungen ebenfalls unter GPL-3.0 veröffentlichen.
              </p>
              <div className="mt-6 flex gap-3 flex-wrap">
                <a href="https://github.com/ManagerX-Development/ManagerX" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-sm">
                  GitHub Repository
                </a>
                <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all font-bold text-sm text-primary">
                  GPL-3.0 Lizenz
                </a>
              </div>
            </Section>

            <Section id="third-party" title="9. Drittanbieter-Dienste" icon={ExternalLink}>
              <p>
                ManagerX interagiert mit Drittanbietern, insbesondere der <strong className="text-white">Discord API</strong> (Discord Inc., San Francisco, USA).
                Wir haben keinen Einfluss auf die Verfügbarkeit, Leistung oder Datenschutzpraktiken von Discord.
                Ausfälle der Discord API können die Verfügbarkeit von ManagerX beeinträchtigen.
              </p>
              <p className="mt-4 text-sm">
                Für die Nutzung von Discord gelten zusätzlich die <a href="https://discord.com/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Nutzungsbedingungen von Discord</a>.
              </p>
            </Section>

            <Section id="termination" title="10. Sperrung & Kündigung" icon={Slash}>
              <p>
                Wir behalten uns das Recht vor, den Zugriff auf ManagerX für bestimmte Nutzer-IDs, Server-IDs oder IP-Adressen
                <strong className="text-white"> vorübergehend oder dauerhaft zu sperren</strong>, wenn gegen diese Bedingungen,
                die Datenschutzerklärung oder geltende Gesetze verstoßen wird.
              </p>
              <div className="mt-6 space-y-3">
                <div className="p-5 rounded-2xl bg-[#111318] border border-white/5">
                  <h5 className="text-white font-bold text-sm mb-1">Grundlose Kündigung durch Nutzer</h5>
                  <p className="text-xs text-slate-500">Sie können ManagerX jederzeit durch das Entfernen des Bots von Ihrem Server beenden. Alle Serverdaten werden daraufhin gelöscht.</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#111318] border border-red-500/20">
                  <h5 className="text-white font-bold text-sm mb-1">Sperrung durch ManagerX</h5>
                  <p className="text-xs text-slate-500">Bei schwerwiegenden Verstößen (insbesondere Abschnitt 6) erfolgt eine sofortige Sperrung ohne Vorankündigung. Es besteht kein Anspruch auf Wiederherstellung.</p>
                </div>
              </div>
            </Section>

            <Section id="disclaimers" title="11. Haftungsausschluss" icon={ShieldAlert}>
              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 mb-6">
                <p className="text-sm font-bold text-amber-400 mb-1">Dienst „wie besehen" (As-is)</p>
                <p className="text-sm text-slate-400">ManagerX wird ohne Mängelgewähr und ohne jegliche ausdrückliche oder stillschweigende Garantien bereitgestellt.</p>
              </div>
              <p>Insbesondere übernehmen wir keine Gewähr für:</p>
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  "Ununterbrochene Verfügbarkeit oder Fehlerfreiheit des Dienstes.",
                  "Absolute Richtigkeit von angezeigten Statistiken und Level-Berechnungen.",
                  "Kompatibilität mit zukünftigen Discord-API-Updates.",
                  "Die Sicherheit oder den Inhalt verlinkter externer Dienste.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 p-3 rounded-xl bg-[#111318] border border-white/5">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="liability" title="12. Haftungsbeschränkung" icon={AlertCircle}>
              <p>
                Soweit gesetzlich zulässig, haftet ManagerX Development Network und {LEGAL_CONFIG.owner.name} nicht für:
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  "Indirekte Schäden, Folgeschäden oder entgangene Gewinne.",
                  "Datenverluste, die durch Bot-Fehlfunktionen oder Discord-API-Ausfälle entstehen.",
                  "Schäden, die durch Missbrauch des Bots durch Dritte auf Ihrem Server entstehen.",
                  "Schäden durch Angriffe auf die Discord-Infrastruktur.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 p-3 rounded-xl bg-[#111318] border border-white/5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                <p className="text-sm font-bold text-blue-400 mb-1">Gesetzliche Haftung bleibt unberührt</p>
                <p className="text-sm text-slate-400">
                  Diese Haftungsbeschränkung gilt nicht für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit
                  sowie für grobe Fahrlässigkeit oder Vorsatz gemäß § 276 BGB. Die gesetzliche Haftung bleibt in jedem Fall bestehen.
                </p>
              </div>
            </Section>

            <Section id="indemnity" title="13. Freistellung" icon={Shield}>
              <p>
                Sie erklären sich damit einverstanden, ManagerX Development Network, {LEGAL_CONFIG.owner.name} und etwaige
                Mitarbeiter oder Beitragende von allen Ansprüchen, Schäden, Verlusten und Kosten (einschließlich angemessener
                Anwaltskosten) freizustellen, die sich aus Folgendem ergeben:
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  "Ihrer Nutzung der ManagerX-Dienste in Verletzung dieser Bedingungen.",
                  "Ihrer Verletzung von Rechten Dritter.",
                  "Ihrer Verletzung geltender Gesetze oder Behördenvorschriften.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 p-3 rounded-xl bg-[#111318] border border-white/5">
                    <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="changes" title="14. Änderungen der Bedingungen" icon={RefreshCw}>
              <p>
                Wir behalten uns vor, diese Nutzungsbedingungen jederzeit anzupassen. Wesentliche Änderungen werden
                mindestens <strong className="text-white">7 Tage im Voraus</strong> über folgende Kanäle angekündigt:
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex gap-3 p-3 rounded-xl bg-[#111318] border border-white/5">
                  <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  Ankündigung auf unserem Discord Support-Server (<a href="https://discord.gg/9T28DWup3g" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">discord.gg/9T28DWup3g</a>)
                </li>
                <li className="flex gap-3 p-3 rounded-xl bg-[#111318] border border-white/5">
                  <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  Aktualisierung des Datums „Stand" auf dieser Seite
                </li>
              </ul>
              <p className="mt-4 text-sm">
                Die fortgesetzte Nutzung von ManagerX nach Inkrafttreten der Änderungen gilt als Zustimmung.
                Wenn Sie den Änderungen nicht zustimmen, beenden Sie bitte die Nutzung.
              </p>
            </Section>

            <Section id="law" title="15. Anwendbares Recht & Gerichtsstand" icon={Gavel}>
              <div className="p-6 rounded-2xl bg-[#111318] border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Anwendbares Recht</span>
                  <span className="text-sm font-bold text-white">Recht der Bundesrepublik Deutschland</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Gerichtsstand</span>
                  <span className="text-sm font-bold text-white">04523 Pegau, Sachsen, Deutschland</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Sprache (maßgeblich)</span>
                  <span className="text-sm font-bold text-white">Deutsch</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Diese Bedingungen unterliegen dem Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG).
                Gerichtsstand für alle Streitigkeiten ist, soweit gesetzlich zulässig, der Sitz des Dienstanbieters.
                Für Verbraucher gilt § 29 ZPO (Gerichtsstand am Wohnort des Verbrauchers).
              </p>
            </Section>

            <Section id="contact" title="16. Kontakt" icon={Mail}>
              <div className="p-10 rounded-[3rem] glass-strong border border-primary/20 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="relative z-10">
                  <Mail className="w-12 h-12 text-primary mx-auto mb-5" />
                  <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Rechtliche Anfragen</h4>
                  <a href={`mailto:${LEGAL_CONFIG.contact.legalEmail}`} className="text-xl text-primary hover:text-white transition-colors font-bold">
                    {LEGAL_CONFIG.contact.legalEmail}
                  </a>
                  <p className="mt-3 text-sm text-slate-500">ManagerX Development Network · {LEGAL_CONFIG.owner.name}</p>
                  <p className="mt-8 text-[10px] uppercase font-black tracking-[0.5em] text-slate-600">
                    Stand: {LEGAL_CONFIG.lastUpdate} · Version {LEGAL_CONFIG.version} · © ManagerX Development
                  </p>
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

export default Nutzungsbedingungen;