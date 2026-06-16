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
import { useAuth } from "../../components/core/AuthProvider";
import { API_URL } from "../../lib/api";

const FeatureItem = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1rem", borderRadius: "1rem", transition: "background 0.2s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
        <div style={{
            width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem",
            background: "rgba(220,38,38,0.12)", display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0
        }}>
            <Icon style={{ width: "1.25rem", height: "1.25rem", color: "hsl(0 84% 55%)" }} />
        </div>
        <div>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "white", marginBottom: "0.25rem" }}>{title}</h4>
            <p style={{ fontSize: "0.75rem", color: "hsl(240 5% 65%)", lineHeight: 1.6 }}>{description}</p>
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
        <div style={{
            minHeight: "100vh",
            background: "hsl(240 10% 2%)",
            color: "hsl(0 0% 98%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            position: "relative",
            overflow: "hidden",
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Background gradients */}
            <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(circle at 50% 0%, rgba(220,38,38,0.12) 0%, transparent 50%)",
                pointerEvents: "none"
            }} />
            <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(circle at 0% 100%, rgba(220,38,38,0.05) 0%, transparent 40%)",
                pointerEvents: "none"
            }} />

            {/* Floating blobs */}
            <div style={{
                position: "absolute", top: "25%", left: "-5rem",
                width: "16rem", height: "16rem",
                background: "rgba(220,38,38,0.2)", borderRadius: "50%",
                filter: "blur(100px)", animation: "pulse 2s ease-in-out infinite",
                pointerEvents: "none"
            }} />
            <div style={{
                position: "absolute", bottom: "25%", right: "-5rem",
                width: "16rem", height: "16rem",
                background: "rgba(255,80,80,0.1)", borderRadius: "50%",
                filter: "blur(100px)", animation: "pulse 2.5s ease-in-out infinite",
                pointerEvents: "none"
            }} />

            <div style={{ width: "100%", maxWidth: "72rem", position: "relative", zIndex: 10 }}>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "3rem",
                    alignItems: "center"
                }}
                    className="login-grid"
                >
                    {/* Left: Branding */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        style={{ display: "none" }}
                        className="login-left"
                    >
                        <div style={{ marginBottom: "2rem" }}>
                            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", marginBottom: "1rem" }}>
                                <div style={{
                                    width: "3rem", height: "3rem", borderRadius: "1rem",
                                    background: "linear-gradient(135deg, hsl(0 84% 55%), hsl(0 100% 65%))",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: "0 20px 40px -10px rgba(220,38,38,0.3)"
                                }}>
                                    <Shield style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
                                </div>
                                <div>
                                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                                        Manager<span style={{ color: "hsl(0 84% 55%)" }}>X</span>
                                    </h1>
                                    <p style={{ fontSize: "0.6rem", color: "hsl(240 5% 65%)", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.5, margin: 0 }}>Dashboard</p>
                                </div>
                            </Link>

                            <h2 style={{
                                fontSize: "clamp(2rem, 4vw, 3.25rem)", fontWeight: 800,
                                lineHeight: 1.1, margin: "0 0 1rem 0",
                                fontFamily: "'Space Grotesk', sans-serif"
                            }}>
                                Verwalte dein Universum <br />
                                <span style={{
                                    backgroundImage: "linear-gradient(135deg, hsl(0 84% 55%), hsl(0 100% 65%))",
                                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                                    backgroundClip: "text"
                                }}>mit Leichtigkeit.</span>
                            </h2>
                            <p style={{ fontSize: "1.1rem", color: "hsl(240 5% 65%)", maxWidth: "28rem", lineHeight: 1.6, margin: 0 }}>
                                Erlebe volle Kontrolle über deine Community. Schnell, sicher und intuitiv –
                                direkt in deinem Browser.
                            </p>
                        </div>

                        <div>
                            <FeatureItem icon={LayoutDashboard} title="Echtzeit-Statistiken" description="Behalte das Wachstum deines Servers mit detaillierten Analysen im Auge." />
                            <FeatureItem icon={ShieldCheck} title="Sichere Moderation" description="Schütze deine Nutzer mit fortschrittlichen Filtern und automatischen Aktionen." />
                            <FeatureItem icon={Zap} title="Blitzschnell" description="Keine Ladezeiten. Änderungen werden sofort auf deinem Server übernommen." />
                        </div>

                        <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.5rem", fontSize: "0.875rem", color: "hsl(240 5% 65%)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Globe style={{ width: "1rem", height: "1rem", color: "rgba(220,38,38,0.6)" }} />
                                Dutzende Server weltweit
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <MessageSquare style={{ width: "1rem", height: "1rem", color: "rgba(220,38,38,0.6)" }} />
                                Support-Community
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Login Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        style={{ width: "100%", maxWidth: "28rem", margin: "0 auto" }}
                    >
                        <div style={{
                            background: "rgba(20, 20, 30, 0.6)",
                            backdropFilter: "blur(24px)",
                            WebkitBackdropFilter: "blur(24px)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "2.5rem",
                            padding: "2.5rem",
                            position: "relative",
                            overflow: "hidden",
                            boxShadow: "0 40px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(220,38,38,0.05)"
                        }}>
                            <div style={{
                                position: "absolute", top: 0, right: 0,
                                width: "8rem", height: "8rem",
                                background: "rgba(220,38,38,0.08)",
                                borderRadius: "50%", filter: "blur(50px)",
                                marginRight: "-4rem", marginTop: "-4rem",
                                pointerEvents: "none"
                            }} />

                            {/* Header */}
                            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                                <div style={{
                                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                    padding: "0.25rem 0.75rem", borderRadius: "9999px",
                                    background: "rgba(220,38,38,0.08)",
                                    border: "1px solid rgba(220,38,38,0.2)",
                                    marginBottom: "1rem"
                                }}>
                                    <Sparkles style={{ width: "0.875rem", height: "0.875rem", color: "hsl(0 84% 55%)" }} />
                                    <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "hsl(0 84% 55%)" }}>System-Vorschau</span>
                                </div>
                                <h3 style={{ fontSize: "1.875rem", fontWeight: 700, color: "white", margin: "0 0 0.5rem 0", fontFamily: "'Space Grotesk', sans-serif" }}>
                                    Willkommen zurück
                                </h3>
                                <p style={{ fontSize: "0.875rem", color: "hsl(240 5% 65%)", margin: 0 }}>
                                    Logge dich ein, um dein Dashboard zu verwalten
                                </p>
                            </div>

                            {/* Discord Button */}
                            <motion.button
                                onClick={handleDiscordLogin}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    width: "100%", display: "flex", alignItems: "center",
                                    justifyContent: "center", gap: "0.75rem",
                                    background: "#5865F2", color: "white",
                                    border: "none", borderRadius: "1rem",
                                    padding: "1rem 1.5rem", fontWeight: 700, fontSize: "1rem",
                                    cursor: "pointer", transition: "background 0.2s",
                                    boxShadow: "0 20px 40px -10px rgba(88,101,242,0.4)"
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#4752C4")}
                                onMouseLeave={e => (e.currentTarget.style.background = "#5865F2")}
                            >
                                <div style={{
                                    width: "1.5rem", height: "1.5rem", background: "rgba(255,255,255,0.15)",
                                    borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center"
                                }}>
                                    <svg viewBox="0 0 127.14 96.36" style={{ width: "1rem", height: "1rem", fill: "white" }}>
                                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.48,80.1a105.73,105.73,0,0,0,32.5,16.26,77.7,77.7,0,0,0,7.34-11.9,65.8,65.8,0,0,1-11.75-5.6c1,.74,2,1.5,3,2.25a74.16,74.16,0,0,0,64.14,0c1-.75,2-1.51,3-2.25a65.52,65.52,0,0,1-11.76,5.6,77.74,77.74,0,0,0,7.34,11.9,105.27,105.27,0,0,0,32.51-16.26c2.8-27.15-4.7-50.85-19.49-72.03ZM42.45,65.69c-6.22,0-11.41-5.71-11.41-12.67s5-12.67,11.41-12.67,11.41,5.71,11.41,12.67-5,12.67-11.41,12.67Zm42.24,0c-6.22,0-11.41-5.71-11.41-12.67s5.05-12.67,11.41-12.67,11.41,5.71,11.41,12.67-5,12.67-11.41,12.67Z" />
                                    </svg>
                                </div>
                                Logge dich über Discord ein
                                <ArrowRight style={{ width: "1.25rem", height: "1.25rem", opacity: 0.7 }} />
                            </motion.button>

                            {/* Divider */}
                            <div style={{ display: "flex", alignItems: "center", margin: "1.5rem 0" }}>
                                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                                <span style={{ padding: "0 1rem", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)" }}>ODER</span>
                                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                            </div>

                            {/* Admin Login (hidden by default) */}
                            {showAdminLogin && (
                                <motion.form
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    onSubmit={handleEmailLogin}
                                    style={{ marginBottom: "1.5rem" }}
                                >
                                    <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                                        <Mail style={{
                                            position: "absolute", left: "1rem", top: "50%",
                                            transform: "translateY(-50%)", width: "1rem", height: "1rem",
                                            color: "hsl(240 5% 65%)"
                                        }} />
                                        <input
                                            type="email"
                                            placeholder="Admin E-Mail"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                            style={{
                                                width: "100%", boxSizing: "border-box",
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "1rem", padding: "0.875rem 1rem 0.875rem 3rem",
                                                color: "white", fontSize: "0.875rem", outline: "none",
                                                transition: "border-color 0.2s"
                                            }}
                                            onFocus={e => (e.target.style.borderColor = "rgba(220,38,38,0.5)")}
                                            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                                        />
                                    </div>
                                    <div style={{ position: "relative", marginBottom: "1rem" }}>
                                        <Lock style={{
                                            position: "absolute", left: "1rem", top: "50%",
                                            transform: "translateY(-50%)", width: "1rem", height: "1rem",
                                            color: "hsl(240 5% 65%)"
                                        }} />
                                        <input
                                            type="password"
                                            placeholder="Passwort"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                            style={{
                                                width: "100%", boxSizing: "border-box",
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "1rem", padding: "0.875rem 1rem 0.875rem 3rem",
                                                color: "white", fontSize: "0.875rem", outline: "none",
                                                transition: "border-color 0.2s"
                                            }}
                                            onFocus={e => (e.target.style.borderColor = "rgba(220,38,38,0.5)")}
                                            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                                        />
                                    </div>
                                    <motion.button
                                        type="submit"
                                        disabled={loading}
                                        whileHover={{ scale: loading ? 1 : 1.02 }}
                                        whileTap={{ scale: loading ? 1 : 0.98 }}
                                        style={{
                                            width: "100%", background: "rgba(220,38,38,0.15)",
                                            border: "1px solid rgba(220,38,38,0.3)", borderRadius: "1rem",
                                            padding: "0.875rem 1.5rem", color: "white", fontWeight: 700,
                                            cursor: loading ? "not-allowed" : "pointer", fontSize: "0.9rem",
                                            opacity: loading ? 0.6 : 1, transition: "all 0.2s"
                                        }}
                                    >
                                        {loading ? "Wird geprüft..." : "Admin Login"}
                                    </motion.button>
                                </motion.form>
                            )}

                            {/* Preview mode buttons */}
                            <div style={{ display: "flex", alignItems: "center", margin: "0 0 1rem 0" }}>
                                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                                <span style={{ padding: "0 1rem", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.15)" }}>VORSCHAU MODUS</span>
                                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
                                {[
                                    { icon: Settings, label: "Einstellungen" },
                                    { icon: LayoutDashboard, label: "Module" }
                                ].map(({ icon: Icon, label }) => (
                                    <button
                                        key={label}
                                        style={{
                                            display: "flex", flexDirection: "column", alignItems: "center",
                                            gap: "0.5rem", padding: "1rem", borderRadius: "1rem",
                                            background: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                            color: "hsl(240 5% 65%)", fontSize: "0.75rem", fontWeight: 600,
                                            cursor: "pointer", filter: "grayscale(1)", transition: "all 0.2s"
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.filter = "grayscale(0)";
                                            e.currentTarget.style.borderColor = "rgba(220,38,38,0.3)";
                                            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.filter = "grayscale(1)";
                                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                                            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                                        }}
                                    >
                                        <Icon style={{ width: "1.25rem", height: "1.25rem" }} />
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Security notice */}
                            <div style={{
                                display: "flex", alignItems: "flex-start", gap: "0.75rem",
                                padding: "1rem", borderRadius: "1rem",
                                background: "rgba(220,38,38,0.05)",
                                border: "1px solid rgba(220,38,38,0.1)"
                            }}>
                                <Lock style={{ width: "1.25rem", height: "1.25rem", color: "hsl(0 84% 55%)", flexShrink: 0, marginTop: "0.1rem" }} />
                                <p style={{ fontSize: "0.7rem", color: "hsl(240 5% 65%)", lineHeight: 1.6, margin: 0 }}>
                                    <strong style={{ color: "white", fontStyle: "italic" }}>ManagerX</strong> fragt nicht nach deinem Passwort.
                                    Der Login erfolgt sicher über das offizielle Discord OAuth2 System.
                                </p>
                            </div>
                        </div>

                        {/* Footer links */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            style={{ marginTop: "2rem", display: "flex", justifyContent: "center", gap: "1.5rem" }}
                        >
                            {[
                                { to: "/legal/privacy", label: "Datenschutz" },
                                { to: "/legal/terms", label: "Nutzungsbedingungen" },
                            ].map(({ to, label }) => (
                                <Link key={to} to={to} style={{ fontSize: "0.75rem", color: "hsl(240 5% 65%)", textDecoration: "none", transition: "color 0.2s" }}
                                    onMouseEnter={e => (e.currentTarget.style.color = "white")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "hsl(240 5% 65%)")}
                                >{label}</Link>
                            ))}
                            <a href="https://discord.gg/9T28DWup3g" target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: "0.75rem", color: "hsl(240 5% 65%)", textDecoration: "none", transition: "color 0.2s" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "white")}
                                onMouseLeave={e => (e.currentTarget.style.color = "hsl(240 5% 65%)")}
                            >Hilfe erhalten</a>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                position: "absolute", bottom: "1.5rem", left: 0, right: 0,
                textAlign: "center", pointerEvents: "none", opacity: 0.15
            }}>
                <p style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: "white", margin: 0 }}>
                    © 2026 OPPRO.NET DEVELOPMENT | ManagerX Dashboard
                </p>
            </div>

            <style>{`
                @media (min-width: 1024px) {
                    .login-grid {
                        grid-template-columns: 1fr 1fr !important;
                    }
                    .login-left {
                        display: block !important;
                    }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                input::placeholder { color: rgba(255,255,255,0.3); }
            `}</style>
        </div>
    );
}
