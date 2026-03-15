import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Mic,
    Trash2,
    Plus,
    Save,
    Shield,
    Settings,
    Layout,
    Volume2,
    Folder,
    Hash,
    Sparkles,
    Zap,
    MessageSquare,
    Eye,
    EyeOff
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { SearchableSelect } from "./ui/SearchableSelect";
import { useAuth } from "../components/AuthProvider";

interface TempVCSettingsProps {
    guildId: string;
    categories: any[];
    voiceChannels: any[];
}

export default function TempVCSettings({ guildId, categories, voiceChannels }: TempVCSettingsProps) {
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        creator_channel_id: "",
        category_id: "",
        auto_delete_time: 0,
        ui_enabled: false,
        ui_prefix: "🔧"
    });

    useEffect(() => {
        const fetchSettings = async () => {
            if (!token || !guildId) return;
            setIsLoading(true);
            try {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';
                const res = await fetch(`${baseUrl}/dashboard/settings/${guildId}/tempvc`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        setSettings({
                            creator_channel_id: data.data.creator_channel_id || "",
                            category_id: data.data.category_id || "",
                            auto_delete_time: data.data.auto_delete_time || 0,
                            ui_enabled: data.data.ui_enabled ?? false,
                            ui_prefix: data.data.ui_prefix || "🔧"
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to fetch TempVC settings", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [token, guildId]);

    const handleSave = async () => {
        if (!token || !guildId) return;
        setIsSaving(true);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';
            const res = await fetch(`${baseUrl}/dashboard/settings/${guildId}/tempvc`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                toast.success("TempVC Einstellungen gespeichert!");
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
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Main Config Card */}
            <Card className="glass border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                <CardHeader className="pb-8 pt-10 px-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-3">
                                <Mic className="w-8 h-8 text-primary" />
                                Temporary Voice Channels
                            </CardTitle>
                            <CardDescription className="text-base text-muted-foreground/70">
                                Erlaube Usern, ihre eigenen Voice Channels zu erstellen und zu verwalten.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest text-primary">Pro Feature</span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-10 px-10 pb-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Creator Channel */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Volume2 className="w-4 h-4" />
                                    Join-to-Create Channel
                                </Label>
                            </div>
                            <SearchableSelect
                                type="voice"
                                options={voiceChannels}
                                value={settings.creator_channel_id}
                                onChange={(val) => setSettings({ ...settings, creator_channel_id: val })}
                                placeholder="Voice Channel auswählen..."
                            />
                            <p className="text-xs text-muted-foreground italic">
                                Wenn dieser Channel betreten wird, erstelle ich einen neuen.
                            </p>
                        </div>

                        {/* Category */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Folder className="w-4 h-4" />
                                    Ziel-Kategorie
                                </Label>
                            </div>
                            <SearchableSelect
                                type="category"
                                options={categories}
                                value={settings.category_id}
                                onChange={(val) => setSettings({ ...settings, category_id: val })}
                                placeholder="Kategorie auswählen..."
                            />
                            <p className="text-xs text-muted-foreground italic">
                                In dieser Kategorie werden die neuen Channels erstellt.
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* Additional Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Auto-Delete Time */}
                        <div className="space-y-4">
                            <Label className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                Auto-Delete (Minuten)
                            </Label>
                            <Input
                                type="number"
                                value={settings.auto_delete_time}
                                onChange={(e) => setSettings({ ...settings, auto_delete_time: parseInt(e.target.value) || 0 })}
                                className="bg-white/5 border-white/10 h-12 rounded-xl"
                                min={0}
                            />
                            <p className="text-xs text-muted-foreground">
                                Zeit bis leere Channels gelöscht werden (0 = sofort).
                            </p>
                        </div>

                        {/* UI Settings */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Layout className="w-4 h-4" />
                                    User Dashboard (UI)
                                </Label>
                                <Switch
                                    checked={settings.ui_enabled}
                                    onCheckedChange={(checked) => setSettings({ ...settings, ui_enabled: checked })}
                                />
                            </div>
                            {settings.ui_enabled && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <Label className="text-xs text-muted-foreground">Button-Präfix</Label>
                                    <Input
                                        value={settings.ui_prefix}
                                        onChange={(e) => setSettings({ ...settings, ui_prefix: e.target.value })}
                                        className="bg-white/5 border-white/10 h-12 rounded-xl"
                                        placeholder="🔧"
                                        maxLength={5}
                                    />
                                </motion.div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions Panel */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/20 gap-2 transition-all hover:scale-105 active:scale-95"
                >
                    {isSaving ? (
                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save className="w-6 h-6" />
                    )}
                    Änderungen speichern
                </Button>
            </div>
        </div>
    );
}
