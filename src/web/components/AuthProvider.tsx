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

import { API_URL } from "../lib/api";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const getSafeItem = (key: string) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn(`Error reading ${key} from localStorage:`, e);
            return null;
        }
    };

    const getSafeJSON = (key: string) => {
        const item = getSafeItem(key);
        if (!item) return null;
        try {
            return JSON.parse(item);
        } catch (e) {
            console.error(`Error parsing ${key} from localStorage:`, e);
            localStorage.removeItem(key); // Clear corrupted data
            return null;
        }
    };

    const [token, setToken] = useState<string | null>(getSafeItem("token"));
    const [user, setUser] = useState<any | null>(getSafeJSON("user"));
    const [guilds, setGuilds] = useState<any[]>([]);
    const [selectedGuildId, setSelectedGuildId] = useState<string | null>(getSafeItem("selectedGuildId"));

    const login = (newToken: string, newUser: any, newDiscordToken?: string) => {
        setToken(newToken);
        setUser(newUser);
        try {
            localStorage.setItem("token", newToken);
            localStorage.setItem("user", JSON.stringify(newUser));
            if (newDiscordToken) localStorage.setItem("discord_token", newDiscordToken);
        } catch (e) {
            console.error("Error saving to localStorage:", e);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setGuilds([]);
        setSelectedGuildId(null);
        try {
            localStorage.clear();
        } catch (e) {
            console.error("Error clearing localStorage:", e);
        }
    };

    // --- AUTOMATISCHER CALLBACK-HANDLER ---
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const path = params.get("p");

        if (code && (window.location.pathname.includes("auth/callback") || path?.includes("/auth/callback"))) {
            fetch(`${API_URL}/dashboard/auth/callback`, {
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
            fetch(`${API_URL}/dashboard/auth/me`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "X-Discord-Token": localStorage.getItem("discord_token") || ""
                }
            })

                .then(async (res) => {
                    if (res.status === 401) {
                        logout();
                        throw new Error("Session expired");
                    }
                    if (!res.ok) throw new Error("Failed to fetch user data");
                    return res.json();
                })
                .then(data => {
                    if (data.user) setUser(data.user);
                    if (data.guilds) {
                        setGuilds(data.guilds);
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
                try {
                    localStorage.setItem("selectedGuildId", id);
                } catch (e) {
                    console.error("Error saving selectedGuildId to localStorage:", e);
                }
            }
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext)!;
