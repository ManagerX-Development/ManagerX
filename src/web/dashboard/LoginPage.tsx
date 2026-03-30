import React from "react";
import { motion } from "framer-motion";
import {
    Shield,
    Sparkles,
    Lock,
    LayoutDashboard,
    ShieldCheck,
    Zap,
    ArrowRight,
    MessageSquare,
    Globe,
    Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { toast } from "sonner";

const FeatureItem = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
            <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
    </div>
);

export default function LoginPage() {
    const handleLogin = async () => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';
            const apiUrl = `${baseUrl}/dashboard/auth/login`;

            const res = await fetch(apiUrl);
            if (!res.ok) throw new Error("Could not fetch login URL");
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error("Keine Login-URL vom Server erhalten.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Fehler beim Verbinden mit dem Authentifizierungs-Server.");
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.12)_0%,transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(220,38,38,0.05)_0%,transparent_40%)]" />
            <div className="absolute inset-0 opacity-[0.03] grid-pattern" />

            {/* Floating Blobs */}
            <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full animate-pulse-glow" />
            <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-accent/10 blur-[100px] rounded-full animate-pulse-glow" />

            <div className="container max-w-6xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left Side: Branding & Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="hidden lg:block space-y-8"
                    >
                        <div className="space-y-4">
                            <Link to="/" className="inline-flex items-center gap-3 group mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/20 text-white transition-transform group-hover:scale-110">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-white leading-none">
                                        Manager<span className="text-primary">X</span>
                                    </h1>
                                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.2em] mt-1 opacity-50">Dashboard</p>
                                </div>
                            </Link>

                            <h2 className="text-5xl font-extrabold tracking-tighter leading-[1.1]">
                                Verwalte dein Universum <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">mit Leichtigkeit.</span>
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-lg font-medium">
                                Erlebe volle Kontrolle über deine Community. Schnell, sicher und intuitiv –
                                direkt in deinem Browser.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 max-w-md">
                            <FeatureItem
                                icon={LayoutDashboard}
                                title="Echtzeit-Statistiken"
                                description="Behalte das Wachstum deines Servers mit detaillierten Analysen im Auge."
                            />
                            <FeatureItem
                                icon={ShieldCheck}
                                title="Sichere Moderation"
                                description="Schütze deine Nutzer mit fortschrittlichen Filtern und automatischen Aktionen."
                            />
                            <FeatureItem
                                icon={Zap}
                                title="Blitzschnell"
                                description="Keine Ladezeiten. Änderungen werden sofort auf deinem Server übernommen."
                            />
                        </div>

                        <div className="pt-4 flex items-center gap-6 text-sm text-muted-foreground font-medium">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-primary/60" />
                                Dutzende Server weltweit
                            </div>
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-primary/60" />
                                Support-Community
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side: Login Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="w-full max-w-md mx-auto"
                    >
                        <div className="glass shadow-2xl rounded-[2.5rem] border border-white/10 p-8 md:p-10 relative overflow-hidden">
                            {/* Card Decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full -mr-16 -mt-16" />

                            <div className="relative space-y-8">
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">System-Vorschau</span>
                                    </div>
                                    <h3 className="text-3xl font-bold tracking-tight text-white">Willkommen zurück</h3>
                                    <p className="text-muted-foreground text-sm font-medium">Logge dich ein, um dein Dashboard zu verwalten</p>
                                </div>

                                <div className="space-y-4">
                                    <motion.button
                                        onClick={handleLogin}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-xl shadow-[#5865F2]/20 group"
                                    >
                                        <div className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-lg group-hover:scale-110 transition-transform">
                                            <svg viewBox="0 0 127.14 96.36" className="w-4 h-4 fill-white">
                                                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.48,80.1a105.73,105.73,0,0,0,32.5,16.26,77.7,77.7,0,0,0,7.34-11.9,65.8,65.8,0,0,1-11.75-5.6c1,.74,2,1.5,3,2.25a74.16,74.16,0,0,0,64.14,0c1-.75,2-1.51,3-2.25a65.52,65.52,0,0,1-11.76,5.6,77.74,77.74,0,0,0,7.34,11.9,105.27,105.27,0,0,0,32.51-16.26c2.8-27.15-4.7-50.85-19.49-72.03ZM42.45,65.69c-6.22,0-11.41-5.71-11.41-12.67s5-12.67,11.41-12.67,11.41,5.71,11.41,12.67-5,12.67-11.41,12.67Zm42.24,0c-6.22,0-11.41-5.71-11.41-12.67s5.05-12.67,11.41-12.67,11.41,5.71,11.41,12.67-5,12.67-11.41,12.67Z" />
                                            </svg>
                                        </div>
                                        Logge dich über Discord ein
                                        <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </motion.button>

                                    <div className="relative flex items-center py-2">
                                        <div className="flex-grow border-t border-white/5"></div>
                                        <span className="flex-shrink mx-4 text-[10px] uppercase tracking-widest text-muted-foreground font-bold opacity-30">VORSCHAU MODUS</span>
                                        <div className="flex-grow border-t border-white/5"></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/10 transition-all text-xs font-semibold group grayscale hover:grayscale-0">
                                            <Settings className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            Einstellungen
                                        </button>
                                        <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/10 transition-all text-xs font-semibold group grayscale hover:grayscale-0">
                                            <LayoutDashboard className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            Module
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-4">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                        <Lock className="w-5 h-5 text-primary shrink-0" />
                                        <p className="text-[11px] text-muted-foreground leading-snug">
                                            <span className="text-foreground font-bold italic">ManagerX</span> fragt nicht nach deinem Passwort. Der Login erfolgt sicher über das offizielle Discord OAuth2 System.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Support Links */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="mt-8 flex justify-center gap-6"
                        >
                            <Link to="/legal/privacy" className="text-xs text-muted-foreground hover:text-white transition-colors no-underline">Datenschutz</Link>
                            <Link to="/legal/terms" className="text-xs text-muted-foreground hover:text-white transition-colors no-underline">Nutzungsbedingungen</Link>
                            <a href="https://discord.gg/9T28DWup3g" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-white transition-colors no-underline">Hilfe erhalten</a>
                        </motion.div>
                    </motion.div>

                </div>
            </div>

            {/* Footer Branding */}
            <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none opacity-20">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white">
                    © 2026 OPPRO.NET DEVELOPMENT | ManagerX Dashboard
                </p>
            </div>
        </div>
    );
}
