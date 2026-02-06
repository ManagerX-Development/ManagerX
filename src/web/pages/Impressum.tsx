import { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ShieldCheck, User, MapPin, Mail,
  Info, Scale, ExternalLink, Globe, ChevronRight, Gavel
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { motion } from "framer-motion";

const SECTIONS = [
  { id: "verantwortlich", title: "Verantwortlich", icon: User },
  { id: "anschrift", title: "Anschrift", icon: MapPin },
  { id: "kontakt", title: "Kontakt", icon: Mail },
  { id: "rechtliches", title: "Rechtliche Angaben", icon: Gavel },
  { id: "haftung-inhalte", title: "Haftung für Inhalte", icon: Info },
  { id: "haftung-links", title: "Haftung für Links", icon: ExternalLink },
  { id: "urheberrecht", title: "Urheberrecht", icon: Scale },
  { id: "hosting", title: "Hosting", icon: Globe },
  { id: "streitbeilegung", title: "Streitbeilegung", icon: ShieldCheck },
];

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-32 group">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      <h2 className="text-2xl font-black text-white uppercase italic tracking-tight group-hover:text-primary transition-colors">
        {title}
      </h2>
    </div>
    <div className="text-lg leading-relaxed text-slate-400 font-medium whitespace-pre-wrap">
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
                      <motion.div layoutId="active-indicator-imprint" className="ml-auto">
                        <ChevronRight className="w-3 h-3" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8 rounded-[2rem] bg-primary/[0.02] border border-primary/20">
              <ShieldCheck className="w-8 h-8 text-primary mb-4" />
              <h4 className="text-white font-bold mb-2">Gesetzlich Sicher</h4>
              <p className="text-xs text-slate-500 leading-relaxed">ManagerX erfüllt alle Anforderungen gemäß § 5 DDG.</p>
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
              <Info className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">Legal Disclosure</span>
            </motion.div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.9] mb-6">
              Impres<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">sum</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium max-w-2xl leading-relaxed">
              Angaben gemäß § 5 DDG. ManagerX ist ein privates Open-Source-Projekt von OPPRO.NET.
            </p>
          </header>

          <article className="space-y-24">
            <Section id="verantwortlich" title="Verantwortlich">
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5">
                <p className="text-2xl font-black text-white tracking-tight uppercase italic underline decoration-primary/30">Lenny Steiger</p>
                <p className="text-sm text-slate-500 mt-2 font-bold uppercase tracking-widest">Gründer & Projektleiter</p>
              </div>
            </Section>

            <Section id="anschrift" title="Anschrift">
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 space-y-2 font-bold text-white">
                <p>Eulauer Str. 24</p>
                <p>04523 Pegau</p>
                <p className="text-slate-500 font-medium">Deutschland</p>
              </div>
            </Section>

            <Section id="kontakt" title="Kontakt">
              <div className="grid gap-6">
                <div className="p-8 rounded-3xl bg-[#111318] border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">E-Mail</p>
                  <a href="mailto:contact@oppro-network.de" className="text-xl font-black text-white hover:text-primary transition-all underline decoration-primary/30 underline-offset-4">
                    contact@oppro-network.de
                  </a>
                </div>
                <div className="p-8 rounded-3xl bg-[#111318] border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Legal Support</p>
                  <a href="mailto:legal@oppro-network.de" className="text-xl font-black text-white hover:text-primary transition-all underline decoration-primary/30 underline-offset-4">
                    legal@oppro-network.de
                  </a>
                </div>
              </div>
            </Section>

            <Section id="rechtliches" title="Rechtliche Angaben">
              <div className="space-y-6 text-base">
                <p>Gemäß §19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).</p>
                <p>Projektart: Privates Open-Source-Projekt (nicht-kommerziell).</p>
              </div>
            </Section>

            <Section id="haftung-inhalte" title="Haftung für Inhalte">
              <p>Als Diensteanbieter sind wir gemäß § 7 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.</p>
            </Section>

            <Section id="haftung-links" title="Haftung für Links">
              <p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.</p>
            </Section>

            <Section id="urheberrecht" title="Urheberrecht">
              <p>Die durch die Seitenbetreiber erstellten Inhalte unterliegen dem deutschen Urheberrecht. Der Source-Code ist unter der GPL-3.0 Lizenz frei auf GitHub verfügbar.</p>
            </Section>

            <Section id="hosting" title="Hosting">
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5">
                <p>Bereitgestellt via GitHub Pages:</p>
                <p className="mt-2 text-sm text-slate-500 italic">GitHub Inc., 88 Colin P. Kelly Jr St, San Francisco, CA 94107, USA.</p>
              </div>
            </Section>

            <Section id="streitbeilegung" title="Streitbeilegung">
              <p className="text-sm">Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://ec.europa.eu/consumers/odr/</a></p>
              <p className="mt-4 text-[10px] text-slate-500 uppercase font-bold">Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren teilzunehmen.</p>
            </Section>

            {/* Final Contact UI */}
            <div className="p-12 rounded-[3rem] glass-strong border border-primary/20 text-center relative overflow-hidden group">
              <div className="relative z-10">
                <Mail className="w-16 h-16 text-primary mx-auto mb-6" />
                <h4 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Support</h4>
                <a href="mailto:contact@oppro-network.de" className="text-2xl text-slate-400 hover:text-white transition-colors underline underline-offset-8 decoration-primary/40">
                  contact@oppro-network.de
                </a>
                <p className="mt-12 text-[10px] uppercase font-black tracking-[0.5em] text-slate-600">Stand: Februar 2026 • © ManagerX Development</p>
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