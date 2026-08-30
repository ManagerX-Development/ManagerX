import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Github, Shield, Star } from "lucide-react";
import { useStats } from "@/hooks/useStats";

const FloatingOrb = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    className={className}
    animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
    transition={{ duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

export const CTA = memo(function CTA() {
  const { data, isLoading } = useStats();

  const stats = [
    { label: "Aktive Server", value: isLoading ? "—" : `${data.guilds}`, suffix: "" },
    { label: "Slash Commands", value: "90", suffix: "+" },
    { label: "Zufriedene Nutzer", value: isLoading ? "—" : `${data.users}`, suffix: "" },
  ];

  return (
    <section id="support" className="py-40 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080a0c] via-[#0d0608] to-[#080a0c]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(220,38,38,0.12)_0%,transparent_70%)]" />

      {/* Floating Orbs */}
      <FloatingOrb delay={0} className="absolute top-10 left-[15%] w-64 h-64 rounded-full bg-primary/10 blur-[100px]" />
      <FloatingOrb delay={2} className="absolute bottom-10 right-[15%] w-96 h-96 rounded-full bg-accent/8 blur-[120px]" />
      <FloatingOrb delay={1} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />

      <div className="container mx-auto relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[3.5rem] overflow-hidden border border-white/[0.08] shadow-[0_0_120px_rgba(220,38,38,0.1)] max-w-6xl mx-auto"
        >
          {/* Card background with glass */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-primary/[0.03]" />
          <div className="absolute inset-0 backdrop-blur-sm" />

          {/* Animated top border line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Corner decorations */}
          <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-[1.5rem]" />
          <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-primary/30 rounded-tr-[1.5rem]" />
          <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-primary/20 rounded-bl-[1.5rem]" />
          <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-primary/20 rounded-br-[1.5rem]" />

          <div className="relative z-10 p-12 md:p-24 text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-primary/30 bg-primary/10 mb-14 shadow-[0_0_30px_rgba(220,38,38,0.2)]"
            >
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-[12px] font-black uppercase tracking-[0.3em] text-primary">100% Kostenlos & Open Source</span>
            </motion.div>

            {/* Main headline */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-9xl font-black mb-8 tracking-tighter leading-[0.85] uppercase italic"
            >
              Bereit für das{" "}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient drop-shadow-[0_0_60px_rgba(220,38,38,0.4)]">
                nächste Level?
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-400 mb-16 max-w-3xl mx-auto font-medium leading-relaxed"
            >
              Füge ManagerX jetzt zu deinem Server hinzu und erlebe moderne Server-Verwaltung mit über{" "}
              <span className="text-white font-bold">90 innovativen Befehlen</span>.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-5 justify-center mb-24"
            >
              <motion.a
                whileHover={{ scale: 1.06, y: -4 }}
                whileTap={{ scale: 0.96 }}
                href="https://discord.com/oauth2/authorize?client_id=1542970562588975135&permissions=1669118160151&integration_type=0&scope=bot"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary !px-14 !py-6 !text-xl inline-flex items-center gap-4 group shadow-[0_20px_60px_-10px_rgba(220,38,38,0.5)]"
              >
                <Zap className="w-6 h-6" />
                <span>Bot einladen</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.04, borderColor: "rgba(255,255,255,0.2)" }}
                whileTap={{ scale: 0.97 }}
                href="https://discord.gg/9T28DWup3g"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-12 py-6 rounded-2xl glass-strong border border-white/10 font-bold text-xl text-white shadow-xl transition-all hover:bg-white/[0.08]"
              >
                <Shield className="w-5 h-5 text-primary" />
                Support Server
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                href="https://github.com/ManagerX-Development/ManagerX"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-10 py-6 rounded-2xl glass border border-white/10 font-bold text-xl text-white/60 shadow-xl transition-all hover:text-white hover:bg-white/[0.05]"
              >
                <Github className="w-5 h-5" />
                GitHub
              </motion.a>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-12 border-t border-white/[0.06]">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex flex-col items-center group cursor-default"
                >
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-6xl font-black text-white group-hover:text-primary transition-colors duration-300">
                      {stat.value}
                    </span>
                    {stat.suffix && (
                      <span className="text-2xl md:text-3xl font-black text-primary">{stat.suffix}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Star className="w-3 h-3 text-primary/40" />
                    <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 group-hover:text-slate-400 transition-colors">
                      {stat.label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});
