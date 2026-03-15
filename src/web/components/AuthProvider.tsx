import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
    token: string | null;
    user: any | null;
    guilds: any[];
    selectedGuildId: string | null;
    isAuthenticated: boolean;
    login: (token: string, user: any, discordToken?: string) => void;
    logout: () => void;
    setSelectedGuildId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const [user, setUser] = useState<any | null>(JSON.parse(localStorage.getItem("user") || "null"));
    const [guilds, setGuilds] = useState<any[]>([]);
    const [selectedGuildId, setSelectedGuildId] = useState<string | null>(localStorage.getItem("selectedGuildId"));

    const login = (newToken: string, newUser: any, newDiscordToken?: string) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        if (newDiscordToken) localStorage.setItem("discord_token", newDiscordToken);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setGuilds([]);
        setSelectedGuildId(null);
        localStorage.clear();
    };

    // --- AUTOMATISCHER CALLBACK-HANDLER ---
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const path = params.get("p");

        if (code && (window.location.pathname.includes("auth/callback") || path?.includes("/auth/callback"))) {
            const baseUrl = import.meta.env.VITE_API_URL || 'https://api.managerx-bot.de';
            
            fetch(`${baseUrl}/dashboard/auth/callback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code })
            })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                login(data.access_token, data.user, data.discord_token);
                window.history.replaceState({}, document.title, "/");
            })
            .catch(err => console.error("Login Error:", err));
        }
    }, []);

    // --- USER & GUILDS LADEN ---
    useEffect(() => {
        if (token) {
            const baseUrl = import.meta.env.VITE_API_URL || 'https://api.managerx-bot.de';
            fetch(`${baseUrl}/dashboard/auth/me`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "X-Discord-Token": localStorage.getItem("discord_token") || ""
                }
            })
            .then(res => res.status === 401 ? logout() : res.json())
            .then(data => {
                if (data?.user) setUser(data.user);
                if (data?.guilds) {
                    setGuilds(data.guilds);
                    if (!selectedGuildId && data.guilds.length > 0) {
                        setSelectedGuildId(data.guilds[0].id);
                        localStorage.setItem("selectedGuildId", data.guilds[0].id);
                    }
                }
            })
            .catch(() => logout());
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{
            token, user, guilds, selectedGuildId,
            isAuthenticated: !!token,
            login, logout, setSelectedGuildId: (id) => {
                setSelectedGuildId(id);
                localStorage.setItem("selectedGuildId", id);
            }
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext)!;
