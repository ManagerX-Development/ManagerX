/// <reference types="vite/client" />
import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { SEO } from "../components/SEO";
import { Trophy, Medal, Crown, MessageSquare, Mic, Zap, TrendingUp, Search } from "lucide-react";
import { cn } from "../lib/utils";

interface LeaderboardUser {
    user_id: string;
    username: string;
    avatar_url: string | null;
    level: number;
    xp: number;
    messages: number;
    voice_minutes: number;
}

import { API_URL } from "../lib/api";

export const LeaderboardPage = memo(function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch(`${API_URL}/v1/managerx/leaderboard`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setLeaderboard(data.leaderboard);
                    }
                }
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const filteredLeaderboard = leaderboard.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const PodiumCard = ({ user, rank, delay }: { user: LeaderboardUser, rank: number, delay: number }) => {
        const isFirst = rank === 1;
        const Icon = isFirst ? Crown : (rank === 2 ? Medal : Medal);
        const colorClass = isFirst ? "from-yellow-400 to-yellow-600" : (rank === 2 ? "from-slate-300 to-slate-500" : "from-amber-600 to-amber-800");
        const borderColor = isFirst ? "border-yellow-500/50" : (rank === 2 ? "border-slate-400/50" : "border-amber-700/50");

        return (
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay }}
                className={cn(
                    "relative flex flex-col items-center p-8 rounded-[2.5rem] glass border border-white/5 group overflow-hidden",
                    isFirst ? "md:-translate-y-8 z-20 scale-110" : "z-10",
                    borderColor
                )}
            >
                {/* Glow Effect */}
                <div className={cn("absolute -top-24 w-48 h-48 blur-[80px] rounded-full opacity-20", isFirst ? "bg-yellow-500" : (rank === 2 ? "bg-slate-400" : "bg-amber-800"))} />
                
                <div className="relative mb-6">
                    <div className={cn("w-24 h-24 rounded-full p-1 bg-gradient-to-br", colorClass)}>
                        <div className="w-full h-full rounded-full overflow-hidden bg-[#0a0c10] border-4 border-[#0a0c10]">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5 text-2xl font-black">
                                    {user.username[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={cn("absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center shadow-xl text-white", colorClass)}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>

                <div className="text-center relative z-10">
                    <h3 className="text-xl font-black text-white truncate max-w-[150px] mb-1">{user.username}</h3>
                    <div className="flex items-center justify-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-4">
                        <Zap className="w-3 h-3" />
                        Level {user.level}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">XP</p>
                            <p className="text-sm font-bold text-white">{user.xp.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Msgs</p>
                            <p className="text-sm font-bold text-white">{user.messages.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-300 flex flex-col font-sans selection:bg-primary/30">
            <SEO
                title="Global Leaderboard"
                description="Die globalen Top-User von ManagerX. Sieh dir an, wer das Netzwerk dominiert."
            />
            <Navbar />

            <main className="flex-grow container mx-auto px-4 pt-48 pb-24">
                <header className="max-w-4xl mx-auto text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-center gap-4 text-primary mb-6"
                    >
                        <Trophy className="w-6 h-6 text-primary animate-bounce" />
                        <span className="text-xs font-black uppercase tracking-[0.4em]">Globale Rangliste</span>
                    </motion.div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.9] mb-8">
                        Die <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">Legenden</span>
                    </h1>
                    <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        Wer sind die aktivsten Nutzer im gesamten ManagerX Netzwerk? Hier findest du die Top 50 unserer Community.
                    </p>
                </header>

                {!loading && leaderboard.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto mb-32 px-4">
                        {leaderboard.length >= 2 ? (
                            <PodiumCard user={leaderboard[1]} rank={2} delay={0.2} />
                        ) : <div className="hidden md:block" />}
                        
                        {leaderboard.length >= 1 && (
                            <PodiumCard user={leaderboard[0]} rank={1} delay={0.1} />
                        )}
                        
                        {leaderboard.length >= 3 ? (
                            <PodiumCard user={leaderboard[2]} rank={3} delay={0.3} />
                        ) : <div className="hidden md:block" />}
                    </div>
                )}

                <div className="max-w-5xl mx-auto">
                    {/* Search Bar */}
                    <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input 
                                type="text"
                                placeholder="Suche nach Legenden..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 transition-all font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className="text-xs font-black uppercase text-primary">Top 50 Aktiv</span>
                        </div>
                    </div>

                    <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
                        {loading ? (
                            <div className="p-24 text-center">
                                <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Synchronisiere Daten...</p>
                            </div>
                        ) : (
                            <>
                                {filteredLeaderboard.length > 3 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Rang</th>
                                                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-muted-foreground">User</th>
                                                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Level</th>
                                                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Aktivität</th>
                                                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-right font-mono">XP</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                <AnimatePresence>
                                                    {filteredLeaderboard.slice(3).map((user, idx) => (
                                                        <motion.tr 
                                                            key={user.user_id}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="group hover:bg-white/[0.02] transition-colors"
                                                        >
                                                            <td className="px-8 py-6">
                                                                <span className="text-sm font-black text-slate-500 group-hover:text-primary transition-colors">#{idx + 4}</span>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                                                                        {user.avatar_url ? (
                                                                            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-xs font-black">
                                                                                {user.username[0].toUpperCase()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform inline-block">{user.username}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-sm font-black text-white">Lvl {user.level}</span>
                                                                    <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, (user.xp % 1000) / 10)}%` }} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                                                                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
                                                                        <MessageSquare className="w-3.5 h-3.5 text-primary opacity-70" />
                                                                        {user.messages.toLocaleString()}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
                                                                        <Mic className="w-3.5 h-3.5 text-accent opacity-70" />
                                                                        {user.voice_minutes.toLocaleString()}m
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-right font-mono text-sm font-bold text-primary">
                                                                {user.xp.toLocaleString()}
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </AnimatePresence>
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    filteredLeaderboard.length === 0 ? (
                                        <div className="p-24 text-center">
                                            <p className="text-slate-500 font-medium">Keine Legenden mit diesem Namen gefunden.</p>
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center">
                                            <p className="text-slate-400 font-medium italic">Alle aktuellen Legenden sind bereits auf dem Treppchen zu bewundern!</p>
                                        </div>
                                    )
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
});

export default LeaderboardPage;
