/// <reference types="vite/client" />
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Users, MessageSquare, Zap, Activity, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import OverviewCharts from "./OverviewCharts";

interface OverviewSettingsProps {
    guildId: string | null;
}

export default function OverviewSettings({ guildId }: OverviewSettingsProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
    }, [guildId]);

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
                <div className={`flex items-center gap-1 font-medium text-xs ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
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
                    trend="up"
                    trendValue="+24%"
                    color="emerald-400"
                />
                <StatCard
                    title="Neue Member"
                    value={stats?.joined_today || 0}
                    icon={TrendingUp}
                    trend="down"
                    trendValue="-2%"
                    color="indigo-400"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/[0.03] border-white/5 backdrop-blur-xl rounded-[32px] overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" /> Nachrichten Volumen
                        </CardTitle>
                        <CardDescription>Aktivität der letzten 7 Tage</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OverviewCharts data={messageData} type="messages" color="#3B82F6" />
                    </CardContent>
                </Card>

                <Card className="bg-white/[0.03] border-white/5 backdrop-blur-xl rounded-[32px] overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-emerald-400" /> Mitglieder Wachstum
                        </CardTitle>
                        <CardDescription>Wachstumstrend der Woche</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OverviewCharts data={memberData} type="members" color="#10B981" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
