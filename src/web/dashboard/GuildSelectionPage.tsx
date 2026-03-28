import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { 
    LayoutDashboard, 
    Search, 
    Plus, 
    ChevronRight, 
    Shield, 
    Sparkles, 
    Users, 
    Settings,
    Server
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { cn } from "../lib/utils";

export default function GuildSelectionPage() {
    const { guilds, setSelectedGuildId, user } = useAuth();
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    const filteredGuilds = guilds.filter(g => 
        g.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (id: string) => {
        setSelectedGuildId(id);
        navigate("/dash/settings");
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden flex flex-col items-center">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full pointer-events-none -mr-40 -mt-40" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 blur-[120px] rounded-full pointer-events-none -ml-40 -mb-40" />
            <div className="absolute inset-0 opacity-[0.02] grid-pattern pointer-events-none" />

            <div className="w-full max-w-6xl relative z-10 space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Willkommen zurück, {user?.username}</span>
                        </motion.div>
                        <motion.div
                             initial={{ opacity: 0, x: -20 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: 0.1 }}
                        >
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                                Server <span className="text-primary">Zentrale</span>
                            </h1>
                            <p className="text-muted-foreground text-lg font-medium opacity-70 mt-2">
                                Wähle einen Server aus, um die ManagerX Suite zu konfigurieren.
                            </p>
                        </motion.div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative group w-full md:w-80"
                    >
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Server suchen..."
                            className="bg-white/5 border-white/10 h-14 pl-12 rounded-2xl focus:border-primary/50 transition-all text-base"
                        />
                    </motion.div>
                </div>

                {/* Grid of Servers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGuilds.map((guild, index) => (
                        <motion.div
                            key={guild.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                        >
                            <Card 
                                onClick={() => handleSelect(guild.id)}
                                className="group relative glass border-white/10 hover:border-primary/40 shadow-2xl rounded-[2.5rem] overflow-hidden cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-8 relative">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-primary/20 transition-all">
                                            {guild.icon ? (
                                                <img 
                                                    src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256`} 
                                                    alt={guild.name} 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="text-2xl font-black text-white/20">{guild.name.charAt(0)}</div>
                                            )}
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <ChevronRight className="w-5 h-5 text-primary" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold text-white tracking-tight truncate group-hover:text-primary transition-colors">
                                            {guild.name}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                                            <div className="flex items-center gap-1.5">
                                                <Shield className="w-3.5 h-3.5 text-primary/40" />
                                                <span>Admin Access</span>
                                            </div>
                                            {/* You could add member count here if the API provides it */}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}

                    {/* Invite Button Card */}
                    <motion.a
                        href="https://discord.com/oauth2/authorize?client_id=1368201272624287754&permissions=1669118160151&integration_type=0&scope=bot"
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="group"
                    >
                        <Card className="h-full border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-primary/40 shadow-none rounded-[2.5rem] overflow-hidden cursor-pointer transition-all border-2">
                            <CardContent className="h-full p-8 flex flex-col items-center justify-center text-center space-y-4 py-12">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform border border-primary/20">
                                    <Plus className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Bot einladen</h3>
                                    <p className="text-sm text-muted-foreground">Füge ManagerX einem weiteren Server hinzu.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.a>
                </div>

                {filteredGuilds.length === 0 && search && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                            <Server className="w-8 h-8 text-muted-foreground opacity-30" />
                        </div>
                        <h3 className="text-2xl font-bold text-white opacity-40 italic">Keine passenden Server gefunden...</h3>
                    </motion.div>
                )}
            </div>

            {/* Sticky Footer */}
            <div className="mt-auto pt-20 pb-10 w-full text-center opacity-30">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white">ManagerX Engine v2.0.0 Stable</p>
            </div>
        </div>
    );
}
