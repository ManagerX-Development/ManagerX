import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    User,
    Settings,
    Globe,
    Palette,
    Shield,
    Save,
    ChevronLeft,
    Sparkles,
    Zap,
    Heart,
    Star,
    Camera,
    Mail,
    Bell,
    Lock,
    BarChart3,
    MessageSquare,
    Trophy,
    Mic,
    Server,
    Flame,
    Calendar,
    Award,
    Activity,
    History
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Toaster, toast } from "sonner";
import { cn } from "../lib/utils";

export default function UserSettingsPage() {
    const { token, user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // User Settings state
    const [settings, setSettings] = useState({
        username: "",
        language: "de",
        globalStats: null as any,
        moderation: null as any,
        globalChat: null as any,
        topServers: [] as any[]
    });

    useEffect(() => {
        const fetchUserSettings = async () => {
            if (!token) return;
            setIsLoading(true);
            try {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';
                const res = await fetch(`${baseUrl}/dashboard/user/settings`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        setSettings({
                            username: data.data.username || "",
                            language: data.data.language || "de",
                            globalStats: data.data.global_stats,
                            moderation: data.data.moderation,
                            globalChat: data.data.global_chat,
                            topServers: data.data.top_servers || []
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to fetch user settings", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserSettings();
    }, [token]);

    const handleSave = async () => {
        if (!token) return;
        setIsSaving(true);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';
            const res = await fetch(`${baseUrl}/dashboard/user/settings`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ language: settings.language })
            });

            if (res.ok) {
                toast.success("Einstellungen gespeichert!");
            } else {
                throw new Error("Save failed");
            }
        } catch (e) {
            toast.error("Fehler beim Speichern der Einstellungen.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8 relative overflow-hidden flex flex-col items-center">
            <Toaster theme="dark" position="bottom-right" />

            {/* Premium Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full pointer-events-none -mr-40 -mt-40" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 blur-[120px] rounded-full pointer-events-none -ml-40 -mb-40" />

            <div className="w-full max-w-4xl relative z-10 space-y-8 mt-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                    <div className="flex items-center gap-6">
                        <Link to="/dash/settings">
                            <Button variant="outline" size="icon" className="group rounded-2xl w-14 h-14 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all shadow-xl shadow-black/20">
                                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit">
                                <Settings className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Global Settings</span>
                            </div>
                            <h1 className="text-5xl font-extrabold tracking-tighter text-white">User <span className="text-primary">Settings</span></h1>
                            <p className="text-muted-foreground text-sm font-medium opacity-70">Verwalte deine persönlichen Präferenzen im ManagerX Network.</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-2xl px-10 h-14 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/30 transition-all hover:scale-[1.05] active:scale-[0.95] font-bold"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        Save Changes
                    </Button>
                </motion.div>

                <div className="grid grid-cols-1 gap-10">
                    {/* Settings Form */}
                    <div className="space-y-8">
                        {/* Account Info */}
                        <Card className="glass border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-10 pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <User className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-bold">Account</CardTitle>
                                        <CardDescription>Angemeldet als {settings.username}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10 pt-4">
                                <div className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/10">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl">
                                        {user?.avatar ? (
                                            <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                                                {settings.username?.substring(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-bold text-white leading-none">{settings.username}</h2>
                                        <p className="text-muted-foreground text-sm font-medium opacity-70">Discord ID: {user?.id}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Global Statistics */}
                        {settings.globalStats && (
                            <Card className="glass border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="p-10 pb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <BarChart3 className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-bold">Global Statistics</CardTitle>
                                            <CardDescription>Deine Aktivitäten im gesamten ManagerX Network.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10 pt-4 space-y-8">
                                    {/* Level Progress */}
                                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 overflow-hidden relative">
                                       <div className="absolute top-0 right-0 p-6 opacity-10">
                                           <Sparkles className="w-16 h-16 text-primary" />
                                       </div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Global Level</span>
                                                <h3 className="text-4xl font-black text-white italic">Level {settings.globalStats.level}</h3>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total XP</span>
                                                <p className="text-xl font-bold text-white">{Math.floor(settings.globalStats.xp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                                <span className="text-slate-500">Progress to Level {settings.globalStats.level + 1}</span>
                                                <span className="text-primary">{Math.round((settings.globalStats.xp_progress / settings.globalStats.xp_needed) * 100)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div 
                                                   initial={{ width: 0 }}
                                                   animate={{ width: `${(settings.globalStats.xp_progress / settings.globalStats.xp_needed) * 100}%` }}
                                                   className="h-full bg-gradient-to-r from-primary to-accent rounded-full" 
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-right">
                                                {Math.floor(settings.globalStats.xp_needed - settings.globalStats.xp_progress).toLocaleString()} XP LEFT
                                            </p>
                                        </div>
                                    </div>

                                    {/* Simple Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1 group hover:border-primary/30 transition-colors">
                                            <MessageSquare className="w-4 h-4 text-primary mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <span className="text-2xl font-black text-white">{settings.globalStats.total_messages.toLocaleString()}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Messages</span>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1 group hover:border-primary/30 transition-colors">
                                            <Mic className="w-4 h-4 text-primary mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <span className="text-2xl font-black text-white">{Math.floor(settings.globalStats.total_voice_minutes).toLocaleString()}m</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Voice Time</span>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1 group hover:border-primary/30 transition-colors">
                                            <Server className="w-4 h-4 text-primary mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <span className="text-2xl font-black text-white">{settings.globalStats.total_servers}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Servers</span>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1 group hover:border-primary/30 transition-colors">
                                            <Flame className="w-4 h-4 text-primary mb-2 opacity-50 group-hover:opacity-100 transition-colors" />
                                            <span className="text-2xl font-black text-white">{settings.globalStats.daily_streak}d</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Streak</span>
                                        </div>
                                    </div>

                                    {/* Advanced Global Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <Calendar className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Mitglied seit</p>
                                                <p className="text-sm font-bold text-white">
                                                    {settings.globalStats.first_seen ? new Date(settings.globalStats.first_seen).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Unbekannt'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                                <Award className="w-5 h-5 text-accent" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Beste Streak</p>
                                                <p className="text-sm font-bold text-white">{settings.globalStats.best_streak || settings.globalStats.daily_streak} Tage</p>
                                            </div>
                                        </div>
                                    </div>


                                    {/* Achievements Preview */}
                                    {settings.globalStats.achievements && settings.globalStats.achievements.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Trophy className="w-4 h-4 text-primary" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Achievements ({settings.globalStats.achievements.length})</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {settings.globalStats.achievements.map((a: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-slate-300">
                                                        <span>{a.icon}</span>
                                                        <span>{a.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Moderation & Community */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Moderation Card */}
                            <Card className="glass border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="p-10 pb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                            <Shield className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-bold">Moderation</CardTitle>
                                            <CardDescription>Deine globale History.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10 pt-4 space-y-6">
                                    <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/10">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gesamt Verwarnungen</p>
                                            <h3 className={cn("text-4xl font-black", (settings.moderation?.total_warnings || 0) > 0 ? "text-red-500" : "text-green-500")}>
                                                {settings.moderation?.total_warnings || 0}
                                            </h3>
                                        </div>
                                        <div className="px-4 py-2 rounded-xl bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            {(settings.moderation?.total_warnings || 0) === 0 ? "Clean Record ✓" : "Achtung"}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                            <MessageSquare className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Global-Chat Nachrichten</p>
                                            <p className="text-lg font-bold text-white">{settings.globalChat?.total_messages?.toLocaleString() || 0}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Top Servers Card */}
                            <Card className="glass border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="p-10 pb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                                            <History className="w-6 h-6 text-yellow-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-bold">Top Server</CardTitle>
                                            <CardDescription>Deine aktivsten Communities.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10 pt-4 space-y-4">
                                    {settings.topServers && settings.topServers.length > 0 ? (
                                        settings.topServers.map((srv: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 group hover:border-yellow-500/30 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-yellow-500">
                                                        #{i + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white">Server ID: {srv.guild_id}</p>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Level {srv.level}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-yellow-500">{srv.xp.toLocaleString()} XP</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center space-y-2 opacity-50">
                                            <Activity className="w-8 h-8 mx-auto text-slate-500" />
                                            <p className="text-xs font-bold uppercase tracking-widest">Noch keine Level-Daten</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>


                        {/* Preferences */}
                        <Card className="glass border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-10 pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
                                        <Globe className="w-6 h-6 text-accent" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-bold">Präferenzen</CardTitle>
                                        <CardDescription>System-Einstellungen und Verhaltensweisen.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10 pt-4 space-y-10">
                                <div className="flex items-center justify-between group">
                                    <div className="space-y-1">
                                        <Label className="text-lg font-bold">System Sprache</Label>
                                        <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">Wähle deine bevorzugte Sprache für das Dashboard.</p>
                                    </div>
                                    <select
                                        className="bg-white/5 border border-white/10 rounded-xl px-6 h-12 text-white outline-none cursor-pointer hover:bg-white/10 transition-all font-bold"
                                        value={settings.language}
                                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                    >
                                        <option value="de" className="bg-[#1a1c1e]">Deutsch 🇩🇪</option>
                                        <option value="en" className="bg-[#1a1c1e]">English 🇬🇧</option>
                                    </select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-20 py-10 w-full text-center opacity-30 border-t border-white/5 flex flex-col items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-white">© 2026 OPPRO.NET DEVELOPMENT</p>
                <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">User Intelligence Module</span>
                </div>
            </div>
        </div>
    );
}
