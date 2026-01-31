import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Home, Terminal, Sparkles, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Floating particles animation - reduced from 20 to 8 for better performance
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }));

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />

      {/* Animated gradient orbs - Optimized for legacy hardware */}
      <motion.div
        style={{ willChange: "transform, opacity" }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px]"
      />
      <motion.div
        style={{ willChange: "transform, opacity" }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-accent/10 rounded-full blur-[60px]"
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-primary/30 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02] grid-pattern" />

      <div className="container relative z-10 px-4">
        <div className="text-center max-w-5xl mx-auto">

          {/* Logo with enhanced animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex items-center justify-center gap-5 mb-12"
          >
            <div className="relative">
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/40"
              >
                <Shield className="w-12 h-12 text-primary-foreground" />
              </motion.div>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-destructive rounded-full flex items-center justify-center shadow-xl shadow-destructive/50"
              >
                <span className="text-xs font-black text-white">404</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Animated 404 Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <motion.h1
              className="text-8xl md:text-[12rem] font-black mb-4 tracking-tighter leading-none"
            >
              <motion.span
                animate={{
                  textShadow: [
                    "0 0 20px rgba(255,0,0,0.3)",
                    "0 0 40px rgba(255,0,0,0.5)",
                    "0 0 20px rgba(255,0,0,0.3)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient"
              >
                404
              </motion.span>
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 border border-destructive/30"
            >
              <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
              <span className="text-sm font-black uppercase tracking-widest text-destructive">Route Not Found</span>
            </motion.div>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Dieser Pfad ist im <span className="text-foreground font-black">ManagerX</span> Netzwerk nicht registriert. Kehre zurück zur Zentrale.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center mb-20"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/"
                className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-primary to-accent rounded-2xl text-white font-black text-lg hover:shadow-[0_20px_50px_rgba(255,0,0,0.5)] transition-all uppercase tracking-widest overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Home className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Zurück zur Home</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="relative z-10"
                >
                  →
                </motion.span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Terminal Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="inline-flex items-center gap-3 px-6 py-3 glass rounded-2xl border border-white/10 text-[10px] font-mono text-muted-foreground uppercase tracking-widest shadow-xl"
          >
            <Terminal className="w-3 h-3 text-primary" />
            <span>Path: <span className="text-primary font-bold">{location.pathname}</span></span>
            <span className="text-primary/30">|</span>
            <span className="text-destructive font-bold">Status: 404 NOT FOUND</span>
          </motion.div>

          {/* Decorative sparkles */}
          <div className="absolute top-1/4 right-1/4">
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Sparkles className="w-6 h-6 text-primary/30" />
            </motion.div>
          </div>
          <div className="absolute bottom-1/3 left-1/3">
            <motion.div
              animate={{
                rotate: -360,
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Sparkles className="w-4 h-4 text-accent/30" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
};

export default NotFound;