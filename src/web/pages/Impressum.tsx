import { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, User, MapPin, Mail,
  Info, Scale, ExternalLink, Globe, ChevronRight, Gavel,
  AlertTriangle, FileText, Clock
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { SEO } from "../components/layout/SEO";
import { motion } from "framer-motion";
import { LEGAL_CONFIG } from "../lib/legal";

const SECTIONS = [
  { id: "verantwortlich", title: "Verantwortlich", icon: User },
  { id: "anschrift", title: "Anschrift", icon: MapPin },
  { id: "kontakt", title: "Kontakt", icon: Mail },
  { id: "rechtliches", title: "Projektart", icon: FileText },
  { id: "haftung-inhalte", title: "Haftung für Inhalte", icon: Info },
  { id: "haftung-links", title: "Haftung für Links", icon: ExternalLink },
  { id: "urheberrecht", title: "Urheberrecht", icon: Scale },
  { id: "hosting", title: "Hosting", icon: Globe },
  { id: "streitbeilegung", title: "Streitbeilegung", icon: Gavel },
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
    <div className="text-lg leading-relaxed text-slate-400 font-medium">
      {children}
    </div>
  </section>
);

export const Impressum = memo(function Impressum() {
  const [activeSection, setActiveSection] = useState("verantwortlich");

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
      <SEO
        title="Impressum – ManagerX"
        description="Gesetzliche Pflichtangaben gemäß § 5 DDG für ManagerX, ein privates Open-Source-Discord-Bot-Projekt von ManagerX Development."
      />
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
                    {section.title}
                    {activeSection === section.id && (
                      <motion.div layoutId="active-indicator-imprint" className="ml-auto">
                        <ChevronRight className="w-3 h-3" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Legal Badge */}
            <div className="p-6 rounded-[2rem] bg-primary/[0.03] border border-primary/20 space-y-3">
              <ShieldCheck className="w-7 h-7 text-primary" />
              <h4 className="text-white font-bold text-sm">Gesetzlich sicher</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Angaben gemäß § 5 DDG. Privates Open-Source-Projekt – nicht gewerblich.</p>
              <div className="flex items-center gap-2 pt-1">
                <Clock className="w-3 h-3 text-slate-600" />
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-600">Stand: {LEGAL_CONFIG.lastUpdate}</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-2">Weitere Dokumente</p>
              <Link to="/legal/privacy" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-sm font-semibold text-slate-400 hover:text-white">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                Datenschutzerklärung
              </Link>
              <Link to="/legal/terms" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-sm font-semibold text-slate-400 hover:text-white">
                <FileText className="w-4 h-4 text-slate-500" />
                Nutzungsbedingungen
              </Link>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-grow max-w-3xl">
          <header className="mb-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 text-primary mb-6">
              <Info className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">Legal Disclosure · § 5 DDG</span>
            </motion.div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.9] mb-6">
              Impres<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">sum</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium max-w-2xl leading-relaxed">
              Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz). ManagerX ist ein privates,
              nicht-kommerzielles Open-Source-Projekt.
            </p>

            {/* Legal notice banner */}
            <div className="mt-8 flex items-start gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-400 mb-1">Hinweis zur Impressumspflicht</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Dieses Impressum gilt für alle unter der Domain <span className="font-bold text-white">managerx-bot.de</span> betriebenen Dienste sowie den Discord-Bot ManagerX. Die Angaben werden gemäß § 5 DDG zur Verfügung gestellt.
                </p>
              </div>
            </div>
          </header>

          <article className="space-y-20">

            <Section id="verantwortlich" title="Verantwortlich" icon={User}>
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 hover:border-primary/20 transition-colors">
                <p className="text-2xl font-black text-white tracking-tight uppercase italic">{LEGAL_CONFIG.owner.name}</p>
                <p className="text-sm text-slate-500 mt-2 font-bold uppercase tracking-widest">{LEGAL_CONFIG.owner.role}</p>
                <p className="text-sm text-slate-500 mt-1">ManagerX Development Network</p>
              </div>
            </Section>

            <Section id="anschrift" title="Anschrift" icon={MapPin}>
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 hover:border-primary/20 transition-colors space-y-1 font-bold text-white">
                <p>{LEGAL_CONFIG.owner.name}</p>
                <p>{LEGAL_CONFIG.owner.address.street}</p>
                <p>{LEGAL_CONFIG.owner.address.city}</p>
                <p className="text-slate-500 font-medium">{LEGAL_CONFIG.owner.address.country}</p>
              </div>
            </Section>

            <Section id="kontakt" title="Kontakt" icon={Mail}>
              <div className="grid gap-4">
                <div className="p-6 rounded-3xl bg-[#111318] border border-white/5 hover:border-primary/20 transition-colors">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Allgemeiner Kontakt</p>
                  <a href={`mailto:${LEGAL_CONFIG.contact.email}`} className="text-lg font-black text-white hover:text-primary transition-all">
                    {LEGAL_CONFIG.contact.email}
                  </a>
                </div>
                <div className="p-6 rounded-3xl bg-[#111318] border border-white/5 hover:border-primary/20 transition-colors">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Rechtliche Anfragen</p>
                  <a href={`mailto:${LEGAL_CONFIG.contact.legalEmail}`} className="text-lg font-black text-white hover:text-primary transition-all">
                    {LEGAL_CONFIG.contact.legalEmail}
                  </a>
                  <p className="text-xs text-slate-600 mt-2 italic">Für DSGVO-Anfragen, Löschanträge und rechtliche Belange.</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                <strong className="text-slate-300">Hinweis:</strong> Für eine schnelle Bearbeitung bitten wir darum, Anfragen per E-Mail zu stellen.
                Eine telefonische Erreichbarkeit wird gemäß § 5 DDG für nicht-gewerbliche Projekte nicht vorgeschrieben.
              </p>
            </Section>

            <Section id="rechtliches" title="Projektart & Rechtliche Angaben" icon={FileText}>
              <div className="space-y-4 text-base">
                <div className="p-6 rounded-2xl bg-[#111318] border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Projektart</span>
                    <span className="text-sm font-bold text-white">Privates Open-Source-Projekt</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Kommerziell</span>
                    <span className="text-sm font-bold text-green-400">Nein</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Lizenz</span>
                    <span className="text-sm font-bold text-white">GNU GPL v3.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Umsatzsteuer-ID</span>
                    <span className="text-sm font-medium text-slate-400">Nicht vorhanden (kein Gewerbe)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Handelsregisternummer</span>
                    <span className="text-sm font-medium text-slate-400">Nicht vorhanden (kein Gewerbe)</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 italic">
                  ManagerX wird ohne kommerzielle Absicht betrieben. Es handelt sich um ein privates Gemeinschaftsprojekt.
                  Eine Gewerberegistrierung ist daher nicht erforderlich.
                </p>
              </div>
            </Section>

            <Section id="haftung-inhalte" title="Haftung für Inhalte" icon={Info}>
              <p>
                Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
                Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen
                oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>
              <p className="mt-4">
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
                Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden
                von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
              </p>
            </Section>

            <Section id="haftung-links" title="Haftung für Links" icon={ExternalLink}>
              <p>
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
                Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten
                Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
              </p>
              <p className="mt-4">
                Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft.
                Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche
                Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar.
                Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
              </p>
            </Section>

            <Section id="urheberrecht" title="Urheberrecht" icon={Scale}>
              <p>
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht.
                Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
                bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              </p>
              <p className="mt-4">
                Der Quellcode des ManagerX-Bots ist unter der <strong className="text-white">GNU General Public License v3.0 (GPL-3.0)</strong> lizenziert
                und frei auf GitHub unter <a href="https://github.com/ManagerX-Development/ManagerX" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">ManagerX-Development/ManagerX</a> verfügbar.
                Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet.
                Insbesondere werden Inhalte Dritter als solche gekennzeichnet.
              </p>
            </Section>

            <Section id="hosting" title="Hosting & Datenspeicherung" icon={Globe}>
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 hover:border-primary/20 transition-colors space-y-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <h5 className="font-bold text-white">Server-Infrastruktur</h5>
                </div>
                <p className="text-sm leading-relaxed">{LEGAL_CONFIG.hosting.provider} – {LEGAL_CONFIG.hosting.details}</p>
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Standort</p>
                  <p className="text-sm font-bold text-white">{LEGAL_CONFIG.hosting.location}</p>
                </div>
                <p className="text-xs text-slate-500 italic">
                  Durch den Besuch unserer Website werden automatisch Verbindungsdaten (z.B. IP-Adresse) in Server-Logfiles gespeichert.
                  Diese Daten werden nicht mit anderen Datenquellen zusammengeführt und nach spätestens 90 Tagen gelöscht.
                  Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am sicheren Betrieb).
                </p>
              </div>
            </Section>

            <Section id="streitbeilegung" title="Online-Streitbeilegung & Verbraucherstreitbeilegung" icon={Gavel}>
              <p className="text-sm">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">
                  https://ec.europa.eu/consumers/odr/
                </a>.
              </p>
              <div className="mt-6 p-6 rounded-2xl bg-[#111318] border border-amber-500/20">
                <p className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Hinweis gemäß § 36 VSBG
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer
                  Verbraucherschlichtungsstelle teilzunehmen. Da ManagerX ein nicht-kommerzielles Projekt ist,
                  besteht gemäß § 36 Abs. 1 Nr. 1 VSBG keine Verpflichtung zur Teilnahme.
                </p>
              </div>
            </Section>

            {/* Footer CTA */}
            <div className="p-10 rounded-[3rem] glass-strong border border-primary/20 text-center relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="relative z-10">
                <Mail className="w-12 h-12 text-primary mx-auto mb-5" />
                <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-3">Fragen?</h4>
                <a href={`mailto:${LEGAL_CONFIG.contact.email}`} className="text-xl text-slate-400 hover:text-white transition-colors font-bold">
                  {LEGAL_CONFIG.contact.email}
                </a>
                <p className="mt-8 text-[10px] uppercase font-black tracking-[0.5em] text-slate-600">
                  Stand: {LEGAL_CONFIG.lastUpdate} · © ManagerX Development
                </p>
              </div>
            </div>

          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
});

export default Impressum;
