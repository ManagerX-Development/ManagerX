import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Shield,
    Hash,
    Save,
    Clock,
    Zap,
    AlertTriangle
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

export default function AntiSpamSettings({ guildId }: { guildId: string }) {
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [channels, setChannels] = useState<Channel[]>([]);

    // AntiSpam Form States
    const [maxMessages, setMaxMessages] = useState(5);
    const [timeFrame, setTimeFrame] = useState(10);
    const [logChannelId, setLogChannelId] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            if (!token || !guildId) return;
            try {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';

                // Fetch Channels
                const channelRes = await fetch(`${baseUrl}/dashboard/guilds/${guildId}/channels`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (channelRes.ok) {
                    const data = await channelRes.json();
                    setChannels(data.channels || []);
                }

                // Fetch AntiSpam Settings
                const settingsRes = await fetch(`${baseUrl}/dashboard/settings/${guildId}/antispam`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (settingsRes.ok) {
                    const resData = await settingsRes.json();
                    const s = resData.data;
                    if (s) {
                        setMaxMessages(s.max_messages ?? 5);
                        setTimeFrame(s.time_frame ?? 10);
                        setLogChannelId(s.log_channel_id || "");
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
                max_messages: maxMessages,
                time_frame: timeFrame,
                log_channel_id: logChannelId
            };

            const res = await fetch(`${baseUrl}/dashboard/settings/${guildId}/antispam`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("AntiSpam-Einstellungen erfolgreich aktualisiert!");
            } else {
                throw new Error("Save failed");
            }
        } catch (e) {
            toast.error("Fehler beim Speichern der AntiSpam-Einstellungen.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="glass border-white/5 bg-white/[0.02] shadow-2xl rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-white/[0.01] border-b border-white/5 pb-6">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="w-6 h-6 text-primary" />
                        Anti-Spam Schutz
                    </CardTitle>
                    <CardDescription>Verhindere Spam-Attacken auf deinem Server.</CardDescription>
                </CardHeader>

                <CardContent className="pt-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-white/90 font-semibold flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Max. Nachrichten
                            </Label>
                            <Input
                                type="number"
                                value={maxMessages}
                                onChange={(e) => setMaxMessages(parseInt(e.target.value))}
                                className="bg-black/20 border-white/10 h-12 rounded-xl"
                                min={1}
                                max={50}
                            />
                            <p className="text-[11px] text-muted-foreground">Anzahl der Nachrichten, die in einem Zeitraum erlaubt sind.</p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-white/90 font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Zeitraum (Sekunden)
                            </Label>
                            <Input
                                type="number"
                                value={timeFrame}
                                onChange={(e) => setTimeFrame(parseInt(e.target.value))}
                                className="bg-black/20 border-white/10 h-12 rounded-xl"
                                min={1}
                                max={60}
                            />
                            <p className="text-[11px] text-muted-foreground">Der Zeitraum in dem die Nachrichten gezählt werden.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-white/90 font-semibold flex items-center gap-2">
                            <Hash className="w-4 h-4" /> Log-Kanal
                        </Label>
                        <select
                            value={logChannelId}
                            onChange={(e) => setLogChannelId(e.target.value)}
                            className="w-full h-12 rounded-xl bg-black/20 border border-white/10 text-white px-4 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                        >
                            <option value="" className="bg-[#1a1c1e]">Kein Log-Kanal (Deaktiviert)</option>
                            {channels.map(c => (
                                <option key={c.id} value={c.id} className="bg-[#1a1c1e] text-white">#{c.name}</option>
                            ))}
                        </select>
                        <p className="text-[11px] text-muted-foreground">Hier werden Spam-Vorfälle protokolliert.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-[11px] text-amber-500/80 font-medium">
                            Hinweis: Schärfere Einstellungen (weniger Nachrichten/längerer Zeitraum) können dazu führen, dass aktive User fälschlicherweise als Spammer erkannt werden.
                        </p>
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
                    AntiSpam speichern
                </Button>
            </div>
        </div >
    );
}
