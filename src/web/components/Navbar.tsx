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
          "relative text-sm font-medium transition-all duration-300 group flex items-center gap-1.5 px-4 py-2 rounded-xl",
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span>{label}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300 opacity-60", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="absolute top-full left-0 mt-3 w-52 glass-strong rounded-[1.25rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-2 z-50"
          >
            <div className="flex flex-col gap-0.5">
              {links.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                    location.pathname === link.href
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <link.icon className="w-4 h-4 opacity-70" />
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
        isScrolled ? "py-3" : "py-6"
      )}
    >
      <div className="container mx-auto px-4 flex justify-center">
        <nav className={cn(
          "flex items-center justify-between gap-8 md:gap-12 px-6 py-3 rounded-[2rem] transition-all duration-500 border border-transparent w-full max-w-7xl",
          isScrolled ? "glass-strong shadow-2xl border-white/10" : "bg-transparent"
        )}>
          {/* Left: Logo */}
          <div className="flex-1 flex justify-start">
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <motion.div
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 text-white relative overflow-hidden"
                whileHover={{ scale: 1.1, rotate: -5 }}
              >
                <Shield className="w-5 h-5 drop-shadow-glow" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white leading-none">
                  Manager<span className="text-primary">X</span>
                </span>
                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-[0.2em] mt-1 opacity-50">Stable 2.0.0</span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex items-center gap-1">
              {mainLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className={cn(
                    "relative text-sm font-medium transition-all duration-300 flex items-center gap-2 px-4 py-2 rounded-xl",
                    location.pathname === link.href
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <link.icon className={cn("w-4 h-4 opacity-70", location.pathname === link.href && "opacity-100")} />
                  {link.label}
                </Link>
              ))}
              <NavDropdown label="Netzwerk" links={dropdownLinks} location={location} />
            </div>
          </div>

          {/* Right: CTA & Mobile Menu */}
          <div className="flex-1 flex justify-end items-center gap-4">
            <div className="hidden md:flex items-center">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="https://discord.com/oauth2/authorize?client_id=1368201272624287754&permissions=1669118160151&integration_type=0&scope=bot"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm tracking-tight relative overflow-hidden shadow-lg shadow-primary/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Bot einladen</span>
              </motion.a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="md:hidden px-4 mt-4"
          >
            <div className="glass shadow-2xl rounded-[2.5rem] border border-white/10 p-4 flex flex-col gap-2">
              {[...mainLinks, ...dropdownLinks].map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "text-base font-medium flex items-center gap-4 px-6 py-4 rounded-2xl transition-all",
                    location.pathname === link.href
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <link.icon className="w-5 h-5 opacity-70" />
                  {link.label}
                </Link>
              ))}
              <hr className="border-white/5 my-2" />
              <a
                href="https://discord.com/oauth2/authorize?client_id=1368201272624287754&permissions=1669118160151&integration_type=0&scope=bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-primary text-white p-5 rounded-2xl text-center font-bold tracking-tight shadow-xl shadow-primary/20"
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
