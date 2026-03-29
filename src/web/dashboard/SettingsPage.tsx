import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Settings,
    Shield,
    Palette,
    Bell,
    Save,
    ChevronLeft,
    Moon,
    Sun,
    Monitor,
    Globe,
    Trophy,
    ClipboardList,
    ShieldCheck,
    Trash2,
    LayoutDashboard,
    Sparkles,
    Zap,
    Heart,
    Lock,
    Search,
    Mic
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { Button } from "../components/ui/button";
import AutoRoleSettings from "../components/AutoRoleSettings";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Toaster, toast } from "sonner";
import { cn } from "../lib/utils";
import WelcomeSettings from "../components/WelcomeSettings";
import AntiSpamSettings from "../components/AntiSpamSettings";
import GlobalChatSettings from "../components/GlobalChatSettings";
import LevelSettings from "../components/LevelSettings";
import LoggingSettings from "../components/LoggingSettings";
import AutoDeleteSettings from "../components/AutoDeleteSettings";
import TempVCSettings from "../components/TempVCSettings";
import GuildSelector from "../components/GuildSelector";
import OverviewSettings from "../components/OverviewSettings";

const CategoryHeader = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 px-4 mt-6 mb-2">{children}</h3>
);

export default function SettingsPage() {
    const { token, selectedGuildId } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [guildData, setGuildData] = useState<{ channels: any[], roles: any[], categories: any[], voiceChannels: any[] }>({
        channels: [],
        roles: [],
        categories: [],
        voiceChannels: []
    });

    const guildId = selectedGuildId;

    // Form States
    const [botName, setBotName] = useState("ManagerX");
    const [prefix, setPrefix] = useState("!");
    const [autoMod, setAutoMod] = useState(true);
    const [welcomeMessage, setWelcomeMessage] = useState(false);
    const [theme, setTheme] = useState("dark");
    const [language, setLanguage] = useState("de");
    const [userRoleId, setUserRoleId] = useState<string | null>(null);
    const [teamRoleId, setTeamRoleId] = useState<string | null>(null);

    const [stats, setStats] = useState<any>(null);

    React.useEffect(() => {
        const fetchAllData = async () => {
            if (!token || !guildId) return;
            setIsLoading(true);
            try {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';

                // Fetch EVERYTHING in ONE call
                const res = await fetch(`${baseUrl}/dashboard/guilds/${guildId}/mega-data`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && json.data) {
                        const { settings, metadata, stats: guildStats } = json.data;
                        
                        // Set General Settings
                        setBotName(settings.bot_name || "ManagerX");
                        setPrefix(settings.prefix || "!");
                        setAutoMod(settings.auto_mod ?? true);
                        setWelcomeMessage(settings.welcome_message ?? false);
                        setLanguage(settings.language || "de");
                        setUserRoleId(settings.user_role_id || null);
                        setTeamRoleId(settings.team_role_id || null);

                        // Set Guild Metadata
                        setGuildData({
                            channels: metadata.channels || [],
                            roles: metadata.roles || [],
                            categories: metadata.categories || [],
                            voiceChannels: metadata.voice_channels || []
                        });

                        // Set Stats
                        setStats(guildStats);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch consolidated dashboard data", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, [token, guildId]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';
            const apiUrl = `${baseUrl}/dashboard/settings/${guildId}`;

            const payload = { prefix, autoMod, welcomeMessage, language, user_role_id: userRoleId, team_role_id: teamRoleId };

            const res = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("API error");

            toast.success("Einstellungen erfolgreich gespeichert!", {
                description: "Alle Änderungen wurden auf dem Server übernommen.",
            });
        } catch (e) {
            console.error("Save error:", e);
            toast.error("Fehler beim Speichern der Einstellungen.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8 relative overflow-hidden flex flex-col items-center">
            <Toaster theme="dark" position="bottom-right" />

            {/* Premium Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full pointer-events-none -mr-40 -mt-40" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 blur-[120px] rounded-full pointer-events-none -ml-40 -mb-40" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.05)_0%,transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.02] grid-pattern pointer-events-none" />

            <div className="w-full max-w-7xl relative z-10 space-y-8 mt-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                    <div className="flex items-center gap-6">
                        <Link to="/">
                            <Button variant="outline" size="icon" className="group rounded-2xl w-14 h-14 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all shadow-xl shadow-black/20">
                                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit">
                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">ManagerX Suite</span>
                            </div>
                            <h1 className="text-5xl font-extrabold tracking-tighter text-white">System <span className="text-primary">Control</span></h1>
                            <p className="text-muted-foreground text-sm font-medium opacity-70">Konfiguriere deine Bot-Instanz bis ins kleinste Detail.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-xl">
                        <GuildSelector />
                        <div className="w-px h-8 bg-white/10 mx-2" />
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="rounded-2xl px-8 h-12 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/30 transition-all hover:scale-[1.05] active:scale-[0.95] font-bold"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </motion.div>

                {/* Main Content Layout */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col lg:flex-row gap-10">
                        {/* Sidebar Navigation */}
                        <aside className="w-full lg:w-72 shrink-0">
                            <div className="glass rounded-[2rem] border border-white/10 p-4 sticky top-8 shadow-2xl">
                                <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1 items-stretch">
                                    <TabItem value="overview" icon={LayoutDashboard} label="Dashboard" />
                                    
                                    <div className="mt-6 mb-2 px-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Core Suite</span>
                                    </div>
                                    <TabItem value="general" icon={Settings} label="Zentrale" />
                                    <TabItem value="appearance" icon={Palette} label="Design & Theme" />
                                    <TabItem value="notifications" icon={Bell} label="Alerts & Logs" />

                                    <div className="mt-6 mb-2 px-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Engagement</span>
                                    </div>
                                    <TabItem value="levels" icon={Trophy} label="Level System" />
                                    <TabItem value="welcome" icon={Heart} label="Welcome Suite" />

                                    <div className="mt-6 mb-2 px-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Protection</span>
                                    </div>
                                    <TabItem value="antispam" icon={Zap} label="Anti-Spam AI" />
                                    <TabItem value="logging" icon={ClipboardList} label="Advanced Audit" />

                                    <div className="mt-6 mb-2 px-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Expansion</span>
                                    </div>
                                    <TabItem value="globalchat" icon={Globe} label="Global Network" />
                                    <TabItem value="autorole" icon={ShieldCheck} label="Auto-Roles" />
                                    <TabItem value="autodelete" icon={Trash2} label="Auto-Delete" />
                                    <TabItem value="tempvc" icon={Mic} label="TempVC Suite" />
                                </TabsList>
                            </div>
                        </aside>

                        {/* Setting Panels */}
                        <div className="flex-1 min-w-0 pb-20">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                >
                                    <TabsContent value="overview" className="mt-0 outline-none">
                                        {guildId ? <OverviewSettings guildId={guildId} initialStats={stats} settings={{ auto_mod: autoMod, welcome_message: welcomeMessage }} /> : <NoGuildPlaceholder />}
                                    </TabsContent>

                                    <TabsContent value="general" className="mt-0 outline-none">
                                        <Card className="glass border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                                            <CardHeader className="pb-8 pt-10 px-10">
                                                <CardTitle className="text-3xl font-bold tracking-tight">Bot-Zentrale</CardTitle>
                                                <CardDescription className="text-base text-muted-foreground/70">Wichtige Kern-Identität deiner Bot-Instanz.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-10 px-10 pb-10">
                                                <div className="space-y-4">
                                                    <Label htmlFor="bot-name" className="text-sm font-bold uppercase tracking-widest text-primary">Branding Name</Label>
                                                    <div className="relative group">
                                                        <Input
                                                            id="bot-name"
                                                            value={botName}
                                                            onChange={(e) => setBotName(e.target.value)}
                                                            className="bg-white/5 border-white/10 focus:border-primary/50 h-14 rounded-2xl text-lg pl-6 transition-all"
                                                            placeholder="ManagerX"
                                                        />
                                                        <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <Label htmlFor="prefix" className="text-sm font-bold uppercase tracking-widest text-primary">Command Prefix</Label>
                                                    <div className="flex gap-4">
                                                        <div className="relative group">
                                                            <Input
                                                                id="prefix"
                                                                value={prefix}
                                                                onChange={(e) => setPrefix(e.target.value)}
                                                                className="bg-white/5 border-white/10 focus:border-primary/50 h-14 w-28 text-center font-mono text-2xl rounded-2xl transition-all"
                                                                maxLength={3}
                                                            />
                                                            <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                        </div>
                                                        <div className="flex-1 flex items-center px-6 rounded-2xl border border-white/10 bg-white/5 text-sm md:text-base font-medium text-muted-foreground">
                                                            Beispiel: <span className="text-white font-mono ml-2 font-bold">{prefix}help</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                                    <div className="space-y-4">
                                                        <Label className="text-sm font-bold uppercase tracking-widest text-primary">Team Rolle</Label>
                                                        <select 
                                                            value={teamRoleId || ""} 
                                                            onChange={(e) => setTeamRoleId(e.target.value || null)}
                                                            className="w-full bg-white/5 border border-white/10 focus:border-primary/50 h-14 rounded-2xl px-6 text-white transition-all appearance-none outline-none"
                                                        >
                                                            <option value="" className="bg-[#1a1a1a]">Keine Rolle ausgewählt</option>
                                                            {guildData.roles.map(role => (
                                                                <option key={role.id} value={role.id} className="bg-[#1a1a1a]">{role.name}</option>
                                                            ))}
                                                        </select>
                                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Mitglieder mit dieser Rolle werden als Staff im Dashboard angezeigt.</p>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label className="text-sm font-bold uppercase tracking-widest text-primary">User Rolle</Label>
                                                        <select 
                                                            value={userRoleId || ""} 
                                                            onChange={(e) => setUserRoleId(e.target.value || null)}
                                                            className="w-full bg-white/5 border border-white/10 focus:border-primary/50 h-14 rounded-2xl px-6 text-white transition-all appearance-none outline-none"
                                                        >
                                                            <option value="" className="bg-[#1a1a1a]">Keine Rolle ausgewählt</option>
                                                            {guildData.roles.map(role => (
                                                                <option key={role.id} value={role.id} className="bg-[#1a1a1a]">{role.name}</option>
                                                            ))}
                                                        </select>
                                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Benutzer mit dieser Rolle werden im User-Quick-View angezeigt.</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="appearance" className="mt-0 outline-none">
                                        <Card className="glass border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
                                            <CardHeader className="pb-8 pt-10 px-10">
                                                <CardTitle className="text-3xl font-bold tracking-tight">Interface Design</CardTitle>
                                                <CardDescription className="text-base">Passe das Dashboard deinem Geschmack an.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="px-10 pb-10">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <ThemeCard title="Light" active={theme === 'light'} onClick={() => setTheme("light")} icon={Sun} />
                                                    <ThemeCard title="Dark" active={theme === 'dark'} onClick={() => setTheme("dark")} icon={Moon} />
                                                    <ThemeCard title="System" active={theme === 'system'} onClick={() => setTheme("system")} icon={Monitor} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="levels" className="mt-0 outline-none">
                                        {guildId ? <LevelSettings guildId={guildId} channels={guildData.channels} /> : <NoGuildPlaceholder />}
                                    </TabsContent>

                                    <TabsContent value="welcome" className="mt-0 outline-none">
                                        {guildId ? <WelcomeSettings guildId={guildId} /> : <NoGuildPlaceholder />}
                                    </TabsContent>

                                    <TabsContent value="antispam" className="mt-0 outline-none">
                                        {guildId ? <AntiSpamSettings guildId={guildId} /> : <NoGuildPlaceholder />}
                                    </TabsContent>

                                    <TabsContent value="logging" className="mt-0 outline-none">
                                        {guildId ? <LoggingSettings guildId={guildId} channels={guildData.channels} /> : <NoGuildPlaceholder />}
                                    </TabsContent>

                                    <TabsContent value="globalchat" className="mt-0 outline-none">
                                        {guildId ? <GlobalChatSettings guildId={guildId} /> : <NoGuildPlaceholder />}
                                    </TabsContent>

                                    <TabsContent value="autorole" className="mt-0 outline-none">
                                        {guildId ? <AutoRoleSettings guildId={guildId} roles={guildData.roles} /> : <NoGuildPlaceholder />}
                                    </TabsContent>

                                    <TabsContent value="autodelete" className="mt-0 outline-none">
                                        {guildId ? <AutoDeleteSettings guildId={guildId} channels={guildData.channels} /> : <NoGuildPlaceholder />}
                                    </TabsContent>

                                    <TabsContent value="tempvc" className="mt-0 outline-none">
                                        {guildId ? (
                                            <TempVCSettings
                                                guildId={guildId}
                                                categories={guildData.categories}
                                                voiceChannels={guildData.voiceChannels}
                                            />
                                        ) : <NoGuildPlaceholder />}
                                    </TabsContent>

                                    <TabsContent value="notifications" className="mt-0 outline-none">
                                        <Card className="glass border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
                                            <div className="flex flex-col items-center justify-center py-24 text-center px-10">
                                                <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 shadow-2xl">
                                                    <Lock className="w-10 h-10 text-primary animate-pulse" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-white mb-3">Enterprise Feature</h3>
                                                <p className="text-muted-foreground opacity-70 max-w-sm leading-relaxed">
                                                    Coming Soon: Webhooks, Email-Alerts und Mobile Push Notifications für maximale Sicherheit.
                                                </p>
                                            </div>
                                        </Card>
                                    </TabsContent>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </Tabs>
            </div>

            {/* Dedicated Footer */}
            <div className="mt-auto pt-10 pb-10 w-full text-center opacity-30 border-t border-white/5 flex flex-col items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-white">© 2026 OPPRO.NET DEVELOPMENT</p>
                <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Powered by ManagerX Engine</span>
                </div>
            </div>
        </div>
    );
}

// Helper Components
const TabItem = ({ value, icon: Icon, label }: { value: string, icon: any, label: string }) => (
    <TabsTrigger
        value={value}
        className="data-[state=active]:bg-primary data-[state=active]:text-white shadow-none justify-start gap-4 px-5 py-3.5 rounded-2xl hover:bg-white/5 transition-all text-muted-foreground font-bold group"
    >
        <Icon className="w-5 h-5 group-data-[state=active]:text-white text-muted-foreground transition-colors" />
        {label}
    </TabsTrigger>
);

const ThemeCard = ({ title, active, onClick, icon: Icon }: { title: string, active: boolean, onClick: () => void, icon: any }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex flex-col items-center justify-center p-10 rounded-[2.5rem] border-2 transition-all duration-300 relative group",
            active
                ? "border-primary bg-primary/20 shadow-[0_0_50px_-12px_rgba(220,38,38,0.4)]"
                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
        )}
    >
        <Icon className={cn("w-12 h-12 mb-6 transition-all duration-300", active ? "text-primary scale-110" : "text-white/40 group-hover:text-white")} />
        <span className={cn("font-bold text-lg", active ? "text-white" : "text-white/60 group-hover:text-white")}>{title}</span>
        {active && <motion.div layoutId="active-theme" className="absolute -top-3 -right-3 bg-primary p-2 rounded-xl shadow-xl"><Shield className="w-4 h-4 text-white" /></motion.div>}
    </button>
);

const NoGuildPlaceholder = () => (
    <Card className="glass border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardContent className="py-24 text-center px-10">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <LayoutDashboard className="w-10 h-10 text-muted-foreground opacity-30" />
            </div>
            <p className="text-xl text-muted-foreground font-bold italic">Bitte wähle zuerst einen Server aus...</p>
        </CardContent>
    </Card>
);
