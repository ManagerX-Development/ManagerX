import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../components/AuthProvider";
import { toast } from "sonner";

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get("code");

        if (!code) {
            setError("Kein Autorisierungscode gefunden. Bitte versuche es erneut.");
            return;
        }

        const handleAuth = async () => {
            try {
                // Adjust to your actual backend domain/port, 8040 is what the python API uses
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';
                const apiUrl = `${baseUrl}/dashboard/auth/callback`;

                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                });

                if (!response.ok) {
                    throw new Error("Authentifizierung fehlgeschlagen");
                }

                const data = await response.json();

                // data should contain access_token and user object
                login(data.access_token, data.user, data.discord_token);

                toast.success(`Willkommen zurück, ${data.user.username}!`);
                navigate("/dash/settings"); // Redirect to dashboard / settings
            } catch (err: any) {
                console.error("Auth Error:", err);
                setError(err.message || "Es gab ein Problem beim Anmelden.");
            }
        };

        handleAuth();
    }, [searchParams, navigate, login]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-8 rounded-3xl max-w-md w-full text-center space-y-6"
            >
                {error ? (
                    <>
                        <div className="w-16 h-16 mx-auto bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">⚠</span>
                        </div>
                        <h2 className="text-xl font-bold text-white">Login fehlgeschlagen</h2>
                        <p className="text-muted-foreground">{error}</p>
                        <button
                            onClick={() => navigate("/login")}
                            className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white text-sm"
                        >
                            Zurück zum Login
                        </button>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30 animate-pulse">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Authentifiziere...</h2>
                        <p className="text-muted-foreground text-sm">Bitte warte, während wir deine Sitzung mit Discord sichern.</p>
                    </>
                )}
            </motion.div>
        </div>
    );
}
