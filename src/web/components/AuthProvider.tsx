import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
    id: string;
    username: string;
    avatar: string | null;
}

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
        if (newDiscordToken) {
            localStorage.setItem("discord_token", newDiscordToken);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setGuilds([]);
        setSelectedGuildId(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("discord_token");
        localStorage.removeItem("selectedGuildId");
    };

    const handleSetSelectedGuildId = (id: string) => {
        setSelectedGuildId(id);
        localStorage.setItem("selectedGuildId", id);
    };

    // Fetch guilds and validate session if authenticated
    useEffect(() => {
        if (token) {
            const discordToken = localStorage.getItem("discord_token");
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8040';

            fetch(`${baseUrl}/dashboard/auth/me`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "X-Discord-Token": discordToken || ""
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
                        // Select first guild if none selected
                        if (!selectedGuildId && data.guilds.length > 0) {
                            handleSetSelectedGuildId(data.guilds[0].id);
                        }
                    }
                })
                .catch(err => {
                    console.error("Auth me error:", err);
                });
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{
            token,
            user,
            guilds,
            selectedGuildId,
            isAuthenticated: !!token,
            login,
            logout,
            setSelectedGuildId: handleSetSelectedGuildId
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
