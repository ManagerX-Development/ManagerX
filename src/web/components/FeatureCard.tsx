import { memo } from "react";
import { motion } from "framer-motion";
import { LucideIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  features: string[];
  category: "moderation" | "community" | "social" | "interactive";
  delay?: number;
}

const categoryColors = {
  moderation: "text-[hsl(var(--moderation))]",
  community: "text-[hsl(var(--community))]",
  social: "text-[hsl(var(--social))]",
  interactive: "text-[hsl(var(--interactive))]",
};

const categoryBgColors = {
  moderation: "bg-[hsl(var(--moderation)/0.15)]",
  community: "bg-[hsl(var(--community)/0.15)]",
  social: "bg-[hsl(var(--social)/0.15)]",
  interactive: "bg-[hsl(var(--interactive)/0.15)]",
};

const categoryGlows = {
  moderation: "shadow-[hsl(var(--moderation)/0.2)]",
  community: "shadow-[hsl(var(--community)/0.2)]",
  social: "shadow-[hsl(var(--social)/0.2)]",
  interactive: "shadow-[hsl(var(--interactive)/0.2)]",
};

export const FeatureCard = memo(function FeatureCard({
  icon: Icon,
  title,
  features,
  category,
  delay = 0
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.35, delay, type: "spring", stiffness: 200, damping: 20 }}
      whileHover={{ y: -15, scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className="group relative glass rounded-[2.5rem] p-8 hover:bg-card/95 transition-all duration-300 ease-out border border-white/5 backdrop-blur-3xl overflow-hidden shadow-2xl"
    >
      {/* Dynamic Glow Orb */}
      <div className={cn(
        "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-0 group-hover:opacity-50 transition-all duration-500",
        categoryBgColors[category].replace("bg-", "bg-")
      )} />

      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <motion.div
          whileHover={{ scale: 1.2, rotate: 12 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl border border-white/5 relative overflow-hidden",
            categoryBgColors[category],
            categoryGlows[category]
          )}
        >
          <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors" />
          <Icon className={cn("w-10 h-10", categoryColors[category])} />
        </motion.div>
      </div>

      <motion.h3
        className="text-3xl font-black mb-8 text-foreground group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent transition-all duration-300 tracking-tighter"
      >
        {title}
      </motion.h3>

      <div className="space-y-5">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: delay + 0.05 + index * 0.02 }}
            className="flex items-start gap-4 text-[15px] font-medium text-muted-foreground group-hover:text-foreground/90 transition-colors"
          >
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg border border-white/5 group-hover:scale-110 transition-transform",
              categoryBgColors[category]
            )}>
              <Check className={cn("w-3.5 h-3.5", categoryColors[category])} />
            </div>
            <span className="leading-snug">{feature}</span>
          </motion.div>
        ))}
      </div>

      {/* Playful hover line */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300" />
    </motion.div>
  );
});
