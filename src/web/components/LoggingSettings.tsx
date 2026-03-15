/// <reference types="vite/client" />
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
    ClipboardList,
    Save,
    MessageSquare,
    Hash,
    UserPlus,
    UserMinus,
    ShieldAlert,
    History,
    Search
} from "lucide-react";
import { toast } from "sonner";

interface LoggingSettingsProps {
    guildId: string;
    channels: any[];
}

export default function LoggingSettings({ guildId, channels }: LoggingSettingsProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        enabled: false,
        channel_id: "",
        log_messages: true,
        log_members: true,
        log_mod: true,
        log_server: true
    });

    useEffect(() => {
        fetchSettings();
    }, [guildId]);

    const fetchSettings = async () => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';
            const res = await fetch(`${baseUrl}/dashboard/settings/${guildId}/logging`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            const data = await res.json();
            if (data.success && data.data) {
                setSettings(prev => ({ ...prev, ...data.data }));
            }
        } catch (error) {
            console.error("Failed to fetch logging settings:", error);
            toast.error("Fehler beim Laden der Log-Einstellungen.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';
            const res = await fetch(`${baseUrl}/dashboard/settings/${guildId}/logging`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Log-Einstellungen gespeichert! 📜");
            }
        } catch (error) {
            console.error("Failed to save logging settings:", error);
            toast.error("Fehler beim Speichern der Einstellungen.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="space-y-6 animate-pulse">
            <div className="h-64 bg-white/5 rounded-3xl" />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="glass border-white/10 shadow-2xl overflow-hidden rounded-[2rem]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />

                <CardHeader className="relative pb-0 pt-8 px-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                    <ClipboardList className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-2xl font-bold tracking-tight text-white">Server-Logging</CardTitle>
                            </div>
                            <CardDescription className="text-muted-foreground font-medium ml-12">
                                Protokolliere alle wichtigen Ereignisse auf deinem Server.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                            <Label htmlFor="log-enabled" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">Status</Label>
                            <Switch
                                id="log-enabled"
                                checked={settings.enabled}
                                onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-8 space-y-8 px-8 pb-8">
                    {/* Log Channel */}
                    <div className="space-y-3">
                        <Label className="text-white/90 font-semibold flex items-center gap-2">
                            <Hash className="w-4 h-4 text-primary" /> Log-Kanal
                        </Label>
                        <div className="relative group">
                            <select
                                value={settings.channel_id}
                                onChange={(e) => setSettings({ ...settings, channel_id: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 focus:border-primary/50 transition-all rounded-xl h-12 px-4 appearance-none outline-none text-white"
                            >
                                <option value="" disabled className="bg-[#1a1c1e]">Kanal auswählen...</option>
                                {channels.map(channel => (
                                    <option key={channel.id} value={channel.id} className="bg-[#1a1c1e]">
                                        #{channel.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Message Logs */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="w-5 h-5 text-primary/70" />
                                <div>
                                    <p className="text-sm font-semibold text-white">Nachrichten</p>
                                    <p className="text-[10px] text-muted-foreground">Gelöschte & bearbeitete Nachrichten</p>
                                </div>
                            </div>
                            <Switch
                                checked={settings.log_messages}
                                onCheckedChange={(checked) => setSettings({ ...settings, log_messages: checked })}
                            />
                        </div>

                        {/* Member Logs */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <UserPlus className="w-5 h-5 text-primary/70" />
                                <div>
                                    <p className="text-sm font-semibold text-white">Mitglieder</p>
                                    <p className="text-[10px] text-muted-foreground">Beitritte, Verlassen, Namensänderungen</p>
                                </div>
                            </div>
                            <Switch
                                checked={settings.log_members}
                                onCheckedChange={(checked) => setSettings({ ...settings, log_members: checked })}
                            />
                        </div>

                        {/* Moderation Logs */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="w-5 h-5 text-primary/70" />
                                <div>
                                    <p className="text-sm font-semibold text-white">Moderation</p>
                                    <p className="text-[10px] text-muted-foreground">Banns, Kicks, Timeouts</p>
                                </div>
                            </div>
                            <Switch
                                checked={settings.log_mod}
                                onCheckedChange={(checked) => setSettings({ ...settings, log_mod: checked })}
                            />
                        </div>

                        {/* Server Logs */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <History className="w-5 h-5 text-primary/70" />
                                <div>
                                    <p className="text-sm font-semibold text-white">Server-Updates</p>
                                    <p className="text-[10px] text-muted-foreground">Kanal- & Rollenänderungen</p>
                                </div>
                            </div>
                            <Switch
                                checked={settings.log_server}
                                onCheckedChange={(checked) => setSettings({ ...settings, log_server: checked })}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 group transition-all"
                        >
                            {saving ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Speichere Änderungen...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    Einstellungen speichern
                                </div>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
