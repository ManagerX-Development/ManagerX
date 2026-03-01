import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useStats } from "@/hooks/useStats";

export const CTA = memo(function CTA() {
  const { data, isLoading } = useStats();

  const stats = [
    { label: "Aktive Server", value: isLoading ? "..." : `${data.guilds}` },
    { label: "Befehle", value: "90+" },
    { label: "Zufriedene User", value: isLoading ? "..." : `${data.users}` },
  ];

  return (
    <section id="support" className="py-32 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-accent/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-[600px] bg-primary/5 blur-[120px] rounded-full opacity-50" />

      <div className="container mx-auto relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative glass-strong rounded-[3rem] p-12 md:p-24 text-center max-w-6xl mx-auto border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Top Glow Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full glass border border-white/10 mb-10 shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/70">100% Kostenlos & Open Source</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-6xl md:text-8xl font-bold mb-8 tracking-tighter leading-none"
          >
            Bereit für das <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">nächste Level?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl md:text-2xl text-muted-foreground/80 mb-16 max-w-3xl mx-auto font-medium"
          >
            Füge ManagerX jetzt zu deinem Server hinzu und erlebe moderne Server-Verwaltung mit über 90 innovativen Befehlen.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-5 justify-center mb-20"
          >
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              href="https://discord.com/oauth2/authorize?client_id=1368201272624287754&permissions=1669118160151&integration_type=0&scope=bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-4.5 rounded-2xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/20"
            >
              <span>Bot einladen</span>
              <ArrowRight className="w-5 h-5" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              href="https://discord.gg/oppro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-4.5 rounded-2xl glass border border-white/10 font-bold text-lg"
            >
              Support Server
            </motion.a>
          </motion.div>

          {/* Stats Footer Mapping */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 pt-16 border-t border-white/5">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center group">
                <span className="text-4xl md:text-5xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {stat.value}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-50">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
});
