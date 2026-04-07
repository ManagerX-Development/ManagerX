/// <reference types="vite/client" />
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
    Trophy,
    Save,
    MessageSquare,
    Hash,
    Volume2,
    Ban,
    Sparkles,
    BarChart3,
    Search
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { SearchableSelect } from "./ui/SearchableSelect";

interface LevelSettingsProps {
    guildId: string;
    channels: any[];
}

import { API_URL } from "../lib/api";

export default function LevelSettings({ guildId, channels }: LevelSettingsProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        enabled: false,
        xp_rate: 1.0,
        level_up_message: "Glückwunsch {user}, du bist nun Level {level}!",
        level_up_channel: "",
        voice_xp: true,
        announcement_enabled: true
    });

    useEffect(() => {
        fetchSettings();
    }, [guildId]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/dashboard/settings/${guildId}/levels`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            const data = await res.json();
            if (data.success && data.data) {
                setSettings(prev => ({ ...prev, ...data.data }));
            }
        } catch (error) {
            console.error("Failed to fetch level settings:", error);
            toast.error("Fehler beim Laden der Level-Einstellungen.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/dashboard/settings/${guildId}/levels`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Level-System Einstellungen gespeichert! ✨");
            } else {
                throw new Error(data.detail || "Unbekannter Fehler");
            }
        } catch (error) {
            console.error("Failed to save level settings:", error);
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
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-2xl font-bold tracking-tight text-white">Level-System</CardTitle>
                            </div>
                            <CardDescription className="text-muted-foreground font-medium ml-12">
                                Belohne aktive Mitglieder deiner Community mit XP und Leveln.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                            <Label htmlFor="level-enabled" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">Status</Label>
                            <Switch
                                id="level-enabled"
                                checked={settings.enabled}
                                onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-8 space-y-8 px-8 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* XP Rate */}
                        <div className="space-y-3">
                            <Label className="text-white/90 font-semibold flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-primary" /> XP Multiplikator
                            </Label>
                            <div className="relative group">
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={settings.xp_rate}
                                    onChange={(e) => setSettings({ ...settings, xp_rate: parseFloat(e.target.value) })}
                                    className="bg-white/5 border-white/10 focus:border-primary/50 transition-all rounded-xl h-12 pl-4"
                                />
                                <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                            <p className="text-[11px] text-muted-foreground">Standard ist 1.0. Höhere Werte geben mehr XP.</p>
                        </div>

                        {/* Level Up Channel */}
                        <div className="space-y-3">
                            <Label className="text-white/90 font-semibold flex items-center gap-2">
                                <Hash className="w-4 h-4 text-primary" /> Ankündigungskanal
                            </Label>
                            <div className="relative group">
                                <SearchableSelect
                                    options={channels}
                                    value={settings.level_up_channel}
                                    onChange={(val) => setSettings({ ...settings, level_up_channel: val })}
                                    placeholder="Aktueller Kanal"
                                    type="channel"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Level Up Message */}
                    <div className="space-y-3">
                        <Label className="text-white/90 font-semibold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" /> Level-Up Nachricht
                        </Label>
                        <div className="relative group">
                            <textarea
                                value={settings.level_up_message}
                                onChange={(e) => setSettings({ ...settings, level_up_message: e.target.value })}
                                className="w-full min-h-[100px] bg-white/5 border border-white/10 focus:border-primary/50 transition-all rounded-xl p-4 text-sm resize-none"
                                placeholder="Nutze {user} und {level} als Platzhalter..."
                            />
                            <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                        <div className="flex gap-2">
                            <span className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-muted-foreground font-mono">{"{user}"}</span>
                            <span className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-muted-foreground font-mono">{"{level}"}</span>
                        </div>
                    </div>

                    {/* Additional Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <Volume2 className="w-5 h-5 text-primary/70" />
                                <div>
                                    <p className="text-sm font-semibold text-white">Voice XP</p>
                                    <p className="text-[10px] text-muted-foreground">XP für Zeit in Voice-Kanälen</p>
                                </div>
                            </div>
                            <Switch
                                checked={settings.voice_xp}
                                onCheckedChange={(checked) => setSettings({ ...settings, voice_xp: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-primary/70" />
                                <div>
                                    <p className="text-sm font-semibold text-white">Ankündigungen</p>
                                    <p className="text-[10px] text-muted-foreground">Level-Ups im Chat verkünden</p>
                                </div>
                            </div>
                            <Switch
                                checked={settings.announcement_enabled}
                                onCheckedChange={(checked) => setSettings({ ...settings, announcement_enabled: checked })}
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
