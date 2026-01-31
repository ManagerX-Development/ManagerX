import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Mail, Lock, Database, Server, CheckCircle, Github, User, Activity, FileText } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { motion } from "framer-motion";

export const Datenschutz = memo(function Datenschutz() {
  const sections = [
    {
      title: "1. Verantwortliche Stelle",
      icon: User,
      content: (
        <div className="space-y-4">
          <p className="font-extrabold text-white text-xl tracking-tight">OPPRO.NET Network</p>
          <div className="space-y-1 text-sm text-muted-foreground font-medium">
            <p className="text-foreground">Lenny Steiger</p>
            <p>Eulauer Str. 24</p>
            <p>04523 Pegau, Deutschland</p>
            <p className="mt-4">
              E-Mail:{" "}
              <a href="mailto:contact@oppro-network.de" className="text-primary hover:underline font-black">
                contact@oppro-network.de
              </a>
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "2. Datenschutzbeauftragter",
      icon: Shield,
      content: (
        <div className="space-y-2 text-sm">
          <p>Bei Datenschutzfragen können Sie sich an:</p>
          <p className="font-bold text-foreground">
            E-Mail:{" "}
            <a href="mailto:legal@oppro-network.de" className="text-primary hover:underline">
              legal@oppro-network.de
            </a>
          </p>
        </div>
      ),
    },
    {
      title: "3. Erhobene Daten",
      icon: Database,
      content: (
        <div className="space-y-4">
          <p>Bei der Nutzung von ManagerX verarbeiten wir folgende Daten:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <li className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Discord-IDs</li>
            <li className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Username & Avatar</li>
            <li className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Server-Settings</li>
            <li className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Moderationsdaten</li>
            <li className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> XP/Level-Daten</li>
            <li className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Log-Daten (Timestamps)</li>
          </ul>
        </div>
      ),
    },
    {
      title: "4. Zweck der Verarbeitung",
      icon: Activity,
      content: (
        <div className="space-y-3 text-sm leading-relaxed">
          <p>Die Daten werden ausschließlich für folgende Zwecke verarbeitet:</p>
          <ul className="space-y-1 text-muted-foreground ml-2">
            <li>• Bereitstellung und Verwaltung der Bot-Funktionen</li>
            <li>• Nachvollziehbarkeit von Moderationsmaßnahmen (Audit-Trail)</li>
            <li>• Fehlerdiagnose und technische Optimierung</li>
            <li>• Statistiken und Leistungsanalyse</li>
            <li>• Compliance mit Discord-Richtlinien</li>
          </ul>
        </div>
      ),
    },
    {
      title: "5. Rechtsgrundlage",
      icon: FileText,
      content: (
        <div className="space-y-3 text-sm leading-relaxed">
          <p><strong>Art. 6 Abs. 1 lit. f DSGVO:</strong> Berechtigtes Interesse am Bot-Betrieb und Systemsicherheit.</p>
          <p><strong>Art. 6 Abs. 1 lit. b DSGVO:</strong> Erfüllung der Vertragsbestimmungen bei der Nutzung des Bots.</p>
          <p><strong>Art. 6 Abs. 1 lit. c DSGVO:</strong> Einhaltung gesetzlicher Verpflichtungen.</p>
        </div>
      ),
    },
    {
      title: "6. Speicherdauer",
      icon: Activity,
      content: (
        <div className="space-y-3 text-sm leading-relaxed">
          <p><strong>Moderationsdaten:</strong> 2 Jahre ab Eintrag (zur Nachverfolgung).</p>
          <p><strong>Server-Konfigurationen:</strong> Solange der Bot aktiv ist.</p>
          <p><strong>XP/Level-Daten:</strong> Bis zur Löschung durch Admin oder Bot-Entfernung.</p>
          <p><strong>Log-Daten:</strong> Maximal 90 Tage für technische Fehlerdiagnose.</p>
        </div>
      ),
    },
    {
      title: "7. Hosting & Standort",
      icon: Server,
      content: (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 shadow-xl shadow-primary/5">
            <div className="flex items-center gap-3 mb-3">
              <Server className="w-5 h-5 text-primary" />
              <span className="font-black text-white uppercase tracking-widest text-xs">Bot-Infrastruktur</span>
            </div>
            <p className="text-sm font-bold text-foreground">DeinServerHost (DSH)</p>
            <p className="text-xs text-muted-foreground mt-1">Standort: Frankfurt am Main, Deutschland (EU)</p>
          </div>
          <p className="text-xs italic text-muted-foreground">Dies stellt sicher, dass Nutzerdaten des Bots die EU nicht verlassen.</p>
        </div>
      ),
    },
    {
      title: "8. Datensicherheit",
      icon: Lock,
      content: (
        <div className="space-y-3 text-sm leading-relaxed">
          <ul className="space-y-1">
            <li>• SQLite-Datenbanken mit Zugriffskontrolle</li>
            <li>• Verschlüsselte Verbindungen (Discord API über HTTPS)</li>
            <li>• Regelmäßige Backups</li>
            <li>• Begrenzte Zugriffe (nur authorisierte Administratoren)</li>
          </ul>
        </div>
      ),
    },
    {
      title: "9. Ihre Rechte",
      icon: User,
      content: (
        <div className="space-y-4 text-sm leading-relaxed">
          <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung (Vergessenwerden), Datenportabilität und Widerspruch gemäß Art. 15-22 DSGVO.</p>
          <p className="font-bold text-white underline decoration-primary underline-offset-4">Anfragen an: legal@oppro-network.de</p>
        </div>
      ),
    },
    {
      title: "10. Beschwerderecht",
      icon: Shield,
      content: (
        <p className="text-sm">Sie haben das Recht, bei einer Datenschutzbehörde (Landesdatenschutzbehörde Ihres Bundeslandes) Beschwerde einzureichen.</p>
      ),
    },
    {
      title: "11. Automatisierte Entscheidungen",
      icon: Activity,
      content: (
        <p className="text-sm">ManagerX trifft keine vollautomatisierten Entscheidungen, die erhebliche rechtliche Auswirkungen haben.</p>
      ),
    },
    {
      title: "12. Cookies & Tracking",
      icon: Lock,
      content: (
        <p className="text-sm">Die Website nutzt keine Cookies oder Tracking-Technologien. Es werden nur technisch notwendige Session-Daten im Browser gespeichert.</p>
      ),
    },
    {
      title: "13. Web-Hosting (GitHub Pages)",
      icon: Github,
      content: (
        <div className="space-y-2 text-sm leading-relaxed">
          <p><strong>Anbieter:</strong> GitHub Inc., USA</p>
          <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO</p>
          <p>IP-Adressen werden zur Abwehr von Angriffen kurzzeitig protokolliert (Standardvertragsklauseln).</p>
        </div>
      ),
    },
    {
      title: "14. Änderungen",
      icon: FileText,
      content: (
        <p className="text-sm text-muted-foreground italic">Änderungen dieser Erklärung werden auf dieser Seite veröffentlicht. Fortgesetzte Nutzung bedeutet Zustimmung.</p>
      ),
    },
    {
      title: "15. Kontakt",
      icon: Mail,
      content: (
        <div className="space-y-2 text-sm">
          <p>E-Mail: <a href="mailto:legal@oppro-network.de" className="text-primary hover:underline font-bold">legal@oppro-network.de</a></p>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-4">Letzte Aktualisierung: Januar 2026</p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow container relative z-10 px-4 pt-32 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-12 group text-sm font-black uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Zurück zur Zentrale
            </Link>
          </motion.div>

          <header className="mb-16">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/10">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground uppercase italic leading-none mb-2">
                  Daten<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">schutz</span>
                </h1>
                <div className="flex gap-4 opacity-40">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">DSGVO Standard</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">•</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Frankfurt Hosted</span>
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-6">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04, duration: 0.35 }}
                className="group glass rounded-[2.5rem] p-8 md:p-10 border border-white/5 hover:border-primary/20 transition-all duration-500 hover:bg-card/90"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:scale-110 transition-transform">
                    <section.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white group-hover:text-primary transition-colors uppercase italic">
                    {section.title}
                  </h2>
                </div>
                <div className="text-muted-foreground leading-relaxed">
                  {section.content}
                </div>
              </motion.div>
            ))}

            {/* Kontakt Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="mt-12 p-10 glass-strong rounded-[2.5rem] border border-primary/20 bg-primary/[0.02] flex flex-col items-center text-center gap-6"
            >
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/20">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-3xl text-white tracking-tighter uppercase italic">Privacy Support</h3>
                <p className="text-muted-foreground max-w-md mx-auto font-medium text-sm">
                  Fragen zur Auskunft oder Löschung Ihrer Daten? Unser Legal-Team steht Ihnen direkt zur Verfügung.
                </p>
              </div>
              <a
                href="mailto:legal@oppro-network.de?subject=DSGVO-Anfrage"
                className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-primary to-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-[0_15px_40px_rgba(255,0,0,0.5)] transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Mail className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Anfrage senden</span>
              </a>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-2">
                Aktueller Stand: Januar 2026 • © ManagerX
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
});

export default Datenschutz;