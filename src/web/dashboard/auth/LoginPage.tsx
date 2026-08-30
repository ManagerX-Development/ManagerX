import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
    Lock,
    LayoutDashboard,
    ShieldCheck,
    Zap,
    ArrowRight,
    MessageSquare,
    Globe,
    Settings,
    Sparkles,
    Shield,
    Mail
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/components/core/AuthProvider";
import { API_URL } from "@/lib/api";

const FeatureItem = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/[0.04] transition-all duration-300 border border-transparent hover:border-white/5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
            <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
    </div>
);

export default function LoginPage() {
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("admin") === "true") {
            setShowAdminLogin(true);
        }
    }, [location]);

    const handleDiscordLogin = async () => {
        try {
            const res = await fetch(`${API_URL}/dashboard/auth/login`);
            if (!res.ok) throw new Error("Keine Antwort vom Server");
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error("Keine Login-URL vom Server erhalten.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Verbindungsfehler zum Authentifizierungs-Server.");
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/dashboard/auth/login/email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (data.access_token) {
                login(data.access_token, data.user, undefined, true);
                toast.success("Admin-Session gestartet!");
                navigate("/dash/admin");
            } else {
                toast.error(data.detail || "Login fehlgeschlagen");
            }
        } catch {
            toast.error("Verbindungsfehler");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans selection:bg-primary/30">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.1)_0%,transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(220,38,38,0.05)_0%,transparent_40%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.02] grid-pattern pointer-events-none" />

            {/* Pulsing Glow Orbs */}
            <div className="absolute top-[25%] left-[-5rem] w-64 h-64 bg-primary/20 rounded-full filter blur-[100px] animate-pulse-slow pointer-events-none will-change-transform" />
            <div className="absolute bottom-[25%] right-[-5rem] w-64 h-64 bg-accent/10 rounded-full filter blur-[100px] animate-pulse-slow pointer-events-none will-change-transform" />

            <div className="w-full max-w-6xl relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    
                    {/* Left: Branding & Value Proposition */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="hidden lg:flex flex-col justify-between space-y-10"
                    >
                        <div className="space-y-6">
                            <Link to="/" className="inline-flex items-center gap-4 group shrink-0">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30 text-white relative overflow-hidden border border-white/10">
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Shield className="w-6 h-6 drop-shadow-glow" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black tracking-tighter text-white leading-none uppercase italic">
                                        Manager<span className="text-primary">X</span>
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1.5 opacity-60">Dashboard Suite</span>
                                </div>
                            </Link>

                            <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05] italic uppercase">
                                Verwalte dein <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">
                                    Universum
                                </span>{" "}
                                mit Leichtigkeit.
                            </h2>
                            <p className="text-lg text-slate-400 max-w-lg leading-relaxed font-medium">
                                Erlebe volle Kontrolle über deine Community. Schnell, sicher und intuitiv – direkt in deinem Browser.
                            </p>
                        </div>

                        <div className="space-y-3 bg-white/[0.01] border border-white/5 p-6 rounded-[2rem] glass">
                            <FeatureItem icon={LayoutDashboard} title="Echtzeit-Statistiken" description="Behalte das Wachstum deines Servers mit detaillierten Analysen im Auge." />
                            <FeatureItem icon={ShieldCheck} title="Sichere Moderation" description="Schütze deine Nutzer mit fortschrittlichen Filtern und automatischen Aktionen." />
                            <FeatureItem icon={Zap} title="Blitzschnelle Synchronisation" description="Änderungen werden verzögerungsfrei auf deinem Server übernommen." />
                        </div>

                        <div className="flex gap-8 text-xs font-black uppercase tracking-widest text-slate-500">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-primary opacity-60" />
                                Dutzende Server weltweit
                            </div>
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-primary opacity-60" />
                                Support-Community
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Login Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="w-full max-w-md mx-auto"
                    >
                        <div className="glass-strong border border-white/10 rounded-[3rem] p-8 md:p-10 relative overflow-hidden shadow-2xl shadow-black/50">
                            {/* Decorative top glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full filter blur-xl pointer-events-none -mr-16 -mt-16" />

                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4 shadow-inner">
                                    <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">System-Vorschau</span>
                                </div>
                                <h3 className="text-3xl font-black text-white leading-none tracking-tight mb-2 uppercase italic">
                                    Willkommen zurück
                                </h3>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                                    Logge dich ein, um deine Gilden zu verwalten
                                </p>
                            </div>

                            {/* Discord Button */}
                            <motion.button
                                onClick={handleDiscordLogin}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-2xl py-4 px-6 font-bold text-sm md:text-base cursor-pointer transition-all duration-300 shadow-lg shadow-[#5865F2]/20 border border-[#5865F2]/30 group"
                            >
                                <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                                    <svg viewBox="0 0 127.14 96.36" className="w-4 h-4 fill-white">
                                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.48,80.1a105.73,105.73,0,0,0,32.5,16.26,77.7,77.7,0,0,0,7.34-11.9,65.8,65.8,0,0,1-11.75-5.6c1,.74,2,1.5,3,2.25a74.16,74.16,0,0,0,64.14,0c1-.75,2-1.51,3-2.25a65.52,65.52,0,0,1-11.76,5.6,77.74,77.74,0,0,0,7.34,11.9,105.27,105.27,0,0,0,32.51-16.26c2.8-27.15-4.7-50.85-19.49-72.03ZM42.45,65.69c-6.22,0-11.41-5.71-11.41-12.67s5-12.67,11.41-12.67,11.41,5.71,11.41,12.67-5,12.67-11.41,12.67Zm42.24,0c-6.22,0-11.41-5.71-11.41-12.67s5.05-12.67,11.41-12.67,11.41,5.71,11.41,12.67-5,12.67-11.41,12.67Z" />
                                    </svg>
                                </div>
                                Logge dich über Discord ein
                                <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                            </motion.button>

                            {/* Divider */}
                            <div className="flex items-center my-6">
                                <div className="flex-1 h-[1px] bg-white/5" />
                                <span className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">ODER</span>
                                <div className="flex-1 h-[1px] bg-white/5" />
                            </div>

                            {/* Admin Login Form */}
                            {showAdminLogin && (
                                <motion.form
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    onSubmit={handleEmailLogin}
                                    className="space-y-4 mb-6"
                                >
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            placeholder="Admin E-Mail"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                            className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm outline-none transition-all placeholder:text-slate-600"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="password"
                                            placeholder="Passwort"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                            className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary/50 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm outline-none transition-all placeholder:text-slate-600"
                                        />
                                    </div>
                                    <motion.button
                                        type="submit"
                                        disabled={loading}
                                        whileHover={{ scale: loading ? 1 : 1.02 }}
                                        whileTap={{ scale: loading ? 1 : 0.98 }}
                                        className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 hover:border-primary/50 rounded-xl py-3.5 px-6 font-bold text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                                    >
                                        {loading ? "Wird geprüft..." : "Admin Login"}
                                    </motion.button>
                                </motion.form>
                            )}

                            {/* Preview Mode Selection */}
                            <div className="flex items-center mb-4">
                                <div className="flex-1 h-[1px] bg-white/5" />
                                <span className="px-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Vorschau Modus</span>
                                <div className="flex-1 h-[1px] bg-white/5" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {[
                                    { icon: Settings, label: "Einstellungen" },
                                    { icon: LayoutDashboard, label: "Module" }
                                ].map(({ icon: Icon, label }) => (
                                    <button
                                        key={label}
                                        disabled
                                        title="Logge dich ein, um dies zu nutzen"
                                        className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-500 text-xs font-semibold cursor-not-allowed transition-all hover:bg-white/[0.04] hover:border-white/10 group"
                                    >
                                        <Icon className="w-5 h-5 text-slate-500 group-hover:text-slate-400 transition-colors" />
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Security Notice */}
                            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    <strong className="text-white italic">ManagerX</strong> fragt nicht nach deinem Passwort. Der Login erfolgt sicher über das offizielle Discord OAuth2 System.
                                </p>
                            </div>
                        </div>

                        {/* Footer Links */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="mt-6 flex justify-center gap-6 text-xs text-slate-500 font-bold uppercase tracking-wider"
                        >
                            {[
                                { to: "/legal/privacy", label: "Datenschutz" },
                                { to: "/legal/terms", label: "AGB" },
                            ].map(({ to, label }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className="hover:text-white transition-colors duration-200"
                                >
                                    {label}
                                </Link>
                            ))}
                            <a
                                href="https://discord.gg/9T28DWup3g"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white transition-colors duration-200"
                            >
                                Hilfe
                            </a>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Static Bottom Branding */}
            <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none opacity-20 hidden md:block">
                <p className="text-[10px] font-black tracking-[0.4em] uppercase text-white">
                    © 2026 OPPRO.NET DEVELOPMENT | ManagerX Dashboard
                </p>
            </div>
        </div>
    );
}
