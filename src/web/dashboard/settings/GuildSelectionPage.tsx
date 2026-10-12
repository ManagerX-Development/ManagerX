import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../components/core/AuthProvider";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Plus,
    ChevronRight,
    Shield,
    Sparkles,
    Server,
    Users,
    Settings2,
    Zap,
    Crown,
    ExternalLink,
    Bot,
    LogOut
} from "lucide-react";
import { cn } from "../../lib/utils";

export default function GuildSelectionPage() {
    const { guilds, setSelectedGuildId, user } = useAuth();
    const [search, setSearch] = useState("");
    const [hoveredGuild, setHoveredGuild] = useState<string | null>(null);
    const navigate = useNavigate();

    const filteredGuilds = guilds.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (id: string) => {
        setSelectedGuildId(id);
        navigate("/dash/settings");
    };

    return (
        <div className="min-h-screen bg-[#030305] text-white relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-red-600/[0.07] blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-red-900/[0.05] blur-[100px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/[0.03] blur-[80px]" />
                {/* Grid */}
                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: "60px 60px"
                    }}
                />
            </div>

            <div className="relative z-10 flex flex-col items-center px-6 pt-16 pb-24 min-h-screen">
                <div className="w-full max-w-6xl">

                    {/* Top Navigation Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-16"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-red-700 flex items-center justify-center shadow-lg shadow-primary/30">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">ManagerX</p>
                                <p className="text-sm font-bold text-white/90 -mt-0.5">Control Panel</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] px-4 py-2.5 rounded-2xl backdrop-blur-xl group">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-red-700 flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20">
                                {user?.username?.[0]?.toUpperCase()}
                            </div>
                            <div className="mr-2">
                                <p className="text-sm font-bold leading-none">{user?.username}</p>
                                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Angemeldet</p>
                            </div>
                            <div className="h-6 w-px bg-white/10 mx-1"></div>
                            <button 
                                onClick={() => {
                                    logout();
                                    navigate("/dash/login");
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-500 transition-colors"
                                title="Abmelden"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>

                    {/* Hero Header */}
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                                {guilds.length} Server verfügbar
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="text-6xl md:text-7xl font-black tracking-tighter mb-4"
                        >
                            Server{" "}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-red-400 to-primary">
                                Zentrale
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-white/40 max-w-md mx-auto font-medium"
                        >
                            Wähle einen Server, um die ManagerX Suite zu konfigurieren.
                        </motion.p>
                    </div>

                    {/* Search */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="relative max-w-lg mx-auto mb-12 group"
                    >
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors duration-300" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Server durchsuchen..."
                            className="w-full h-14 pl-14 pr-6 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.12] focus:border-primary/40 rounded-2xl text-white placeholder:text-white/20 outline-none transition-all duration-300 backdrop-blur-xl text-base font-medium"
                        />
                        <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-300" />
                    </motion.div>

                    {/* Guild Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <AnimatePresence>
                            {filteredGuilds.map((guild, index) => (
                                <motion.div
                                    key={guild.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: 0.05 * index, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                                    onHoverStart={() => setHoveredGuild(guild.id)}
                                    onHoverEnd={() => setHoveredGuild(null)}
                                    onClick={() => handleSelect(guild.id)}
                                    whileHover={{ y: -6 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="relative cursor-pointer group"
                                >
                                    {/* Card */}
                                    <div className={cn(
                                        "relative p-7 rounded-3xl border overflow-hidden transition-all duration-500",
                                        "bg-white/[0.03] border-white/[0.07]",
                                        "hover:bg-white/[0.06] hover:border-primary/30",
                                        "hover:shadow-[0_20px_60px_-20px_rgba(220,38,38,0.3)]"
                                    )}>
                                        {/* Hover glow */}
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                        
                                        {/* Animated top border */}
                                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        {/* Header row */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center overflow-hidden shadow-xl group-hover:border-primary/20 transition-all duration-300">
                                                    {guild.icon ? (
                                                        <img
                                                            src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256`}
                                                            alt={guild.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-2xl font-black text-white/20 font-mono">
                                                            {guild.name.charAt(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Online indicator */}
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#030305]">
                                                    <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                                                </div>
                                            </div>

                                            <motion.div
                                                animate={{
                                                    x: hoveredGuild === guild.id ? 0 : 8,
                                                    opacity: hoveredGuild === guild.id ? 1 : 0
                                                }}
                                                className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center"
                                            >
                                                <ChevronRight className="w-5 h-5 text-primary" />
                                            </motion.div>
                                        </div>

                                        {/* Guild Info */}
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1.5 truncate group-hover:text-primary transition-colors duration-300">
                                                {guild.name}
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/30 group-hover:text-white/50 transition-colors">
                                                    <Shield className="w-3 h-3 text-primary/50" />
                                                    <span>Admin Access</span>
                                                </div>
                                                <div className="w-1 h-1 rounded-full bg-white/15" />
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/30">
                                                    <Settings2 className="w-3 h-3" />
                                                    <span>Konfigurieren</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom action hint */}
                                        <div className="absolute bottom-0 left-0 right-0 h-[40px] bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Invite Button Card */}
                        <motion.a
                            href="https://discord.com/oauth2/authorize?client_id=1542970562588975135&permissions=8866461766385655&integration_type=0&scope=bot"
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * filteredGuilds.length + 0.1 }}
                            whileHover={{ y: -6 }}
                            whileTap={{ scale: 0.97 }}
                            className="group block"
                        >
                            <div className="p-7 rounded-3xl border-2 border-dashed border-white/[0.07] hover:border-primary/30 bg-transparent hover:bg-primary/[0.04] transition-all duration-500 hover:shadow-[0_20px_60px_-20px_rgba(220,38,38,0.2)] flex flex-col items-center justify-center text-center gap-5 min-h-[185px]">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                                    <Plus className="w-7 h-7 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-lg mb-1">Bot einladen</p>
                                    <p className="text-sm text-white/30 flex items-center gap-1.5 justify-center">
                                        <ExternalLink className="w-3 h-3" />
                                        Neuen Server hinzufügen
                                    </p>
                                </div>
                            </div>
                        </motion.a>
                    </div>

                    {/* Empty state */}
                    <AnimatePresence>
                        {filteredGuilds.length === 0 && search && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-24"
                            >
                                <div className="w-20 h-20 bg-white/[0.03] border border-white/[0.05] rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Server className="w-9 h-9 text-white/10" />
                                </div>
                                <h3 className="text-2xl font-black text-white/20 italic">
                                    Kein Server gefunden für „{search}"
                                </h3>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/15">ManagerX Engine v2.0.0</p>
            </div>
        </div>
    );
}
