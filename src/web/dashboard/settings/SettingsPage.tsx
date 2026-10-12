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
    Mic,
    Brain,
    Radio,
    Bot,
    Server,
    ChevronRight,
    CheckCircle2,
    Home
} from "lucide-react";
import { useAuth } from "../../components/core/AuthProvider";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { cn } from "../../lib/utils";
import { lazy, Suspense } from "react";
import GuildSelector from "../../components/layout/GuildSelector";
const AutoRoleSettings = lazy(() => import("../../components/settings/AutoRoleSettings"));
const WelcomeSettings = lazy(() => import("../../components/settings/WelcomeSettings"));
const AntiSpamSettings = lazy(() => import("../../components/settings/AntiSpamSettings"));
const GlobalChatSettings = lazy(() => import("../../components/settings/GlobalChatSettings"));
const LevelSettings = lazy(() => import("../../components/settings/LevelSettings"));
const LoggingSettings = lazy(() => import("../../components/settings/LoggingSettings"));
const AutoDeleteSettings = lazy(() => import("../../components/settings/AutoDeleteSettings"));
const TempVCSettings = lazy(() => import("../../components/settings/TempVCSettings"));
const OverviewSettings = lazy(() => import("../../components/settings/OverviewSettings"));
const AutoResponderSettings = lazy(() => import("../../components/settings/AutoResponderSettings"));
const NewsSyncSettings = lazy(() => import("../../components/settings/NewsSyncSettings"));
const ApplicationSettings = lazy(() => import("../../components/settings/ApplicationSettings"));

import { API_URL } from "../../lib/api";
import { toast, Toaster } from "sonner";

const TabLoader = () => (
    <div className="w-full flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Lade Modul...</p>
        </div>
    </div>
);

// Navigation sections
const navSections = [
    {
        label: null,
        items: [
            { value: "overview", icon: LayoutDashboard, label: "Dashboard", badge: null }
        ]
    },
    {
        label: "Core Suite",
        items: [
            { value: "general", icon: Settings, label: "Zentrale", badge: null },
            { value: "appearance", icon: Palette, label: "Design & Theme", badge: null },
            { value: "notifications", icon: Bell, label: "Alerts & Logs", badge: "Soon" },
        ]
    },
    {
        label: "Engagement",
        items: [
            { value: "levels", icon: Trophy, label: "Level System", badge: null },
            { value: "welcome", icon: Heart, label: "Welcome Suite", badge: null },
        ]
    },
    {
        label: "Protection",
        items: [
            { value: "antispam", icon: Zap, label: "Anti-Spam AI", badge: null },
            { value: "logging", icon: ClipboardList, label: "Advanced Audit", badge: null },
        ]
    },
    {
        label: "Expansion",
        items: [
            { value: "globalchat", icon: Globe, label: "Global Network", badge: null },
            { value: "autorole", icon: ShieldCheck, label: "Auto-Roles", badge: null },
            { value: "autodelete", icon: Trash2, label: "Auto-Delete", badge: null },
            { value: "tempvc", icon: Mic, label: "TempVC Suite", badge: null },
        ]
    },
    {
        label: "Management",
        items: [
            { value: "autoresponder", icon: Brain, label: "Auto-Responder", badge: null },
            { value: "newssync", icon: Radio, label: "News-Network", badge: null },
            { value: "applications", icon: ClipboardList, label: "Bewerbungen", badge: null },
        ]
    }
];

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
                const res = await fetch(`${API_URL}/dashboard/guilds/${guildId}/mega-data`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && json.data) {
                        const { settings, metadata, stats: guildStats } = json.data;
                        setBotName(settings.bot_name || "ManagerX");
                        setPrefix(settings.prefix || "!");
                        setAutoMod(settings.auto_mod ?? true);
                        setWelcomeMessage(settings.welcome_message ?? false);
                        setLanguage(settings.language || "de");
                        setUserRoleId(settings.user_role_id || null);
                        setTeamRoleId(settings.team_role_id || null);
                        setGuildData({
                            channels: metadata.channels || [],
                            roles: metadata.roles || [],
                            categories: metadata.categories || [],
                            voiceChannels: metadata.voice_channels || []
                        });
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
            const res = await fetch(`${API_URL}/dashboard/settings/${guildId}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ prefix, autoMod, welcomeMessage, language, user_role_id: userRoleId, team_role_id: teamRoleId })
            });
            if (!res.ok) throw new Error("API error");
            toast.success("Einstellungen gespeichert!", { description: "Alle Änderungen wurden übernommen." });
        } catch (e) {
            toast.error("Fehler beim Speichern.");
        } finally {
            setIsLoading(false);
        }
    };

    // Find active section label for breadcrumb
    const activeItem = navSections.flatMap(s => s.items).find(i => i.value === activeTab);

    return (
        <div className="min-h-screen bg-[#030305] text-white relative overflow-hidden">
            <Toaster theme="dark" position="bottom-right" />

            {/* Ambient bg */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full bg-red-600/[0.06] blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-5%] w-[500px] h-[500px] rounded-full bg-red-900/[0.04] blur-[100px]" />
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
                        backgroundSize: "60px 60px"
                    }}
                />
            </div>

            <div className="relative z-10 flex min-h-screen">
                {/* SIDEBAR */}
                <motion.aside
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden lg:flex flex-col w-72 shrink-0 border-r border-white/[0.06] bg-white/[0.015] backdrop-blur-xl"
                >
                    {/* Brand */}
                    <div className="p-6 border-b border-white/[0.06]">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-red-700 flex items-center justify-center shadow-lg shadow-primary/30">
                                <Bot className="w-4.5 h-4.5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60">ManagerX</p>
                                <p className="text-sm font-bold text-white/80 -mt-0.5">Control Panel</p>
                            </div>
                        </div>
                    </div>

                    {/* Guild Selector */}
                    <div className="p-4 border-b border-white/[0.06]">
                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/20 mb-2 px-1">Aktiver Server</p>
                        <GuildSelector />
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                        {navSections.map((section, si) => (
                            <div key={si} className={si > 0 ? "pt-4" : ""}>
                                {section.label && (
                                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/20 px-3 mb-2">
                                        {section.label}
                                    </p>
                                )}
                                {section.items.map(item => (
                                    <SidebarItem
                                        key={item.value}
                                        {...item}
                                        active={activeTab === item.value}
                                        onClick={() => setActiveTab(item.value)}
                                    />
                                ))}
                            </div>
                        ))}
                    </nav>

                    {/* Bottom CTA */}
                    <div className="p-4 border-t border-white/[0.06]">
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2.5 h-12 rounded-2xl bg-gradient-to-r from-primary to-red-700 hover:from-red-600 hover:to-primary text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Speichern
                        </button>
                    </div>
                </motion.aside>

                {/* MAIN CONTENT */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Top Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-4 bg-[#030305]/80 backdrop-blur-xl border-b border-white/[0.06]"
                    >
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-sm">
                            <Link to="/">
                                <button className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] transition-all">
                                    <ChevronLeft className="w-4 h-4 text-white/50" />
                                </button>
                            </Link>
                            <ChevronRight className="w-3 h-3 text-white/20" />
                            <span className="text-white/30 font-medium">Dashboard</span>
                            <ChevronRight className="w-3 h-3 text-white/20" />
                            <span className="text-white font-bold">{activeItem?.label}</span>
                        </div>

                        {/* Mobile Guild + Save */}
                        <div className="flex items-center gap-3 lg:hidden">
                            <GuildSelector />
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="flex items-center gap-2 h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/30"
                            >
                                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                                Save
                            </button>
                        </div>

                        {/* Desktop Save */}
                        <div className="hidden lg:flex items-center gap-3">
                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-emerald-500/80">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Änderungen aktiv
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="flex items-center gap-2 h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/30"
                            >
                                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                                Speichern
                            </button>
                        </div>
                    </motion.div>

                    {/* Mobile Sidebar Nav */}
                    <div className="lg:hidden overflow-x-auto border-b border-white/[0.06] bg-white/[0.01]">
                        <div className="flex gap-1 p-3 min-w-max">
                            {navSections.flatMap(s => s.items).map(item => (
                                <button
                                    key={item.value}
                                    onClick={() => setActiveTab(item.value)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all",
                                        activeTab === item.value
                                            ? "bg-primary text-white shadow-lg shadow-primary/30"
                                            : "text-white/40 hover:text-white/70 hover:bg-white/5"
                                    )}
                                >
                                    <item.icon className="w-3.5 h-3.5" />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 p-6 md:p-8 pb-24">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                            >
                                <Suspense fallback={<TabLoader />}>
                                    {/* Overview */}
                                    {activeTab === "overview" && (
                                        guildId ? <OverviewSettings guildId={guildId} initialStats={stats} settings={{ auto_mod: autoMod, welcome_message: welcomeMessage }} /> : <NoGuildPlaceholder />
                                    )}

                                    {/* General */}
                                    {activeTab === "general" && (
                                        <div className="space-y-6 max-w-2xl">
                                            <SectionHeader title="Bot-Zentrale" desc="Kern-Identität deiner Bot-Instanz." />
                                            <PanelCard>
                                                <FieldGroup label="Branding Name" hint="Angezeigter Name des Bots in Commands.">
                                                    <StyledInput
                                                        id="bot-name"
                                                        value={botName}
                                                        onChange={(e) => setBotName(e.target.value)}
                                                        placeholder="ManagerX"
                                                    />
                                                </FieldGroup>
                                                <FieldGroup label="Command Prefix" hint={`Beispiel: ${prefix}help`}>
                                                    <div className="flex gap-3">
                                                        <StyledInput
                                                            id="prefix"
                                                            value={prefix}
                                                            onChange={(e) => setPrefix(e.target.value)}
                                                            className="w-24 text-center font-mono text-2xl"
                                                            maxLength={3}
                                                        />
                                                        <div className="flex-1 flex items-center px-5 rounded-2xl border border-white/[0.07] bg-white/[0.03] text-sm font-medium text-white/40 font-mono">
                                                            {prefix}help · {prefix}ban · {prefix}kick
                                                        </div>
                                                    </div>
                                                </FieldGroup>
                                                <div className="grid md:grid-cols-2 gap-6 pt-2">
                                                    <FieldGroup label="Team Rolle" hint="Staff-Mitglieder im Dashboard.">
                                                        <StyledSelect value={teamRoleId || ""} onChange={(e) => setTeamRoleId(e.target.value || null)}>
                                                            <option value="" className="bg-[#0a0a0a]">Keine Rolle</option>
                                                            {guildData.roles.map(role => (
                                                                <option key={role.id} value={role.id} className="bg-[#0a0a0a]">{role.name}</option>
                                                            ))}
                                                        </StyledSelect>
                                                    </FieldGroup>
                                                    <FieldGroup label="User Rolle" hint="Benutzer im Quick-View.">
                                                        <StyledSelect value={userRoleId || ""} onChange={(e) => setUserRoleId(e.target.value || null)}>
                                                            <option value="" className="bg-[#0a0a0a]">Keine Rolle</option>
                                                            {guildData.roles.map(role => (
                                                                <option key={role.id} value={role.id} className="bg-[#0a0a0a]">{role.name}</option>
                                                            ))}
                                                        </StyledSelect>
                                                    </FieldGroup>
                                                </div>
                                            </PanelCard>
                                        </div>
                                    )}

                                    {/* Appearance */}
                                    {activeTab === "appearance" && (
                                        <div className="space-y-6 max-w-2xl">
                                            <SectionHeader title="Interface Design" desc="Passe das Dashboard deinem Geschmack an." />
                                            <PanelCard>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <ThemeCard title="Light" active={theme === 'light'} onClick={() => setTheme("light")} icon={Sun} />
                                                    <ThemeCard title="Dark" active={theme === 'dark'} onClick={() => setTheme("dark")} icon={Moon} />
                                                    <ThemeCard title="System" active={theme === 'system'} onClick={() => setTheme("system")} icon={Monitor} />
                                                </div>
                                            </PanelCard>
                                        </div>
                                    )}

                                    {/* Notifications */}
                                    {activeTab === "notifications" && <ComingSoonPanel icon={Lock} title="Enterprise Feature" desc="Webhooks, Email-Alerts und Mobile Push Notifications — coming soon." />}

                                    {/* Feature tabs */}
                                    {activeTab === "levels" && (guildId ? <LevelSettings guildId={guildId} channels={guildData.channels} /> : <NoGuildPlaceholder />)}
                                    {activeTab === "welcome" && (guildId ? <WelcomeSettings guildId={guildId} /> : <NoGuildPlaceholder />)}
                                    {activeTab === "antispam" && (guildId ? <AntiSpamSettings guildId={guildId} /> : <NoGuildPlaceholder />)}
                                    {activeTab === "logging" && (guildId ? <LoggingSettings guildId={guildId} channels={guildData.channels} /> : <NoGuildPlaceholder />)}
                                    {activeTab === "globalchat" && (guildId ? <GlobalChatSettings guildId={guildId} /> : <NoGuildPlaceholder />)}
                                    {activeTab === "autorole" && (guildId ? <AutoRoleSettings guildId={guildId} roles={guildData.roles} /> : <NoGuildPlaceholder />)}
                                    {activeTab === "autodelete" && (guildId ? <AutoDeleteSettings guildId={guildId} channels={guildData.channels} /> : <NoGuildPlaceholder />)}
                                    {activeTab === "tempvc" && (guildId ? <TempVCSettings guildId={guildId} categories={guildData.categories} voiceChannels={guildData.voiceChannels} /> : <NoGuildPlaceholder />)}
                                    {activeTab === "autoresponder" && (guildId ? <AutoResponderSettings guildId={guildId} /> : <NoGuildPlaceholder />)}
                                    {activeTab === "newssync" && (guildId ? <NewsSyncSettings guildId={guildId} /> : <NoGuildPlaceholder />)}
                                    {activeTab === "applications" && (guildId ? <ApplicationSettings guildId={guildId} /> : <NoGuildPlaceholder />)}
                                </Suspense>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Helper Components ───────────────────────────────────────────────────────

const SidebarItem = ({ value, icon: Icon, label, badge, active, onClick }: {
    value: string; icon: any; label: string; badge: string | null; active: boolean; onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group relative",
            active
                ? "bg-primary/15 text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
        )}
    >
        {/* Active indicator */}
        {active && (
            <motion.div
                layoutId="sidebar-active"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary shadow-[0_0_8px_rgba(220,38,38,0.8)]"
            />
        )}
        <Icon className={cn("w-4 h-4 shrink-0 transition-colors", active ? "text-primary" : "text-white/30 group-hover:text-white/50")} />
        <span className="flex-1 text-left">{label}</span>
        {badge && (
            <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-[9px] font-black uppercase tracking-wider text-white/30">
                {badge}
            </span>
        )}
        {active && <ChevronRight className="w-3 h-3 text-primary/60 shrink-0" />}
    </button>
);

const SectionHeader = ({ title, desc }: { title: string; desc: string }) => (
    <div>
        <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
        <p className="text-white/40 text-sm mt-1 font-medium">{desc}</p>
    </div>
);

const PanelCard = ({ children }: { children: React.ReactNode }) => (
    <div className="p-7 rounded-3xl bg-white/[0.03] border border-white/[0.07] space-y-7">
        {children}
    </div>
);

const FieldGroup = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div className="space-y-2.5">
        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/70">{label}</label>
        {children}
        {hint && <p className="text-[10px] text-white/25 font-medium">{hint}</p>}
    </div>
);

const StyledInput = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        className={cn(
            "w-full h-13 px-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus:border-primary/40 text-white placeholder:text-white/20 outline-none transition-all duration-300 text-sm font-medium",
            className
        )}
        style={{ height: "3.25rem" }}
        {...props}
    />
);

const StyledSelect = ({ children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select
        className={cn(
            "w-full h-13 px-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus:border-primary/40 text-white outline-none transition-all duration-300 appearance-none text-sm font-medium",
            className
        )}
        style={{ height: "3.25rem" }}
        {...props}
    >
        {children}
    </select>
);

const ThemeCard = ({ title, active, onClick, icon: Icon }: { title: string; active: boolean; onClick: () => void; icon: any }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-300 relative group",
            active
                ? "border-primary bg-primary/10 shadow-[0_0_30px_-10px_rgba(220,38,38,0.5)]"
                : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.15]"
        )}
    >
        <Icon className={cn("w-10 h-10 mb-4 transition-all duration-300", active ? "text-primary scale-110" : "text-white/30 group-hover:text-white/60")} />
        <span className={cn("font-black text-base", active ? "text-white" : "text-white/40 group-hover:text-white/70")}>{title}</span>
        {active && (
            <motion.div layoutId="active-theme" className="absolute -top-2.5 -right-2.5 bg-primary p-1.5 rounded-xl shadow-lg shadow-primary/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </motion.div>
        )}
    </button>
);

const ComingSoonPanel = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
    <div className="max-w-2xl">
        <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-xl shadow-primary/10">
                <Icon className="w-10 h-10 text-primary/60" />
            </div>
            <div>
                <h3 className="text-xl font-black text-white/60 mb-2">{title}</h3>
                <p className="text-white/30 text-sm max-w-sm leading-relaxed">{desc}</p>
            </div>
        </div>
    </div>
);

const NoGuildPlaceholder = () => (
    <div className="max-w-2xl">
        <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
                <Server className="w-9 h-9 text-white/15" />
            </div>
            <div>
                <h3 className="text-xl font-black text-white/30 mb-2">Kein Server ausgewählt</h3>
                <p className="text-white/20 text-sm">Wähle zuerst einen Server über den Selektor aus.</p>
            </div>
        </div>
    </div>
);
