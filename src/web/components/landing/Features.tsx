import { memo } from "react";
import { motion } from "framer-motion";
import { FeatureCard } from "./FeatureCard";
import {
  Shield,
  Award,
  Globe,
  Gamepad2,
  Sparkles
} from "lucide-react";

const featureCategories = [
  {
    icon: Shield,
    title: "Moderation & Sicherheit",
    category: "moderation" as const,
    features: [
      "Ban, Kick, Mute, Warn Befehle",
      "Intelligentes Anti-Spam System",
      "Automatisches Warning-Management",
      "Detaillierte Moderation-Logs",
      "Temporäre Strafen (Timeout)",
      "Reason-Tracking für alle Actions",
    ],
  },
  {
    icon: Award,
    title: "Community Engagement",
    category: "community" as const,
    features: [
      "Vollständig anpassbares XP-System",
      "Rollenbelohnungen für Level-Ups",
      "Server & Global Leaderboards",
      "XP-Multiplikatoren & Boosts",
      "Voice-Channel XP-Tracking",
      "Automatische Begrüßungsnachrichten",
    ],
  },
  {
    icon: Globe,
    title: "Social & Information",
    category: "social" as const,
    features: [
      "Echtzeit-Chat mit anderen Servern",
      "Wikipedia Integration",
      "Live-Wetterinformationen",
      "Server-übergreifende Reputation",
      "Mehrsprachige Unterstützung",
      "Report & Block Funktionen",
    ],
  },
  {
    icon: Gamepad2,
    title: "Interaktive Features",
    category: "interactive" as const,
    features: [
      "Temporary Voice Channels",
      "Individuelle Kanalverwaltung",
      "Server-Statistiken in Echtzeit",
      "User-Activity Tracking",
      "Command-Usage Analytics",
      "Auto-Delete bei Inaktivität",
    ],
  },
];

export const Features = memo(function Features() {
  return (
    <section id="features" className="py-40 relative overflow-hidden bg-[#080a0c]">
      {/* Ultra-Premium Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.03)_0%,transparent_70%)]" />
      <div className="absolute top-1/4 -left-48 w-[800px] h-[800px] bg-primary/10 blur-[180px] rounded-full opacity-30" />
      <div className="absolute bottom-1/4 -right-48 w-[900px] h-[900px] bg-accent/10 blur-[180px] rounded-full opacity-30" />

      <div className="container mx-auto relative z-10 px-4">
        {/* Elite Section Header */}
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto mb-28">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass-strong border border-white/10 mb-10 shadow-xl"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[12px] font-black uppercase tracking-[0.4em] text-white/70">Next-Gen Architecture</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-6xl md:text-9xl font-black mb-10 tracking-tighter leading-[0.8] uppercase italic"
          >
            Dominanz durch <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient drop-shadow-[0_0_40px_rgba(220,38,38,0.3)]">Technologie</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl md:text-2xl text-slate-400 max-w-3xl font-medium leading-relaxed"
          >
            Von hochperformanter Datenbank-Migration bis hin zu KI-gestützter Moderation – wir setzen neue Maßstäbe für deinen Discord-Server.
          </motion.p>
        </div>

        {/* Feature Cards Elite Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featureCategories.map((category, index) => (
            <FeatureCard
              key={category.title}
              icon={category.icon}
              title={category.title}
              features={category.features}
              category={category.category}
              delay={index * 0.08}
            />
          ))}
        </div>
      </div>
    </section>
  );
});
