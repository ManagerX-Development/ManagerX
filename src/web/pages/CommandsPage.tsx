import { memo, useState, useMemo } from "react";
import {
    Search, ChevronRight, Terminal, Info, Filter, Sparkles
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import { CATEGORIES, COMMANDS, Command } from "../data/commands";
import { SEO } from "../components/SEO";

import { useRef } from "react";
import { useInView } from "framer-motion";

const CommandCard = memo(({ command }: { command: Command }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "200px" });

    return (
        <div ref={ref} className="min-h-[220px]">
            {isInView && (
                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="group p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-primary/20 hover:bg-white/[0.08] transition-all duration-300 relative overflow-hidden flex flex-col h-full"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Terminal className="w-12 h-12 text-primary" />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {command.badges.map((badge, i) => (
                            <Badge key={i} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg">
                                {badge}
                            </Badge>
                        ))}
                    </div>

                    <h3 className="text-xl font-black text-white italic tracking-tight mb-2 flex items-center gap-2">
                        <span className="text-primary group-hover:scale-110 transition-transform">/</span>
                        {command.name}
                    </h3>

                    <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6 group-hover:text-slate-300 transition-colors">
                        {command.description}
                    </p>

                    <div className="mt-auto pt-6 border-t border-white/5">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Usage</div>
                        <code className="text-xs font-mono bg-black/40 px-3 py-2 rounded-xl border border-white/5 text-primary block truncate">
                            {command.usage}
                        </code>
                    </div>
                </motion.div>
            )}
        </div>
    );
});

export const CommandsPage = memo(function CommandsPage() {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    const filteredCommands = useMemo(() => {
        return COMMANDS.filter(cmd => {
            const matchesSearch = cmd.name.toLowerCase().includes(search.toLowerCase()) ||
                cmd.description.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = activeCategory === "all" || cmd.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [search, activeCategory]);

    const groupedCommands = useMemo(() => {
        const groups: { [key: string]: Command[] } = {};
        filteredCommands.forEach(cmd => {
            if (!groups[cmd.category]) groups[cmd.category] = [];
            groups[cmd.category].push(cmd);
        });
        return groups;
    }, [filteredCommands]);

    const availableCategories = useMemo(() => {
        const usedIds = new Set(COMMANDS.map(cmd => cmd.category));
        return CATEGORIES.filter(cat => cat.id === "all" || usedIds.has(cat.id));
    }, []);

    const visibleCategories = useMemo(() => {
        return availableCategories.filter(cat => cat.id !== "all" && groupedCommands[cat.id]);
    }, [availableCategories, groupedCommands]);

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-300 flex flex-col font-sans selection:bg-primary/30">
            <SEO
                title="Befehle"
                description="Alle ManagerX Slash-Commands auf einen Blick. Moderation, XP, Spiele und vieles mehr."
            />
            <Navbar />

            <main className="flex-grow container mx-auto px-4 pt-48 pb-24">
                {/* Header Section */}
                <header className="max-w-4xl mx-auto text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-4 text-primary mb-6"
                    >
                        <Sparkles className="w-6 h-6 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-[0.4em]">Command Reference</span>
                    </motion.div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.9] mb-8">
                        Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">Commands</span>
                    </h1>
                    <p className="text-xl text-slate-400 font-medium leading-relaxed mb-12">
                        Entdecke alle verfügbaren Slash-Commands für ManagerX. Von Moderation bis hin zu AI-Games – alles auf einen Blick.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-focus-within:opacity-100" />
                        <div className="relative flex items-center">
                            <span className="absolute left-6 w-5 h-5 flex items-center justify-center pointer-events-none">
                                <Search className="w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                            </span>
                            <Input
                                type="text"
                                placeholder="Suche nach Befehlen (z.B. 'ban', 'xp', 'game')..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-16 pl-16 pr-6 bg-[#111318] border-white/10 rounded-[1.5rem] focus:ring-primary focus:border-primary text-white text-lg font-bold placeholder:text-slate-600 transition-all shadow-2xl"
                            />
                        </div>
                    </div>
                </header>

                {/* Category Filters */}
                <div className="flex flex-wrap justify-center gap-3 mb-24 max-w-5xl mx-auto">
                    {availableCategories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 font-bold uppercase tracking-widest text-[11px] border shadow-lg hover:scale-105",
                                    activeCategory === cat.id
                                        ? "bg-primary/20 text-primary border-primary/30 shadow-primary/10"
                                        : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10 hover:text-white"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {cat.title}
                            </button>
                        );
                    })}
                </div>

                {/* Grouped Commands Content */}
                <div className="space-y-32">
                    <AnimatePresence mode="popLayout">
                        {visibleCategories.length > 0 ? (
                            visibleCategories.map((cat) => {
                                const Icon = cat.icon;
                                return (
                                    <motion.section
                                        key={cat.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.4 }}
                                        className="relative"
                                    >
                                        {/* Category Title Header */}
                                        <div className="flex items-center gap-6 mb-12 relative">
                                            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xl shadow-primary/5">
                                                <Icon className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">{cat.title}</h2>
                                                <div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent mt-2 rounded-full" />
                                            </div>
                                            <div className="flex-grow h-[1px] bg-white/5 ml-8 hidden md:block" />
                                        </div>

                                        {/* Commands Grid and Category */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {groupedCommands[cat.id].map((command) => (
                                                <CommandCard key={command.name} command={command} />
                                            ))}
                                        </div>
                                    </motion.section>
                                );
                            })
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-32 text-center"
                            >
                                <Filter className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-white uppercase italic mb-2">Keine Befehle gefunden</h3>
                                <p className="text-slate-500 font-medium">Versuch es mit einem anderen Suchbegriff oder einer anderen Kategorie.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Help Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-48 p-12 rounded-[3.5rem] glass-strong border border-primary/20 flex flex-col items-center text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/10 blur-[100px] -mr-32 -mt-32" />
                    <Info className="w-12 h-12 text-primary mb-6" />
                    <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Brauchst du mehr Hilfe?</h2>
                    <p className="text-slate-400 font-medium max-w-md mb-10 leading-relaxed">
                        Nutze <code className="text-primary italic font-black">/help</code> direkt in Discord für detaillierte Anleitungen zu jedem einzelnen Befehl.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <a
                            href="https://discord.gg/9T28DWup3g"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-primary/20 flex items-center gap-3"
                        >
                            Support Server
                            <ChevronRight className="w-5 h-5" />
                        </a>
                    </div>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
});

export default CommandsPage;
