import { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Code2, GitBranch, Heart, ExternalLink,
  Shield, ChevronRight, Package, Terminal, Box, HelpCircle
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { motion } from "framer-motion";

const pythonCategories = [
  {
    title: "ManagerX Ecosystem",
    deps: [
      { name: "ManagerX-DevTools", version: "1.2026.3.15", license: "GPL-3.0", url: "https://github.com/ManagerX-Development/ManagerX-DevTools" },
      { name: "ManagerX-Handler", version: "1.2026.2.9.4", license: "GPL-3.0", url: "https://github.com/ManagerX-Development/ManagerX-Handler" },
    ]
  },
  {
    title: "Core Frameworks & Discord",
    deps: [
      { name: "ezcord", version: "0.7.4", license: "MIT", url: "https://github.com/ezcord-org/ezcord" },
      { name: "py-cord", version: "2.7.1", license: "MIT", url: "https://github.com/Pycord-Development/pycord" },
      { name: "fastapi", version: "0.135.1", license: "MIT", url: "https://github.com/tiangolo/fastapi" },
      { name: "uvicorn", version: "0.41.0", license: "BSD-3", url: "https://github.com/encode/uvicorn" },
      { name: "better-ipc", version: "2.0.3", license: "MIT", url: "https://github.com/Marseel-E/better-ipc" },
      { name: "PyJWT", version: "2.10.1", license: "MIT", url: "https://github.com/jpadilla/pyjwt" },
    ]
  },
  {
    title: "Async & Performance",
    deps: [
      { name: "aiohttp", version: "3.13.3", license: "Apache 2.0", url: "https://github.com/aio-libs/aiohttp" },
      { name: "aiosqlite", version: "0.22.1", license: "MIT", url: "https://github.com/omnilib/aiosqlite" },
      { name: "aiocache", version: "0.12.3", license: "BSD-3", url: "https://github.com/aio-libs/aiocache" },
      { name: "anyio", version: "4.12.1", license: "MIT", url: "https://github.com/agronholm/anyio" },
      { name: "websockets", version: "16.0", license: "BSD-3", url: "https://github.com/python-websockets/websockets" },
    ]
  },
  {
    title: "Data & Validation",
    deps: [
      { name: "pydantic", version: "2.12.5", license: "MIT", url: "https://github.com/pydantic/pydantic" },
      { name: "PyYAML", version: "6.0.1", license: "MIT", url: "https://github.com/yaml/pyyaml" },
      { name: "annotated-types", version: "0.7.0", license: "MIT", url: "https://github.com/pydantic/annotated-types" },
    ]
  },
  {
    title: "UI, Imaging & Logging",
    deps: [
      { name: "beautifulsoup4", version: "4.14.3", license: "MIT", url: "https://www.crummy.com/software/BeautifulSoup/" },
      { name: "pillow", version: "10.4.0", license: "HPND", url: "https://github.com/python-pillow/Pillow" },
      { name: "rich", version: "13.5.2", license: "MIT", url: "https://github.com/Textualize/rich" },
      { name: "easy-pil", version: "0.4.0", license: "MIT", url: "https://github.com/Oogle-S/easy-pil" },
    ]
  },
  {
    title: "System & Utilities",
    deps: [
      { name: "psutil", version: "5.9.5", license: "BSD-3", url: "https://github.com/giampaolo/psutil" },
      { name: "python-dotenv", version: "1.2.2", license: "BSD-3", url: "https://github.com/theskumar/python-dotenv" },
      { name: "click", version: "8.3.1", license: "BSD-3", url: "https://github.com/pallets/click" },
      { name: "jinja2", version: "3.1.6", license: "BSD-3", url: "https://github.com/pallets/jinja" },
      { name: "wikipedia", version: "1.4.0", license: "MIT", url: "https://github.com/goldsmith/Wikipedia" },
    ]
  }
];

const nodeCategories = [
  {
    title: "Framework & Core",
    deps: [
      { name: "react", version: "19.2.4", license: "MIT", url: "https://github.com/facebook/react" },
      { name: "react-dom", version: "19.2.4", license: "MIT", url: "https://github.com/facebook/react" },
      { name: "react-router-dom", version: "7.13.1", license: "MIT", url: "https://github.com/remix-run/react-router" },
      { name: "vite", version: "8.0.0", license: "MIT", url: "https://github.com/vitejs/vite" },
      { name: "typescript", version: "5.9.3", license: "Apache 2.0", url: "https://github.com/microsoft/TypeScript" },
    ]
  },
  {
    title: "UI & Animations",
    deps: [
      { name: "framer-motion", version: "12.36.0", license: "MIT", url: "https://github.com/framer/motion" },
      { name: "lucide-react", version: "0.577.0", license: "ISC", url: "https://github.com/lucide-icons/lucide" },
      { name: "embla-carousel-react", version: "8.6.0", license: "MIT", url: "https://github.com/davidjerleke/embla-carousel" },
      { name: "sonner", version: "2.0.7", license: "MIT", url: "https://github.com/emilkowalski/sonner" },
      { name: "vaul", version: "1.1.2", license: "MIT", url: "https://github.com/emilkowalski/vaul" },
    ]
  },
  {
    title: "State & Data Management",
    deps: [
      { name: "@tanstack/react-query", version: "5.90.21", license: "MIT", url: "https://github.com/tanstack/query" },
      { name: "zod", version: "4.3.6", license: "MIT", url: "https://github.com/colinhacks/zod" },
      { name: "react-hook-form", version: "7.71.2", license: "MIT", url: "https://github.com/react-hook-form/react-hook-form" },
    ]
  },
  {
    title: "Styling",
    deps: [
      { name: "tailwindcss", version: "4.2.1", license: "MIT", url: "https://github.com/tailwindlabs/tailwindcss" },
      { name: "clsx", version: "2.1.1", license: "MIT", url: "https://github.com/lukeed/clsx" },
      { name: "tailwind-merge", version: "3.5.0", license: "MIT", url: "https://github.com/dcastil/tailwind-merge" },
    ]
  },
  {
    title: "Radix UI Primitives",
    deps: [
      { name: "@radix-ui/react-accordion", version: "1.2.12", license: "MIT", url: "https://github.com/radix-ui/primitives" },
      { name: "@radix-ui/react-alert-dialog", version: "1.1.15", license: "MIT", url: "https://github.com/radix-ui/primitives" },
      { name: "@radix-ui/react-dropdown-menu", version: "2.1.16", license: "MIT", url: "https://github.com/radix-ui/primitives" },
      { name: "@radix-ui/react-tooltip", version: "1.2.8", license: "MIT", url: "https://github.com/radix-ui/primitives" },
      { name: "@radix-ui/react-dialog", version: "1.1.15", license: "MIT", url: "https://github.com/radix-ui/primitives" },
    ]
  }
];

const SECTIONS = [
  { id: "project-license", title: "Project License", icon: Shield },
  { id: "python-deps", title: "Python Deps", icon: Box },
  { id: "node-deps", title: "Node.js Deps", icon: Package },
  { id: "other-deps", title: "Other Details", icon: Terminal },
  { id: "contributing", title: "Contributing", icon: Heart },
  { id: "copyright", title: "Copyright", icon: HelpCircle },
];

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-32 group">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      <h2 className="text-2xl font-black text-white uppercase italic tracking-tight group-hover:text-primary transition-colors">
        {title}
      </h2>
    </div>
    <div className="text-lg leading-relaxed text-slate-400 font-medium whitespace-pre-wrap">
      {children}
    </div>
  </section>
);

const DependencyCard = ({ dep }: { dep: any }) => (
  <a
    href={dep.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex flex-col p-6 rounded-2xl bg-[#111318] border border-white/5 hover:border-primary/20 transition-all h-full"
  >
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-bold text-white group-hover:text-primary transition-colors truncate pr-2">{dep.name}</h3>
      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all shrink-0" />
    </div>
    <div className="flex items-center gap-3 mt-auto">
      <span className="text-[10px] text-slate-500 font-mono">v{dep.version}</span>
      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black uppercase text-primary tracking-widest leading-none">
        {dep.license}
      </span>
    </div>
  </a>
);

export const License = memo(function License() {
  const [activeSection, setActiveSection] = useState("project-license");

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = SECTIONS.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 200;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && scrollPosition >= el.offsetTop) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 120,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 pt-48 pb-24 flex flex-col lg:flex-row gap-12 relative">

        {/* Sidebar */}
        <aside className="lg:w-80 shrink-0">
          <div className="sticky top-32 space-y-8">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 px-4">Contents</h3>
              <nav className="space-y-1">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group text-sm font-semibold border ${activeSection === section.id
                      ? "bg-primary/10 text-primary border-primary/20 shadow-lg shadow-primary/5"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent"
                      }`}
                  >
                    <section.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeSection === section.id ? "text-primary" : "text-slate-500"
                      }`} />
                    {section.title}
                    {activeSection === section.id && (
                      <motion.div layoutId="active-indicator-license" className="ml-auto">
                        <ChevronRight className="w-3 h-3" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8 rounded-[2rem] bg-accent/[0.02] border border-accent/20">
              <Heart className="w-8 h-8 text-accent mb-4" />
              <h4 className="text-white font-bold mb-2">Open Source</h4>
              <p className="text-xs text-slate-500 leading-relaxed">ManagerX stolz lizenziert unter GPL-3.0.</p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-grow max-w-4xl">
          <header className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 text-primary mb-6"
            >
              <Code2 className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">Developer Credits</span>
            </motion.div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.9] mb-6">
              Lizenz<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">wesen</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium max-w-2xl leading-relaxed">
              Transparenz bedeutet Vertrauen. Wir nutzen Open-Source-Technologien und geben unseren Code der Community zurück.
            </p>
          </header>

          <article className="space-y-32">
            <Section id="project-license" title="Project License">
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 space-y-4">
                <Shield className="w-10 h-10 text-primary mb-2" />
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight underline decoration-primary/30">GNU GPL v3.0</h3>
                <p className="text-base text-slate-400 leading-relaxed">
                  ManagerX ist unter der GNU General Public License v3.0 lizenziert. Das bedeutet:
                </p>
                <div className="grid gap-3 text-sm italic">
                  <div className="flex gap-4">
                    <span className="text-primary font-bold">01</span>
                    <span>Freie Nutzung und Modifikation des Codes.</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-primary font-bold">02</span>
                    <span>Modifizierte Versionen müssen ebenfalls unter GPL-3.0 stehen.</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-primary font-bold">03</span>
                    <span>Der Source-Code muss öffentlich zugänglich bleiben.</span>
                  </div>
                </div>
              </div>
            </Section>

            <Section id="python-deps" title="Python Dependencies">
              <div className="space-y-16 mt-8">
                {pythonCategories.map((cat) => (
                  <div key={cat.title}>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6 pl-2 border-l-2 border-primary/30">{cat.title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cat.deps.map((dep) => (
                        <DependencyCard key={dep.name} dep={dep} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="node-deps" title="Node.js Dependencies">
              <div className="space-y-16 mt-8">
                {nodeCategories.map((cat) => (
                  <div key={cat.title}>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6 pl-2 border-l-2 border-primary/30">{cat.title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cat.deps.map((dep) => (
                        <DependencyCard key={dep.name} dep={dep} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="other-deps" title="Other Details">
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 space-y-4">
                <p className="text-base">Neben den oben genannten Bibliotheken nutzen wir zahlreiche weitere Tools zur Qualitätssicherung und Entwicklung:</p>
                <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-slate-500 font-mono">
                  <li>• SQLite 3+</li>
                  <li>• Sphinx Docs</li>
                  <li>• ESLint</li>
                  <li>• Vitest</li>
                  <li>• PostCSS</li>
                  <li>• Autoprefixer</li>
                  <li>• Pytest</li>
                  <li>• Black (Formatting)</li>
                </ul>
                <p className="text-sm italic text-slate-500 pt-4 border-t border-white/5">
                  Alle verwendeten Bibliotheken unterliegen ihren jeweiligen Lizenzen (MIT, Apache 2.0, BSD, etc.).
                </p>
              </div>
            </Section>

            <Section id="contributing" title="Contributing">
              <div className="p-10 rounded-[2.5rem] bg-accent/[0.05] border border-accent/20 flex flex-col items-center text-center">
                <GitBranch className="w-12 h-12 text-accent mb-6" />
                <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">Join the Devs</h4>
                <p className="text-lg text-slate-400 font-medium mb-8">Helfen Sie uns, ManagerX noch besser zu machen. Jede PR ist willkommen.</p>
                <a
                  href="https://github.com/ManagerX-Development/ManagerX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 rounded-full bg-accent text-white font-black uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  GitHub Repository
                </a>
              </div>
            </Section>

            <Section id="copyright" title="Copyright">
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 space-y-2 text-sm text-slate-500 font-bold uppercase tracking-widest">
                <p>© 2026 ManagerX Development</p>
                <p>© 2024-2026 OPPRO.NET Network</p>
              </div>
            </Section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
});

export default License;
