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
    <section id="features" className="py-32 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-accent/5" />
      <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-1/4 right-0 w-[700px] h-[700px] bg-accent/10 blur-[150px] rounded-full" />

      <div className="container relative z-10 px-4">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/70">Leistungsstarke Features</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter leading-tight"
          >
            Alles für dein <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Discord Universum</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed"
          >
            Von moderner Server-Sicherheit bis hin zu interaktiven Community-Tools – wir haben alles an Bord.
          </motion.p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureCategories.map((category, index) => (
            <FeatureCard
              key={category.title}
              icon={category.icon}
              title={category.title}
              features={category.features}
              category={category.category}
              delay={index * 0.05} // Reduced from 0.1 for faster animations
            />
          ))}
        </div>
      </div>
    </section>
  );
});
