import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  features: string[];
  category: "moderation" | "community" | "social" | "interactive";
  delay?: number;
  index: number;
}

const categoryConfig = {
  moderation: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    glow: "shadow-[0_0_60px_rgba(239,68,68,0.25)]",
    hoverBorder: "hover:border-red-500/50",
    bar: "from-red-500 to-red-400",
    accent: "rgba(239,68,68,0.3)",
  },
  community: {
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    glow: "shadow-[0_0_60px_rgba(249,115,22,0.25)]",
    hoverBorder: "hover:border-orange-500/50",
    bar: "from-orange-500 to-amber-400",
    accent: "rgba(249,115,22,0.3)",
  },
  social: {
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    glow: "shadow-[0_0_60px_rgba(236,72,153,0.25)]",
    hoverBorder: "hover:border-pink-500/50",
    bar: "from-pink-500 to-rose-400",
    accent: "rgba(236,72,153,0.3)",
  },
  interactive: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    glow: "shadow-[0_0_60px_rgba(245,158,11,0.25)]",
    hoverBorder: "hover:border-amber-500/50",
    bar: "from-amber-500 to-yellow-400",
    accent: "rgba(245,158,11,0.3)",
  },
};

export const FeatureCard = memo(function FeatureCard({
  icon: Icon,
  title,
  features,
  category,
  delay = 0,
  index,
}: FeatureCardProps) {
  const [hovered, setHovered] = useState(false);
  const cfg = categoryConfig[category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -12 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={cn(
        "group relative glass rounded-[2.5rem] p-8 border transition-all duration-500 overflow-hidden cursor-default",
        cfg.border,
        cfg.hoverBorder,
        hovered ? cfg.glow : "shadow-xl",
      )}
    >
      {/* Animated background gradient on hover */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className={cn("absolute inset-0 rounded-[2.5rem]", cfg.bg)}
        style={{
          background: `radial-gradient(circle at top left, ${cfg.accent} 0%, transparent 60%)`,
        }}
      />

      {/* Number badge */}
      <div className="absolute top-6 right-6 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        <span className="text-[10px] font-black text-white/30">{String(index + 1).padStart(2, "0")}</span>
      </div>

      {/* Icon with glow ring */}
      <div className="relative mb-8 flex items-start">
        <div className={cn("relative w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500", cfg.bg, cfg.border, "group-hover:scale-110")}>
          <motion.div
            animate={{ opacity: hovered ? 0.6 : 0, scale: hovered ? 1.5 : 1 }}
            transition={{ duration: 0.4 }}
            className={cn("absolute inset-0 rounded-2xl blur-lg", cfg.bg)}
          />
          <Icon className={cn("w-7 h-7 relative z-10", cfg.color)} />
        </div>
      </div>

      <h3 className={cn(
        "text-2xl font-black mb-2 tracking-tight transition-colors duration-300 uppercase italic",
        hovered ? cfg.color : "text-white"
      )}>
        {title}
      </h3>

      {/* Mini progress bar */}
      <div className="h-[2px] w-full bg-white/5 rounded-full mb-8 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", cfg.bar)}
          initial={{ width: "0%" }}
          whileInView={{ width: "100%" }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: delay + 0.3, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-3.5">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: delay + i * 0.05 + 0.2 }}
            className="flex items-center gap-3 text-[14px] font-medium text-slate-400 group-hover:text-slate-300 transition-colors"
          >
            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 border", cfg.bg, cfg.border)}>
              <Check className={cn("w-3 h-3", cfg.color)} />
            </div>
            <span className="leading-relaxed">{feature}</span>
          </motion.div>
        ))}
      </div>

      {/* Bottom "Learn more" hint on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className={cn("mt-8 flex items-center gap-2 text-[12px] font-black uppercase tracking-widest", cfg.color)}
          >
            <span>Details ansehen</span>
            <ArrowRight className="w-3 h-3" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
