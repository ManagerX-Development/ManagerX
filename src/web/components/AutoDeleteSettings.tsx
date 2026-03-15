import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
    Trash2,
    Save,
    Clock,
    Hash,
    Plus,
    X,
    Search
} from "lucide-react";
import { toast } from "sonner";
import { SearchableSelect } from "./ui/SearchableSelect";

interface AutoDeleteSettingsProps {
    guildId: string;
    channels: any[];
}

interface ChannelConfig {
    channel_id: string;
    delay: number;
}

export default function AutoDeleteSettings({ guildId, channels }: AutoDeleteSettingsProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [configs, setConfigs] = useState<ChannelConfig[]>([]);

    useEffect(() => {
        fetchSettings();
    }, [guildId]);

    const fetchSettings = async () => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';
            const res = await fetch(`${baseUrl}/dashboard/settings/${guildId}/autodelete`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            const data = await res.json();
            if (data.success && data.data) {
                setConfigs(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch autodelete settings:", error);
            toast.error("Fehler beim Laden der Auto-Delete Einstellungen.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';
            const res = await fetch(`${baseUrl}/dashboard/settings/${guildId}/autodelete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(configs)
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Auto-Delete Einstellungen gespeichert! 🧹");
            }
        } catch (error) {
            console.error("Failed to save autodelete settings:", error);
            toast.error("Fehler beim Speichern der Einstellungen.");
        } finally {
            setSaving(false);
        }
    };

    const addChannel = () => {
        setConfigs([...configs, { channel_id: "", delay: 60 }]);
    };

    const removeChannel = (index: number) => {
        setConfigs(configs.filter((_, i) => i !== index));
    };

    const updateChannel = (index: number, field: keyof ChannelConfig, value: string | number) => {
        const newConfigs = [...configs];
        newConfigs[index] = { ...newConfigs[index], [field]: value };
        setConfigs(newConfigs);
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
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-2xl font-bold tracking-tight text-white">Auto-Delete</CardTitle>
                            </div>
                            <CardDescription className="text-muted-foreground font-medium ml-12">
                                Lösche Nachrichten in bestimmten Kanälen automatisch nach einer Zeit.
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addChannel}
                            className="bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary rounded-xl"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Hinzufügen
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="pt-8 space-y-6 px-8 pb-8">
                    {configs.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
                            <p className="text-muted-foreground text-sm">Noch keine Kanäle konfiguriert.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {configs.map((config, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-4 p-6 rounded-2xl bg-white/5 border border-white/5 relative group transition-all hover:border-primary/30">
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Kanal-ID</Label>
                                        <SearchableSelect
                                            options={channels}
                                            value={config.channel_id}
                                            onChange={(val) => updateChannel(index, "channel_id", val)}
                                            placeholder="Kanal auswählen..."
                                            type="channel"
                                            className="h-10 text-sm"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Verzögerung (Sekunden)</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={config.delay}
                                                onChange={(e) => updateChannel(index, "delay", parseInt(e.target.value))}
                                                className="bg-white/5 border-white/5 focus:border-primary/50 h-10 pl-10"
                                            />
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeChannel(index)}
                                        className="h-10 w-10 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-4 border-t border-white/5">
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
                                    Konfiguration speichern
                                </div>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
