import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Globe,
    Hash,
    Save,
    Shield,
    Palette,
    Eye
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface Channel {
    id: string;
    name: string;
}

export default function GlobalChatSettings({ guildId }: { guildId: string }) {
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [channels, setChannels] = useState<Channel[]>([]);

    // GlobalChat Form States
    const [channelId, setChannelId] = useState("");
    const [filterEnabled, setFilterEnabled] = useState(true);
    const [nsfwFilter, setNsfwFilter] = useState(true);
    const [embedColor, setEmbedColor] = useState("#2463eb");

    useEffect(() => {
        const fetchData = async () => {
            if (!token || !guildId) return;
            try {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';

                // Fetch Channels
                const channelRes = await fetch(`${baseUrl}/dashboard/settings/${guildId}/channels`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (channelRes.ok) {
                    const data = await channelRes.json();
                    setChannels(data.channels || []);
                }

                // Fetch GlobalChat Settings
                const settingsRes = await fetch(`${baseUrl}/dashboard/settings/${guildId}/globalchat`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (settingsRes.ok) {
                    const resData = await settingsRes.json();
                    const s = resData.data;
                    if (s) {
                        setChannelId(s.channel_id || "");
                        setFilterEnabled(s.filter_enabled ?? true);
                        setNsfwFilter(s.nsfw_filter ?? true);
                        setEmbedColor(s.embed_color || "#2463eb");
                    }
                }
            } catch (e) {
                console.error("Fetch error", e);
            }
        };
        fetchData();
    }, [token, guildId]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';
            const payload = {
                channel_id: channelId,
                filter_enabled: filterEnabled,
                nsfw_filter: nsfwFilter,
                embed_color: embedColor
            };

            const res = await fetch(`${baseUrl}/dashboard/settings/${guildId}/globalchat`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Global Chat erfolgreich aktualisiert!");
            } else {
                throw new Error("Save failed");
            }
        } catch (e) {
            toast.error("Fehler beim Speichern der Global Chat Einstellungen.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="glass border-white/5 bg-white/[0.02] shadow-2xl rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-white/[0.01] border-b border-white/5 pb-6">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <Globe className="w-6 h-6 text-primary" />
                        Global Chat System
                    </CardTitle>
                    <CardDescription>Verbinde deinen Server mit dem weltweiten ManagerX Netzwerk.</CardDescription>
                </CardHeader>

                <CardContent className="pt-8 space-y-8">
                    <div className="space-y-3">
                        <Label className="text-white/90 font-semibold flex items-center gap-2">
                            <Hash className="w-4 h-4" /> Global Chat Kanal
                        </Label>
                        <select
                            value={channelId}
                            onChange={(e) => setChannelId(e.target.value)}
                            className="w-full h-12 rounded-xl bg-black/20 border border-white/10 text-white px-4 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                        >
                            <option value="" className="bg-[#1a1c1e]">Kein Kanal (Deaktiviert)</option>
                            {channels.map(c => (
                                <option key={c.id} value={c.id} className="bg-[#1a1c1e] text-white">#{c.name}</option>
                            ))}
                        </select>
                        <p className="text-[11px] text-muted-foreground">Wähle den Kanal, der als Global Chat fungieren soll.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-black/20 group">
                            <div className="space-y-1">
                                <Label className="text-sm font-semibold text-white group-hover:text-primary transition-colors">Wortfilter aktiv</Label>
                                <p className="text-[10px] text-muted-foreground">Blockiert automatisch Beleidigungen und Links.</p>
                            </div>
                            <Switch checked={filterEnabled} onCheckedChange={setFilterEnabled} />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-black/20 group">
                            <div className="space-y-1">
                                <Label className="text-sm font-semibold text-white group-hover:text-primary transition-colors">NSFW Filter</Label>
                                <p className="text-[10px] text-muted-foreground">Blockiert nicht jugendfreie Inhalte.</p>
                            </div>
                            <Switch checked={nsfwFilter} onCheckedChange={setNsfwFilter} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-white/90 font-semibold flex items-center gap-2">
                            <Palette className="w-4 h-4" /> Embed Farbe
                        </Label>
                        <div className="flex gap-3">
                            <Input
                                type="color"
                                value={embedColor}
                                onChange={(e) => setEmbedColor(e.target.value)}
                                className="w-12 h-12 p-1 bg-transparent border-none cursor-pointer"
                            />
                            <Input
                                value={embedColor}
                                onChange={(e) => setEmbedColor(e.target.value)}
                                className="bg-black/20 border-white/10 h-12 rounded-xl font-mono flex-1"
                            />
                        </div>
                        <p className="text-[11px] text-muted-foreground">Die Farbe, in der deine Nachrichten global angezeigt werden.</p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="rounded-2xl px-10 py-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:scale-[1.05] active:scale-[0.95] font-bold text-lg"
                >
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save className="w-6 h-6" />
                    )}
                    Global Chat speichern
                </Button>
            </div>
        </div>
    );
}
