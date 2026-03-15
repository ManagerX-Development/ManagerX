import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    MessageSquare,
    Hash,
    Image as ImageIcon,
    Layout,
    Save,
    AlertCircle,
    Palette,
    Type
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { toast } from "sonner";
import { SearchableSelect } from "./ui/SearchableSelect";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface Channel {
    id: string;
    name: string;
}

export default function WelcomeSettings({ guildId }: { guildId: string }) {
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [channels, setChannels] = useState<Channel[]>([]);

    // Welcome Form States
    const [enabled, setEnabled] = useState(true);
    const [channelId, setChannelId] = useState("");
    const [welcomeMessage, setWelcomeMessage] = useState("");
    const [embedEnabled, setEmbedEnabled] = useState(false);
    const [embedTitle, setEmbedTitle] = useState("");
    const [embedDescription, setEmbedDescription] = useState("");
    const [embedFooter, setEmbedFooter] = useState("");
    const [embedColor, setEmbedColor] = useState("#2463eb");
    const [pingUser, setPingUser] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!token || !guildId) return;
            try {
                const base = "http://localhost:8040/dashboard/settings";

                // Fetch Channels
                const channelRes = await fetch(`${base}/${guildId}/channels`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (channelRes.ok) {
                    const data = await channelRes.json();
                    setChannels(data.channels || []);
                }

                // Fetch Welcome Settings
                const settingsRes = await fetch(`${base}/${guildId}/welcome`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (settingsRes.ok) {
                    const resData = await settingsRes.json();
                    const s = resData.data;
                    if (s) {
                        setEnabled(s.enabled ?? true);
                        setChannelId(s.channel_id || "");
                        setWelcomeMessage(s.welcome_message || "");
                        setEmbedEnabled(s.embed_enabled ?? false);
                        setEmbedTitle(s.embed_title || "");
                        setEmbedDescription(s.embed_description || "");
                        setEmbedFooter(s.embed_footer || "");
                        setEmbedColor(s.embed_color || "#2463eb");
                        setPingUser(s.ping_user ?? false);
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
            const payload = {
                enabled,
                channel_id: channelId,
                welcome_message: welcomeMessage,
                embed_enabled: embedEnabled,
                embed_title: embedTitle,
                embed_description: embedDescription,
                embed_footer: embedFooter,
                embed_color: embedColor,
                ping_user: pingUser
            };

            const res = await fetch(`http://localhost:8040/dashboard/settings/${guildId}/welcome`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Welcome-Modul erfolgreich aktualisiert!");
            } else {
                throw new Error("Save failed");
            }
        } catch (e) {
            toast.error("Fehler beim Speichern der Welcome-Einstellungen.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="glass border-white/5 bg-white/[0.02] shadow-2xl rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-white/[0.01] border-b border-white/5 pb-6 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-primary" />
                            Welcome System
                        </CardTitle>
                        <CardDescription>Konfiguriere Nachrichten für neue Mitglieder.</CardDescription>
                    </div>
                    <Switch checked={enabled} onCheckedChange={setEnabled} className="data-[state=checked]:bg-primary scale-125" />
                </CardHeader>

                <CardContent className="pt-8 space-y-8">
                    {/* Basic Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-white/90 font-semibold flex items-center gap-2">
                                <Hash className="w-4 h-4" /> Welcome Channel
                            </Label>
                            <SearchableSelect
                                options={channels}
                                value={channelId}
                                onChange={setChannelId}
                                placeholder="Welcome-Kanal auswählen..."
                                type="channel"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-white/90 font-semibold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> User Pingen
                            </Label>
                            <div className="flex items-center h-12 px-4 rounded-xl border border-white/5 bg-white/[0.02] justify-between">
                                <span className="text-sm text-muted-foreground italic">Erwähne den User beim Join</span>
                                <Switch checked={pingUser} onCheckedChange={setPingUser} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-white/90 font-semibold flex items-center gap-2">
                            <Type className="w-4 h-4" /> Welcome Nachricht (Text)
                        </Label>
                        <textarea
                            value={welcomeMessage}
                            onChange={(e) => setWelcomeMessage(e.target.value)}
                            className="w-full min-h-[120px] rounded-xl bg-black/20 border border-white/10 text-white p-4 focus:ring-2 focus:ring-primary outline-none transition-all resize-none font-medium"
                            placeholder="z.B. Willkommen %mention% auf %servername%!"
                        />
                        <div className="flex flex-wrap gap-2 pt-1 transition-all">
                            {["%mention%", "%user%", "%servername%", "%membercount%"].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setWelcomeMessage(welcomeMessage + " " + tag)}
                                    className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/30 transition-all text-muted-foreground hover:text-white"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Layout className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Embed Modus</h4>
                                    <p className="text-xs text-muted-foreground">Verwende ein schöneres Format für Willkommensnachrichten.</p>
                                </div>
                            </div>
                            <Switch checked={embedEnabled} onCheckedChange={setEmbedEnabled} />
                        </div>

                        {embedEnabled && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="space-y-6 overflow-hidden"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-white/80 text-sm">Embed Titel</Label>
                                        <Input
                                            value={embedTitle}
                                            onChange={(e) => setEmbedTitle(e.target.value)}
                                            className="bg-black/20 border-white/5 h-10 rounded-lg text-sm"
                                            placeholder="Titel eingeben..."
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-white/80 text-sm">Embed Farbe</Label>
                                        <div className="flex gap-3">
                                            <Input
                                                type="color"
                                                value={embedColor}
                                                onChange={(e) => setEmbedColor(e.target.value)}
                                                className="w-12 h-10 p-1 bg-transparent border-none cursor-pointer"
                                            />
                                            <Input
                                                value={embedColor}
                                                onChange={(e) => setEmbedColor(e.target.value)}
                                                className="bg-black/20 border-white/5 h-10 rounded-lg text-sm font-mono flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-white/80 text-sm">Embed Beschreibung (Text)</Label>
                                    <textarea
                                        value={embedDescription}
                                        onChange={(e) => setEmbedDescription(e.target.value)}
                                        className="w-full min-h-[80px] rounded-lg bg-black/20 border border-white/5 text-white p-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all resize-none shadow-inner"
                                        placeholder="Beschreibung..."
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-white/80 text-sm">Footer Text</Label>
                                    <Input
                                        value={embedFooter}
                                        onChange={(e) => setEmbedFooter(e.target.value)}
                                        className="bg-black/20 border-white/5 h-10 rounded-lg text-sm"
                                        placeholder="Footer eingeben..."
                                    />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="rounded-2xl px-10 py-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/30 transition-all hover:scale-[1.05] active:scale-[0.95] font-bold text-lg"
                >
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save className="w-6 h-6" />
                    )}
                    Willkommenssystem speichern
                </Button>
            </div>
        </div>
    );
}
