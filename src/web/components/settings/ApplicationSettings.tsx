import React, { useState, useEffect } from "react";
import { motion, Reorder } from "framer-motion";
import {
    ClipboardList,
    Plus,
    Trash2,
    Save,
    GripVertical,
    Send,
    MessageSquare,
    HelpCircle
} from "lucide-react";
import { useAuth } from "../core/AuthProvider";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { API_URL } from "../../lib/api";

export default function ApplicationSettings({ guildId }: { guildId: string }) {
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [questions, setQuestions] = useState<string[]>([]);
    const [newQuestion, setNewQuestion] = useState("");

    const fetchData = async () => {
        if (!token || !guildId) return;
        try {
            const res = await fetch(`${API_URL}/management/${guildId}/applications`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQuestions(data.data || []);
            }
        } catch (e) {
            console.error("Fetch error", e);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token, guildId]);

    const handleAdd = () => {
        if (!newQuestion) return;
        if (questions.length >= 10) {
            toast.error("Maximal 10 Fragen erlaubt!");
            return;
        }
        setQuestions([...questions, newQuestion]);
        setNewQuestion("");
    };

    const handleRemove = (index: number) => {
        const n = [...questions];
        n.splice(index, 1);
        setQuestions(n);
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/management/${guildId}/applications`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ questions })
            });

            if (res.ok) {
                toast.success("Bewerbungsfragen gespeichert!");
            }
        } catch (e) {
            toast.error("Fehler beim Speichern.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <Card className="glass border-white/5 bg-white/[0.02] shadow-2xl rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-white/[0.01] border-b border-white/5 pb-8 pt-10 px-10">
                    <CardTitle className="text-3xl font-bold flex items-center gap-3">
                        <ClipboardList className="w-8 h-8 text-primary animate-pulse" />
                        Application System
                    </CardTitle>
                    <CardDescription className="text-base mt-2">Automatisiere Team-Bewerbungen über ein interaktives DM-Interface.</CardDescription>
                </CardHeader>

                <CardContent className="p-10 space-y-10">
                    {/* Intro / Setup */}
                    <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
                        <div className="p-4 rounded-2xl bg-primary/10">
                            <Send className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h4 className="font-bold text-white text-lg">Bewerbungs-Post erstellen</h4>
                            <p className="text-sm text-muted-foreground italic">Poste eine Nachricht mit einem Button in deinen Kanal, um Bewerbungen zu starten.</p>
                        </div>
                        <Button variant="outline" className="border-primary/30 hover:bg-primary/10 text-primary rounded-xl h-12 font-bold px-8">Jetzt posten</Button>
                    </div>

                    {/* Question Editor */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-white flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-primary" /> Interview-Fragen ({questions.length}/10)
                            </h4>
                        </div>

                        <div className="space-y-3">
                            {questions.map((q, idx) => (
                                <motion.div
                                    key={idx}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-xs font-bold text-primary border border-white/5">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 font-medium text-white/90">{q}</div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleRemove(idx)}
                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            ))}

                            <div className="flex gap-3 pt-2">
                                <Input 
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    placeholder="Neue Frage hinzufügen..."
                                    className="bg-black/20 border-white/10 h-12 rounded-xl flex-1"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                />
                                <Button onClick={handleAdd} className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-12 w-12 px-0">
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="flex justify-end pt-4">
                            <Button 
                                onClick={handleSave}
                                disabled={isLoading}
                                className="rounded-2xl px-12 py-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/30 transition-all font-bold text-lg"
                            >
                                {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-6 h-6" />}
                                Fragen speichern
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
