/// <reference types="vite/client" />
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Users, MessageSquare, Zap, Activity, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import OverviewCharts from "./OverviewCharts";
import { Badge } from "./ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

interface OverviewSettingsProps {
    guildId: string | null;
    initialStats?: any;
    settings?: any;
}

export default function OverviewSettings({ guildId, initialStats, settings }: OverviewSettingsProps) {
    const [stats, setStats] = useState<any>(initialStats || null);
    const [loading, setLoading] = useState(!initialStats);

    useEffect(() => {
        if (initialStats) {
            setStats(initialStats);
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            if (!guildId) return;
            const token = localStorage.getItem("token");
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/guilds/${guildId}/stats`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        if (guildId) {
            setLoading(true);
            fetchStats();
        }
    }, [guildId, initialStats]);

    // Prepare chart data from API history
    const messageData = (stats?.history || []).map((h: any) => ({
        name: h.name,
        value: h.messages
    }));

    const memberData = (stats?.history || []).map((h: any) => ({
        name: h.name,
        value: h.joins
    }));

    const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-xl relative overflow-hidden group hover:bg-white/[0.05] transition-all"
        >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/20 blur-[60px] rounded-full translate-x-8 -translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity`} />

            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-${color}/10 border border-${color}/20 text-${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 font-medium text-xs ${trend === 'up' ? 'text-emerald-400' : (trend === 'down' ? 'text-rose-400' : 'text-muted-foreground')}`}>
                    {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                    {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                    {trendValue}
                </div>
            </div>

            <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
                <p className="text-3xl font-bold text-white">{value}</p>
            </div>
        </motion.div>
    );

    if (loading) return <div className="p-8 text-center text-muted-foreground">Analysiere Server...</div>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Mitglieder"
                    value={stats?.total_members || 0}
                    icon={Users}
                    trend="up"
                    trendValue="+12%"
                    color="primary"
                />
                <StatCard
                    title="Aktiv Heute"
                    value={stats?.online_members || 0}
                    icon={Zap}
                    trend="up"
                    trendValue="+5%"
                    color="amber-400"
                />
                <StatCard
                    title="Nachrichten Heute"
                    value={stats?.messages_today || 0}
                    icon={MessageSquare}
                    trend={stats?.messages_trend || "up"}
                    trendValue={stats?.messages_trend_value || "0%"}
                    color="emerald-400"
                />
                <StatCard
                    title="Neue Member"
                    value={stats?.joined_today || 0}
                    icon={TrendingUp}
                    trend={stats?.joined_trend || "up"}
                    trendValue={stats?.joined_trend_value || "0%"}
                    color="indigo-400"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bot Health & Activity Summary */}
                <Card className="lg:col-span-2 glass border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" /> Command Center
                            </CardTitle>
                            <CardDescription>Live-Metriken deiner Server-Instanz</CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                            Live updates
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-6">
                                 <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
                                     <OverviewCharts data={messageData} type="messages" color="#DC2626" height={180} />
                                     <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-4">Nachrichten Volumen (7 Tage)</p>
                                 </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <QuickStat title="Server Age" value="238d" />
                                 <QuickStat title="Avg Activity" value="High" />
                                 <QuickStat title="Staff Count" value="12" />
                                 <QuickStat title="Uptime" value="99.9%" />
                             </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Module Status Sidebar */}
                <Card className="glass border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Module Status</CardTitle>
                        <CardDescription>Aktive Bot-Funktionen</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         <ModuleRow name="Level System" active={settings?.level_system ?? true} />
                         <ModuleRow name="Anti-Spam AI" active={settings?.anti_spam ?? true} />
                         <ModuleRow name="Welcome Suite" active={settings?.welcome_message ?? false} />
                         <ModuleRow name="Global Network" active={settings?.global_network ?? true} />
                         <ModuleRow name="Auto-Mod" active={settings?.auto_mod ?? true} />
                         <ModuleRow name="Logging" active={settings?.logging ?? true} />
                         <ModuleRow name="Economy" active={settings?.economy ?? false} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const QuickStat = ({ title, value }: { title: string, value: string }) => (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{title}</span>
        <span className="text-lg font-black text-white">{value}</span>
    </div>
);

const ModuleRow = ({ name, active }: { name: string, active: boolean }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
        <span className="text-sm font-bold text-white/80">{name}</span>
        {active ? (
            <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
            </div>
        ) : (
            <div className="flex items-center gap-1.5 text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                <XCircle className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Disabled</span>
            </div>
        )}
    </div>
);
