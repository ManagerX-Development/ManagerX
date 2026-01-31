import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Mail, Github, Shield, CheckCircle, Zap, AlertTriangle, Scale, Lock, RefreshCw, HelpCircle, Code2, LogOut, Database } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { motion } from "framer-motion";

export const Nutzungsbedingungen = memo(function Nutzungsbedingungen() {
  const legalSections = [
    {
      title: "1. Geltungsbereich",
      icon: Scale,
      content: "Diese Nutzungsbedingungen regeln die Verwendung des Discord-Bots ManagerX sowie dieser Website. Mit der Nutzung des Bots, der Website oder des Quellcodes erklärst du dich mit diesen Bedingungen einverstanden.",
    },
    {
      title: "2. Lizenz & Open Source",
      icon: Code2,
      content: (
        <div className="space-y-4">
          <p>ManagerX wird unter der <span className="text-primary font-black uppercase tracking-widest text-xs">GNU GPL v3.0</span> lizenziert.</p>
          <ul className="grid grid-cols-1 gap-2 text-sm text-muted-foreground font-medium">
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Quellcode darf frei eingesehen, modifiziert und verbreitet werden.</li>
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Modifikationen müssen ebenfalls unter GPL-3.0 lizenziert werden.</li>
            <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Kommerzielles Hosting ist gestattet, Quellcode muss verfügbar sein.</li>
          </ul>
        </div>
      ),
    },
    {
      title: "3. Bot-Nutzung",
      icon: Zap,
      content: (
        <div className="space-y-3 text-sm leading-relaxed">
          <p>ManagerX darf auf Discord-Servern genutzt werden, sofern:</p>
          <ul className="space-y-1 ml-4">
            <li>• Sie Admin-Rechte auf dem Server haben</li>
            <li>• Die Nutzung den Discord Terms of Service entspricht</li>
            <li>• Sie keine illegalen oder schädlichen Aktivitäten durchführen</li>
          </ul>
        </div>
      ),
    },
    {
      title: "4. Verbotene Nutzung",
      icon: AlertTriangle,
      content: (
        <div className="space-y-3 text-sm leading-relaxed">
          <p>Folgende Aktivitäten sind streng untersagt:</p>
          <ul className="space-y-1 ml-4 text-primary">
            <li>• Reverse Engineering zu böswilligen Zwecken</li>
            <li>• DDoS-Attacken oder Sicherheitsverstöße</li>
            <li>• Automatisierte Spam-Kampagnen</li>
            <li>• Verbreitung von Malware oder Exploits</li>
          </ul>
          <p className="mt-4 font-black uppercase tracking-tighter text-xs">Konsequenz: Sofortiger Ausschluss und Meldung an Behörden.</p>
        </div>
      ),
    },
    {
      title: "5. Haftungsausschluss",
      icon: Shield,
      content: (
        <div className="space-y-4 text-sm leading-relaxed">
          <p>OPPRO.NET Network übernimmt <strong>keine Haftung</strong> für:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 font-bold text-foreground">
            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-primary" /> Datenverluste</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-primary" /> Ausfallzeiten</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-primary" /> Indirekte Schäden</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-primary" /> User-Fehler</li>
          </ul>
          <p className="italic text-muted-foreground mt-4">Der Bot wird "AS IS" bereitgestellt.</p>
        </div>
      ),
    },
    {
      title: "6. Funktionalität",
      icon: RefreshCw,
      content: (
        <div className="space-y-3 text-sm leading-relaxed">
          <p>Wir behalten uns das Recht vor, Funktionen jederzeit zu aktualisieren, zu optimieren oder zu entfernen, um die Stabilität des Netzwerks zu gewährleisten.</p>
        </div>
      ),
    },
    {
      title: "7. Datenschutz",
      icon: Lock,
      content: (
        <p className="text-sm">Siehe unsere <Link to="/legal/privacy" className="text-primary hover:underline font-bold">Datenschutzerklärung</Link> für Details über erhobene Daten und Ihre Rechte nach DSGVO.</p>
      ),
    },
    {
      title: "8. Geistiges Eigentum",
      icon: FileText,
      content: (
        <p className="text-sm">ManagerX (Logos, Design, UI) sind Eigentum von OPPRO.NET. Der Quellcode ist unter GPL-3.0 frei verwendbar.</p>
      ),
    },
    {
      title: "9. Community & Support",
      icon: HelpCircle,
      content: (
        <div className="space-y-2 text-sm leading-relaxed">
          <p>Support erfolgt gemeinschaftlich über GitHub Issues oder E-Mail. Ein Anspruch auf sofortigen Support besteht nicht.</p>
        </div>
      ),
    },
    {
      title: "10. Beendigung",
      icon: LogOut,
      content: (
        <p className="text-sm">Wir können Ihren Zugriff beenden, wenn Sie gegen diese Bedingungen verstoßen oder unsere Ressourcen missbrauchen.</p>
      ),
    },
    {
      title: "11. Abhängigkeiten",
      icon: Database,
      content: (
        <p className="text-sm">ManagerX nutzt externe Libraries (discord.py, FastAPI, SQLite). Siehe <code className="bg-white/5 px-2 py-0.5 rounded">requirements.txt</code> für vollständige Details.</p>
      ),
    },
    {
      title: "12. Änderungen",
      icon: RefreshCw,
      content: (
        <p className="text-sm">Diese Bedingungen können jederzeit geändert werden. Bedeutende Änderungen werden 30 Tage im Voraus angekündigt.</p>
      ),
    },
    {
      title: "13. Geltendes Recht",
      icon: Scale,
      content: (
        <p className="text-sm">Diese Bedingungen unterliegen <strong>deutschem Recht</strong>. Gerichtsstand ist Deutschland.</p>
      ),
    },
    {
      title: "14. Kontakt",
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
          {/* Back Button */}
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
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground uppercase italic leading-none mb-2">
                  Nutzer<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">regeln</span>
                </h1>
                <div className="flex gap-4 opacity-40">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Version 2.0.0</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">•</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">GPL-3.0</span>
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-6">
            {legalSections.map((section, index) => (
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
                    {section.icon && <section.icon className="w-6 h-6 text-primary" />}
                    {!section.icon && <span className="text-primary font-black font-mono text-xl italic">0{index + 1}</span>}
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

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="mt-12 p-10 glass-strong rounded-[2.5rem] border border-primary/20 bg-primary/[0.02] flex flex-col md:flex-row items-center justify-between gap-8"
            >
              <div className="text-center md:text-left space-y-2">
                <h3 className="font-black text-3xl text-white tracking-tighter uppercase italic">Noch Fragen?</h3>
                <p className="text-muted-foreground font-medium text-sm">
                  Bei Unklarheiten kontaktiere bitte unser Support-Team oder das Development.
                </p>
              </div>
              <div className="flex gap-4">
                <a
                  href="mailto:support@oppro-network.de"
                  className="p-5 rounded-2xl glass-strong border border-white/10 hover:text-primary transition-all hover:scale-110"
                  title="E-Mail Kontakt"
                >
                  <Mail className="w-6 h-6" />
                </a>
                <a
                  href="https://github.com/ManagerX-Development"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-2xl glass-strong border border-white/10 hover:text-primary transition-all hover:scale-110"
                  title="Source Code"
                >
                  <Github className="w-6 h-6" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
});

export default Nutzungsbedingungen;