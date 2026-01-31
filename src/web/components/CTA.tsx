import { memo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const stats = [
  { label: "Aktive Server", value: "10+" },
  { label: "Befehle ausgeführt", value: "1000+" },
  { label: "Zufriedene User", value: "300+" },
];

export const CTA = memo(function CTA() {
  return (
    <section id="support" className="py-32 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/10 to-accent/5" />
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-primary/20 blur-[150px] rounded-full opacity-40" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent/20 blur-[150px] rounded-full opacity-40" />

      <div className="container relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative glass rounded-[3rem] p-12 md:p-28 text-center max-w-6xl mx-auto border border-white/10 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-primary to-transparent" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6, ease: "easeInOut" }}
            className="inline-flex items-center gap-3 glass rounded-full px-8 py-4 mb-12 border border-primary/30 shadow-xl shadow-primary/10"
          >
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            <span className="text-sm text-foreground/90 font-black uppercase tracking-[0.2em]">100% Kostenlos & Open Source</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.7, ease: "easeInOut" }}
            className="text-6xl md:text-8xl font-black mb-10 tracking-tighter leading-none"
          >
            <span className="text-foreground">Bereit für das </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary font-black drop-shadow-glow">nächste Level</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-3xl text-muted-foreground/80 mb-16 max-w-4xl mx-auto leading-relaxed font-semibold tracking-tight"
          >
            Füge ManagerX jetzt zu deinem Server hinzu und erlebe die moderne Discord Server-Verwaltung mit über 90 innovativen Befehlen.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-8 justify-center mb-20"
          >
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
              <a
                href="https://discord.com/oauth2/authorize?client_id=1368201272624287754&permissions=1669118160151&integration_type=0&scope=bot"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-4 px-12 py-6 rounded-[2rem] bg-gradient-to-r from-primary to-accent text-white font-black text-xl hover:shadow-[0_20px_50px_rgba(255,0,0,0.5)] transition-all uppercase tracking-widest"
              >
                <span>Bot einladen</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
              </a>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
              <a
                href="https://discord.gg/oppro"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-12 py-6 rounded-[2rem] glass hover:bg-white/10 border border-white/10 font-black text-xl transition-all shadow-xl uppercase tracking-widest"
              >
                Support Server
              </a>
            </motion.div>
          </motion.div>

          {/* Bottom Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-20 pt-16 border-t border-white/5"
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="text-center group"
              >
                <div className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-3 group-hover:scale-110 transition-transform duration-500">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-black uppercase tracking-[0.3em]">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
});
