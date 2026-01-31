import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Shield, Menu, X, Sparkles, Puzzle, Activity,
  Newspaper // Icon für den Blog hinzugefügt
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "/#features", icon: Sparkles },
  { label: "Plugins", href: "/plugins", icon: Puzzle },
  { label: "Status", href: "/status", icon: Activity },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrolled = currentScrollY > 20;

      // Only update state if the status actually changed to save CPU cycles
      setIsScrolled((prev) => {
        if (prev !== scrolled) return scrolled;
        return prev;
      });
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      style={{ willChange: "transform, opacity" }}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)",
        isScrolled ? "glass-strong py-3 shadow-2xl shadow-primary/10 border-b border-primary/20" : "py-6 bg-transparent"
      )}
    >
      <div className="container px-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-4 group">
            <motion.div
              className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-subtle shadow-xl shadow-primary/30 text-white relative overflow-hidden"
              whileHover={{ rotate: 15, scale: 1.15 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Shield className="w-6 h-6 drop-shadow-glow" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white leading-none group-hover:text-primary transition-colors">
                Manager<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">X</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1 opacity-60">High Performance</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3 glass p-1.5 rounded-2xl border border-white/5 backdrop-blur-3xl">
            {navLinks.map((link, idx) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 15 }}
              >
                <Link
                  to={link.href}
                  className={cn(
                    "relative text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 group flex items-center gap-2 px-5 py-3 rounded-xl overflow-hidden",
                    location.pathname === link.href
                      ? "text-white bg-primary/30 shadow-inner"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  {link.icon && <link.icon className={cn("w-4 h-4 transition-transform group-hover:rotate-12 group-hover:scale-125", location.pathname === link.href ? "text-primary" : "text-muted-foreground")} />}
                  {link.label}
                  <div className={cn(
                    "absolute bottom-0 left-0 h-1 bg-primary transition-all duration-500",
                    location.pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                  )} />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <motion.a
              whileHover={{ scale: 1.1, rotate: -2, y: -2 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              href="https://discord.com/oauth2/authorize?client_id=1368201272624287754&permissions=1669118160151&integration_type=0&scope=bot"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-black hover:shadow-[0_15px_40px_rgba(255,0,0,0.5)] transition-all uppercase text-xs tracking-widest relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              <Sparkles className="w-4 h-4 group-hover:animate-spin-slow transition-transform relative z-10" />
              <span className="relative z-10">Bot einladen</span>
            </motion.a>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden glass border-b border-white/10 backdrop-blur-lg"
          >
            <div className="container py-10 flex flex-col gap-6">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "text-lg font-bold uppercase flex items-center gap-3 p-3 rounded-lg transition-colors",
                      location.pathname === link.href
                        ? "text-primary bg-primary/10"
                        : "text-foreground/80 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {link.icon && <link.icon className="w-5 h-5 text-primary" />}
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.a
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                href="https://discord.com/oauth2/authorize?client_id=1368201272624287754&permissions=1669118160151&integration_type=0&scope=bot"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white p-4 rounded-2xl text-center font-bold uppercase tracking-widest hover:shadow-lg transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Bot einladen
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}