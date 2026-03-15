/// <reference types="vite/client" />
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
    UserPlus,
    Save,
    ShieldCheck,
    AtSign,
    UserCog,
    Search
} from "lucide-react";
import { toast } from "sonner";
import { SearchableSelect } from "./ui/SearchableSelect";

interface AutoRoleSettingsProps {
    guildId: string;
    roles: any[];
}

export default function AutoRoleSettings({ guildId, roles }: AutoRoleSettingsProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        enabled: false,
        role_id: "",
        apply_on_join: true,
        notify_user: false
    });

    useEffect(() => {
        fetchSettings();
    }, [guildId]);

    const fetchSettings = async () => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';
            const res = await fetch(`${baseUrl}/dashboard/settings/${guildId}/autorole`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            const data = await res.json();
            if (data.success && data.data) {
                setSettings(prev => ({ ...prev, ...data.data }));
            }
        } catch (error) {
            console.error("Failed to fetch autorole settings:", error);
            toast.error("Fehler beim Laden der Auto-Rollen Einstellungen.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';
            const res = await fetch(`${baseUrl}/dashboard/settings/${guildId}/autorole`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Auto-Rollen Einstellungen gespeichert! 🛡️");
            }
        } catch (error) {
            console.error("Failed to save autorole settings:", error);
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
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-2xl font-bold tracking-tight text-white">Auto-Roles</CardTitle>
                            </div>
                            <CardDescription className="text-muted-foreground font-medium ml-12">
                                Weist neuen Mitgliedern automatisch eine Rolle zu.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                            <Label htmlFor="autorole-enabled" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">Status</Label>
                            <Switch
                                id="autorole-enabled"
                                checked={settings.enabled}
                                onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-8 space-y-8 px-8 pb-8">
                    {/* Role ID */}
                    <div className="space-y-3">
                        <Label className="text-white/90 font-semibold flex items-center gap-2">
                            <AtSign className="w-4 h-4 text-primary" /> Ziel-Rolle
                        </Label>
                        <SearchableSelect
                            options={roles}
                            value={settings.role_id}
                            onChange={(val) => setSettings({ ...settings, role_id: val })}
                            placeholder="Ziel-Rolle auswählen..."
                            type="role"
                        />
                        <p className="text-[11px] text-muted-foreground italic">Stelle sicher, dass die Bot-Rolle über der Ziel-Rolle steht!</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <UserPlus className="w-5 h-5 text-primary/70" />
                                <div>
                                    <p className="text-sm font-semibold text-white">Bei Beitritt</p>
                                    <p className="text-[10px] text-muted-foreground">Sofort beim Serverbeitritt zuweisen</p>
                                </div>
                            </div>
                            <Switch
                                checked={settings.apply_on_join}
                                onCheckedChange={(checked) => setSettings({ ...settings, apply_on_join: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <UserCog className="w-5 h-5 text-primary/70" />
                                <div>
                                    <p className="text-sm font-semibold text-white">Nutzer benachrichtigen</p>
                                    <p className="text-[10px] text-muted-foreground">Sende eine DM nach der Zuweisung</p>
                                </div>
                            </div>
                            <Switch
                                checked={settings.notify_user}
                                onCheckedChange={(checked) => setSettings({ ...settings, notify_user: checked })}
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
