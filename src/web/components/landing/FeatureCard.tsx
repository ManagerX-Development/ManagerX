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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -10 }}
      className="group relative glass rounded-[2rem] p-8 border border-white/5 hover:border-primary/20 transition-all duration-500 overflow-hidden shadow-xl"
    >
      <div className={cn(
        "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-700",
        categoryBgColors[category]
      )} />

      <div className="flex items-start justify-between mb-8">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-500 border border-white/5 shadow-inner",
          categoryBgColors[category]
        )}>
          <Icon className={cn("w-6 h-6", categoryColors[category])} />
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-6 text-foreground tracking-tight group-hover:text-primary transition-colors">
        {title}
      </h3>

      <div className="space-y-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start gap-3 text-[14px] font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors"
          >
            <Check className={cn("w-4 h-4 mt-0.5 shrink-0 opacity-50", categoryColors[category])} />
            <span className="leading-relaxed">{feature}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
});
