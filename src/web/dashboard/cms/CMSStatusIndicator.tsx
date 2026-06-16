import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "../../lib/utils";

export type StatusType = "idle" | "sending" | "success" | "error";

interface CMSStatusIndicatorProps {
  status: StatusType;
  message?: string;
  onClear?: () => void;
}

export function CMSStatusIndicator({ status, message, onClear }: CMSStatusIndicatorProps) {
  const config = {
    sending: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      text: message || "Wird gesendet...",
      className: "bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-blue-500/10",
    },
    success: {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      text: message || "Erfolgreich gespeichert",
      className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/10",
    },
    error: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      text: message || "Ein Fehler ist aufgetreten",
      className: "bg-red-500/10 border-red-500/20 text-red-400 shadow-red-500/10",
    },
    idle: {
      icon: null,
      text: message || "",
      className: "bg-white/5 border-white/10 text-muted-foreground",
    },
  };

  const isVisible = status !== "idle" || !!message;
  const current = config[status === "idle" && message ? "idle" : (status as keyof typeof config)];

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border backdrop-blur-xl shadow-2xl pointer-events-auto transition-all duration-300",
              current.className
            )}
          >
            <div className="flex items-center justify-center">
              {current.icon}
            </div>
            <span className="text-[11px] font-black italic uppercase tracking-tight whitespace-nowrap">
              {current.text}
            </span>
            {onClear && (
              <button
                onClick={onClear}
                className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
