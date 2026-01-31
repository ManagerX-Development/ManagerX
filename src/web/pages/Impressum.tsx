import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, User, ShieldCheck } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { motion } from "framer-motion";

export const Impressum = memo(function Impressum() {
  return (
    <div
      className="min-h-screen bg-background flex flex-col"
    >
      <Navbar />

      <main className="flex-grow container relative z-10 px-4 pt-32 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-12 group text-sm font-black uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Zurück zur Zentrale
            </Link>
          </motion.div>

          <header className="mb-16">
            <div className="flex items-center gap-6 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/10">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground uppercase italic leading-none">
                  Impres<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">sum</span>
                </h1>
                <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest mt-2 opacity-50">
                  Angaben gemäß § 5 TMG
                </p>
              </div>
            </div>
          </header>

          <div className="grid gap-6">
            {/* Kontakt Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-3xl p-8 border border-white/5 space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Verantwortlich</h2>
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground tracking-tight">Lenny Steiger</p>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">Gründer & Projektleiter</p>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-3xl p-8 border border-white/5 space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Anschrift</h2>
                </div>
                <div className="space-y-1 text-foreground font-bold tracking-tight">
                  <p>Eulauer Str. 24</p>
                  <p>04523 Pegau</p>
                  <p className="text-muted-foreground font-medium text-sm">Deutschland</p>
                </div>
              </motion.section>
            </div>

            {/* Kontakt Details */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-3xl p-8 border border-white/5"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Kommunikation</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">E-Mail Adresse</p>
                  <a href="mailto:contact@oppro-network.de" className="text-lg font-black text-foreground hover:text-primary transition-all underline decoration-primary/30 underline-offset-4">
                    contact@oppro-network.de
                  </a>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Support & Legal</p>
                  <a href="mailto:legal@oppro-network.de" className="text-lg font-black text-foreground hover:text-primary transition-all underline decoration-primary/30 underline-offset-4">
                    legal@oppro-network.de
                  </a>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Umsatzsteuer-Identifikationsnummer</p>
                  <p className="text-sm text-foreground font-medium">Gemäß §19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung)</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Inhaltlich Verantwortlicher</p>
                  <p className="text-sm text-foreground font-medium">Lenny Steiger (Anschrift wie oben)</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Direkte Kommunikation via Discord Support-Server bevorzugt.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Aufsichtsbehörde & Berufsbezeichnung */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass rounded-3xl p-8 border border-white/5"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Rechtliche Angaben</h2>
              </div>
              <div className="space-y-6 text-sm">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Projektart</p>
                  <p className="text-foreground font-medium">Privates Open-Source-Projekt (nicht-kommerziell)</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Registrierung</p>
                  <p className="text-foreground font-medium">Keine gewerbliche Anmeldung erforderlich (privates Projekt)</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Haftungsausschluss</p>
                  <p className="text-muted-foreground leading-relaxed">Dieses Projekt wird als kostenloser Service ohne Gewinnabsicht betrieben. Es besteht kein Anspruch auf Verfügbarkeit oder Support.</p>
                </div>
              </div>
            </motion.section>

            {/* Rechtliche Hinweise */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-3xl p-8 md:p-12 border border-white/5 space-y-10"
            >
              <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
                <div>
                  <h3 className="text-lg font-black text-foreground mb-3 flex items-center gap-3">
                    <span className="text-primary/40 font-mono text-sm">01</span>
                    Haftung für Inhalte
                  </h3>
                  <p>Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.</p>
                </div>

                <div>
                  <h3 className="text-lg font-black text-foreground mb-3 flex items-center gap-3">
                    <span className="text-primary/40 font-mono text-sm">02</span>
                    Haftung für Links
                  </h3>
                  <p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.</p>
                </div>

                <div>
                  <h3 className="text-lg font-black text-foreground mb-3 flex items-center gap-3">
                    <span className="text-primary/40 font-mono text-sm">03</span>
                    Urheberrecht
                  </h3>
                  <p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Der Source-Code ist unter der <Link to="/legal/license" className="text-primary hover:underline">GPL-3.0 Lizenz</Link> frei verfügbar.</p>
                </div>

                <div>
                  <h3 className="text-lg font-black text-foreground mb-3 flex items-center gap-3">
                    <span className="text-primary/40 font-mono text-sm">04</span>
                    Hosting
                  </h3>
                  <p>Diese Website wird als statische Seite auf <strong>GitHub Pages</strong> (GitHub Inc., 88 Colin P. Kelly Jr St, San Francisco, CA 94107, USA) bereitgestellt. Die Datenschutzerklärung von GitHub finden Sie <a href="https://docs.github.com/en/github/site-policy/github-privacy-statement" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">hier</a>.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                  <Link to="/legal/privacy" className="group flex flex-col gap-2 p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/[0.05] hover:border-primary/20 transition-all">
                    <span className="text-xs font-black uppercase tracking-widest text-primary">Datenschutz</span>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground">Informationen zur DSGVO</span>
                  </Link>
                  <Link to="/legal/terms" className="group flex flex-col gap-2 p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/[0.05] hover:border-primary/20 transition-all">
                    <span className="text-xs font-black uppercase tracking-widest text-primary">Bedingungen</span>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground">Nutzungsrichtlinien für Bot & Web</span>
                  </Link>
                </div>
              </div>
            </motion.section>

            {/* Streitbeilegung */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="p-8 glass-strong rounded-3xl border border-primary/20 bg-primary/[0.02]"
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-4">Streitbeilegung</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="ml-2 text-foreground font-black hover:text-primary underline decoration-primary/30">https://ec.europa.eu/consumers/odr/</a>
              </p>
              <p className="mt-4 text-[10px] text-muted-foreground/50 uppercase font-bold">Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
            </motion.section>
          </div>

          <p className="mt-12 text-center text-[10px] text-muted-foreground/30 uppercase tracking-[0.2em] font-black">
            Stand: 29. Januar 2026 • © ManagerX Development
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
});

export default Impressum;