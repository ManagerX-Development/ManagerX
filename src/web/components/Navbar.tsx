import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  Shield, Menu, X, Sparkles, Puzzle, Activity, Terminal,
  Newspaper, Users, Milestone, ChevronDown // Icons for Team and Roadmap
} from "lucide-react";
import { cn } from "../lib/utils";

const mainLinks = [
  { label: "Features", href: "/#features", icon: Sparkles },
  { label: "Commands", href: "/commands", icon: Terminal },
];

const dropdownLinks = [
  { label: "Roadmap", href: "/roadmap", icon: Milestone },
  { label: "Team", href: "/team", icon: Users },
  { label: "Plugins", href: "/plugins", icon: Puzzle },
  { label: "Status", href: "/status", icon: Activity },
];

function NavDropdown({ label, links, location }: { label: string, links: any[], location: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const isActive = links.some(link => location.pathname === link.href);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          "relative text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 group flex items-center gap-2 px-5 py-3 rounded-xl overflow-hidden",
          isActive
            ? "text-white bg-primary/30 shadow-inner"
            : "text-muted-foreground hover:text-white hover:bg-white/5"
        )}
      >
        <span>{label}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isOpen && "rotate-180")} />
        <div className={cn(
          "absolute bottom-0 left-0 h-1 bg-primary transition-all duration-500",
          isActive ? "w-full" : "w-0 group-hover:w-full"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 mt-2 w-56 glass-strong rounded-2xl border border-white/10 shadow-2xl p-2 overflow-hidden z-50"
          >
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest",
                    location.pathname === link.href
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled ? "glass-strong py-3 shadow-2xl border-b border-primary/20" : "py-6 bg-transparent"
      )}
    >
      <div className="container px-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-4 group">
            <motion.div
              className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-subtle shadow-xl shadow-primary/30 text-white relative overflow-hidden"
              whileHover={{ rotate: 15, scale: 1.15 }}
            >
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
            {mainLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={cn(
                  "relative text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 group flex items-center gap-2 px-5 py-3 rounded-xl overflow-hidden",
                  location.pathname === link.href
                    ? "text-white bg-primary/30 shadow-inner"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <link.icon className={cn("w-4 h-4 transition-transform group-hover:rotate-12", location.pathname === link.href ? "text-primary" : "text-muted-foreground")} />
                {link.label}
                <div className={cn(
                  "absolute bottom-0 left-0 h-1 bg-primary transition-all duration-500",
                  location.pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                )} />
              </Link>
            ))}

            <NavDropdown label="Netzwerk" links={dropdownLinks} location={location} />
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://discord.com/oauth2/authorize?client_id=1368201272624287754&permissions=1669118160151&integration_type=0&scope=bot"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-black uppercase text-xs tracking-widest relative overflow-hidden shadow-xl shadow-primary/20"
            >
              <Sparkles className="w-4 h-4 group-hover:animate-spin-slow transition-transform" />
              <span>Bot einladen</span>
            </motion.a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/5 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-b border-white/10 backdrop-blur-lg overflow-hidden"
          >
            <div className="container py-10 flex flex-col gap-8">
              <div className="grid grid-cols-1 gap-4">
                {[...mainLinks, ...dropdownLinks].map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "text-sm font-black uppercase tracking-widest flex items-center gap-4 p-4 rounded-2xl transition-all",
                      location.pathname === link.href
                        ? "text-primary bg-primary/10 border border-primary/20"
                        : "text-foreground/80 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <link.icon className="w-5 h-5 text-primary" />
                    {link.label}
                  </Link>
                ))}
              </div>

              <a
                href="https://discord.com/oauth2/authorize?client_id=1368201272624287754&permissions=1669118160151&integration_type=0&scope=bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-accent text-white p-5 rounded-2xl text-center font-black uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                <Sparkles className="w-5 h-5" />
                Bot einladen
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
