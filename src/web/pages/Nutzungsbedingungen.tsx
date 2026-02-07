import { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, FileText, ChevronRight, Shield, Scale, Info,
  CheckCircle, UserCheck, Lock, Zap, Users, MessageSquare,
  Copyright, CreditCard, ExternalLink, Slash, ShieldAlert,
  AlertCircle, RefreshCw, Mail, Gavel
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { motion } from "framer-motion";

const SECTIONS = [
  { id: "overview", title: "Overview", icon: Info },
  { id: "acceptance", title: "Acceptance", icon: CheckCircle },
  { id: "eligibility", title: "Eligibility", icon: UserCheck },
  { id: "security", title: "Accounts & Security", icon: Lock },
  { id: "acceptable-use", title: "Acceptable Use", icon: Zap },
  { id: "community", title: "Community Guidelines", icon: Users },
  { id: "content-ip", title: "Content & IP", icon: Copyright },
  { id: "third-party", title: "Third-Party Services", icon: ExternalLink },
  { id: "termination", title: "Suspension & Termination", icon: Slash },
  { id: "disclaimers", title: "Disclaimers", icon: ShieldAlert },
  { id: "liability", title: "Limitation of Liability", icon: AlertCircle },
  { id: "indemnity", title: "Indemnity", icon: Shield },
  { id: "changes", title: "Changes to Terms", icon: RefreshCw },
  { id: "contact", title: "Contact", icon: Mail },
  { id: "law", title: "Governing Law", icon: Gavel },
];

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-32 group">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-px h-8 bg-primary/30 group-hover:h-12 transition-all duration-500" />
      <h2 className="text-3xl font-black text-white uppercase italic tracking-tight group-hover:text-primary transition-colors">
        {title}
      </h2>
    </div>
    <div className="text-lg leading-relaxed text-slate-400 font-medium whitespace-pre-wrap">
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

        {/* Sidebar Container */}
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
                      <motion.div layoutId="active-indicator" className="ml-auto">
                        <ChevronRight className="w-3 h-3" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 shadow-2xl">
              <h4 className="text-white font-bold mb-2">Need help?</h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">Unser Team steht für rechtliche Fragen zur Verfügung.</p>
              <a href="mailto:legal@managerx-bot.de" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:text-white transition-colors">
                Contact Legal <ArrowLeft className="w-3 h-3 rotate-180" />
              </a>
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
              <FileText className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">Legal Documentation</span>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic leading-[0.9] mb-6">
              Nutzungs<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">bedingungen</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium max-w-2xl leading-relaxed">
              Bitte lesen Sie diese Bedingungen sorgfältig durch, bevor Sie ManagerX nutzen.
              Sie regeln die rechtliche Beziehung zwischen Ihnen und ManagerX Development.
            </p>
            <div className="mt-8 flex items-center gap-6 opacity-40">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black tracking-widest mb-1 text-slate-500">Last Updated</span>
                <span className="text-xs font-bold text-white">February 06, 2026</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black tracking-widest mb-1 text-slate-500">Version</span>
                <span className="text-xs font-bold text-white">2.2.0 (Stable)</span>
              </div>
            </div>
          </header>

          <article className="space-y-24">
            <Section id="overview" title="1. Übersicht">
              <p>ManagerX ist ein Discord-Bot, der Server-Management, Moderation, Leveling und Unterhaltungsfunktionen bereitstellt. Diese Bedingungen regeln den Zugriff auf und die Nutzung der ManagerX-Dienste, einschließlich unserer Website und API.</p>
              <p className="mt-4 text-slate-400 italic">Unsere Mission ist es, Discord-Communities sicherere und engagiertere Werkzeuge zur Verfügung zu stellen.</p>
            </Section>

            <Section id="acceptance" title="2. Zustimmung">
              <p>Durch das Hinzufügen des Bots zu einem Discord-Server, die Nutzung unserer Website oder den Zugriff auf unsere API erklären Sie sich mit diesen Bedingungen einverstanden.</p>
              <div className="mt-6 p-6 rounded-2xl bg-[#111318] border border-white/5 border-l-primary border-l-4">
                <p className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Wichtiger Hinweis</p>
                <p className="text-sm">Wenn Sie diesen Bedingungen nicht in vollem Umfang zustimmen, ist Ihnen die Nutzung unserer Dienste untersagt.</p>
              </div>
            </Section>

            <Section id="eligibility" title="3. Berechtigung">
              <p>Sie müssen mindestens 13 Jahre alt sein (oder das in Ihrem Land geltende Mindestalter für die Nutzung von Discord erreicht haben), um ManagerX zu nutzen.</p>
              <p className="mt-4">Durch die Nutzung bestätigen Sie, dass Sie über die rechtliche Befugnis verfügen, diese Vereinbarung einzugehen.</p>
            </Section>

            <Section id="security" title="4. Konten & Sicherheit">
              <p>Die Sicherheit Ihres Discord-Kontos und Servers liegt ausschließlich in Ihrer Verantwortung. Dies beinhaltet:</p>
              <ul className="mt-6 space-y-3">
                <li className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-primary font-black">01</span>
                  <span>Korrekte Konfiguration der Bot-Berechtigungen auf Ihrem Server.</span>
                </li>
                <li className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-primary font-black">02</span>
                  <span>Schutz Ihres Discord-Accounts vor unbefugtem Zugriff.</span>
                </li>
                <li className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-primary font-black">03</span>
                  <span>Verantwortung für alle Aktionen, die durch falsch konfigurierte Moderations-Tools entstehen.</span>
                </li>
              </ul>
            </Section>

            <Section id="acceptable-use" title="5. Zulässige Nutzung">
              <p>ManagerX darf nicht für folgende Zwecke verwendet werden:</p>
              <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {[
                  "Illegale Aktivitäten",
                  "Belästigung von Nutzern",
                  "Verschicken von Spam",
                  "Umgehung von Sicherheitsfunktionen",
                  "DDoS-Angriffe",
                  "Verbreitung von Malware",
                  "Automatisierte API-Abfragen",
                  "Reverse Engineering"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#111318] border border-white/5">
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="community" title="6. Community-Richtlinien">
              <p>Wir unterstützen eine sichere Umgebung für alle. Als Anbieter behalten wir uns das Recht vor, Server von unseren Diensten auszuschließen, die gegen Community-Standards verstoßen.</p>
              <div className="mt-6 grid gap-4">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all">
                  <h5 className="text-white font-bold mb-2">Hassrede & Gewalt</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">Server, die Hassrede, Gewaltverherrlichung oder illegale Inhalte fördern, werden ohne Vorwarnung gesperrt.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all">
                  <h5 className="text-white font-bold mb-2">Discord ToS</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">Alle Nutzer müssen zudem die offiziellen Nutzungsbedingungen von Discord einhalten.</p>
                </div>
              </div>
            </Section>

            <Section id="content-ip" title="7. Geistiges Eigentum">
              <p>Die Markenrechte an ManagerX, die Logos, das Design und die Web-UI liegen bei ManagerX Development Network.</p>
              <p className="mt-4">Der Quellcode des Bots ist unter der <span className="text-white font-bold uppercase tracking-widest text-xs">GNU GPL v3.0</span> lizenziert.</p>
            </Section>

            <Section id="third-party" title="8. Drittanbieter-Dienste">
              <p>Unser Dienst integriert oder interagiert mit Drittanbietern wie der Discord API. Wir sind nicht verantwortlich für die Leistung oder Verfügbarkeit dieser externen Dienste.</p>
            </Section>

            <Section id="termination" title="9. Suspendierung">
              <p>Wir behalten uns das Recht vor, den Zugriff auf ManagerX für bestimmte Nutzer, IDs oder ganze Server permanent zu beenden, wenn gegen diese Bedingungen verstoßen wird.</p>
            </Section>

            <Section id="disclaimers" title="10. Haftungsausschluss">
              <h4 className="text-white font-black text-2xl uppercase italic mb-6">Wird "WIE BESEHEN" bereitgestellt.</h4>
              <p>Wir übernehmen keine Garantie für die ständige Verfügbarkeit (Uptime), die absolute Richtigkeit von Statistiken oder die vollständige Fehlerfreiheit des Codes.</p>
            </Section>

            <Section id="liability" title="11. Haftungsbeschränkung">
              <p>Soweit gesetzlich zulässig, haftet ManagerX Development oder dessen Entwickler nicht für indirekte Schäden, Datenverluste oder Server-Konflikte, die durch die Nutzung des Bots entstehen.</p>
            </Section>

            <Section id="indemnity" title="12. Freistellung">
              <p>Sie erklären sich damit einverstanden, ManagerX Development von allen Forderungen freizustellen, die sich aus Ihrer Nutzung des Dienstes oder Ihrer Verletzung dieser Bedingungen ergeben.</p>
            </Section>

            <Section id="changes" title="13. Änderungen">
              <p>Wesentliche Änderungen werden auf unserem Support-Server oder dieser Website mit einer angemessenen Vorlaufzeit angekündigt.</p>
            </Section>

            <Section id="contact" title="14. Kontakt">
              <p>Bei rechtlichen Anfragen erreichen Sie uns unter:</p>
              <div className="mt-8 p-10 rounded-[2.5rem] bg-[#111318] border border-primary/20 text-center">
                <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
                <a href="mailto:legal@managerx-bot.de" className="text-2xl font-black text-white hover:text-primary transition-colors underline decoration-primary/30">
                  legal@managerx-bot.de
                </a>
                <p className="mt-4 text-slate-500 font-bold tracking-widest uppercase text-[10px]">ManagerX Legal Department</p>
              </div>
            </Section>

            <Section id="law" title="15. Anwendbares Recht">
              <p>Diese Bedingungen unterliegen dem Recht der <strong>Bundesrepublik Deutschland</strong>.</p>
            </Section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
});

export default Nutzungsbedingungen;