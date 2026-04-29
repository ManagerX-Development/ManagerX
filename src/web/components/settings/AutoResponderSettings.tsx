import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare,
    Plus,
    Trash2,
    Zap,
    Save,
    Search,
    Brain
} from "lucide-react";
import { useAuth } from "../core/AuthProvider";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { API_URL } from "../../lib/api";

interface AutoResponse {
    id: number;
    keyword: string;
    response: string;
    match_type: string;
}

export default function AutoResponderSettings({ guildId }: { guildId: string }) {
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [responses, setResponses] = useState<AutoResponse[]>([]);
    
    // New Response Form
    const [newKeyword, setNewKeyword] = useState("");
    const [newResponse, setNewResponse] = useState("");
    const [matchType, setMatchType] = useState("partial");

    const fetchData = async () => {
        if (!token || !guildId) return;
        try {
            const res = await fetch(`${API_URL}/management/${guildId}/autoresponder`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setResponses(data.data || []);
            }
        } catch (e) {
            console.error("Fetch error", e);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token, guildId]);

    const handleAdd = async () => {
        if (!newKeyword || !newResponse) {
            toast.error("Bitte Keyword und Antwort ausfüllen!");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/management/${guildId}/autoresponder`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    keyword: newKeyword,
                    response: newResponse,
                    match_type: matchType
                })
            });

            if (res.ok) {
                toast.success("Keyword erfolgreich hinzugefügt!");
                setNewKeyword("");
                setNewResponse("");
                fetchData();
            }
        } catch (e) {
            toast.error("Fehler beim Hinzufügen.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const res = await fetch(`${API_URL}/management/${guildId}/autoresponder/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Keyword gelöscht.");
                fetchData();
            }
        } catch (e) {
            toast.error("Fehler beim Löschen.");
        }
    };

    return (
        <div className="space-y-8">
            <Card className="glass border-white/5 bg-white/[0.02] shadow-2xl rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-white/[0.01] border-b border-white/5 pb-8 pt-10 px-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-3xl font-bold flex items-center gap-3">
                                <Brain className="w-8 h-8 text-primary animate-pulse" />
                                Smart Auto-Responder
                            </CardTitle>
                            <CardDescription className="text-base mt-2">Lass den Bot automatisch auf häufige Fragen antworten.</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-10 space-y-10">
                    {/* Add New Keyword */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 space-y-6">
                        <h4 className="font-bold flex items-center gap-2 text-white">
                            <Plus className="w-5 h-5 text-primary" /> Neues Keyword erstellen
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-bold uppercase tracking-widest text-primary">Auslöser (Keyword)</Label>
                                <Input 
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    className="bg-black/20 border-white/10 h-12 rounded-xl"
                                    placeholder="z.B. IP, Regeln, Hilfe"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold uppercase tracking-widest text-primary">Erkennungs-Modus</Label>
                                <select 
                                    value={matchType}
                                    onChange={(e) => setMatchType(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 h-12 rounded-xl px-4 text-white outline-none"
                                >
                                    <option value="partial">Teilweise (Wort im Satz)</option>
                                    <option value="exact">Exakt (Nur das Wort)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold uppercase tracking-widest text-primary">Antwort (Bot-Nachricht)</Label>
                            <textarea 
                                value={newResponse}
                                onChange={(e) => setNewResponse(e.target.value)}
                                className="w-full min-h-[100px] bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                placeholder="Was soll der Bot antworten?"
                            />
                        </div>

                        <Button 
                            onClick={handleAdd}
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold gap-2"
                        >
                            <Plus className="w-5 h-5" /> Keyword hinzufügen
                        </Button>
                    </div>

                    {/* Dashboard List */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" /> Aktive Antworten ({responses.length})
                        </h4>
                        
                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                                {responses.map((res) => (
                                    <motion.div
                                        key={res.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/[0.02] group hover:bg-white/[0.04] transition-all"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                                                    {res.match_type === 'exact' ? 'Exakt' : 'Teilweise'}
                                                </span>
                                                <span className="font-bold text-white text-lg">{res.keyword}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-1 opacity-70">{res.response}</p>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleDelete(res.id)}
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {responses.length === 0 && (
                                <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                    <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-muted-foreground text-sm font-medium">Noch keine Auto-Antworten eingerichtet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
