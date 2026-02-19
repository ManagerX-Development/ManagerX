import { useState, useEffect } from "react";

interface StatsData {
    uptime: string;
    latency: string;
    guilds: number;
    users: number;
    bot_name: string;
    bot_id: number | null;
    status: string;
    database: string;
}

export const useStats = () => {
    const [data, setData] = useState<StatsData>({
        uptime: "--",
        latency: "--",
        guilds: 0,
        users: 0,
        bot_name: "ManagerX",
        bot_id: null,
        status: "loading",
        database: "disconnected"
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch("https://api.managerx-bot.de/v1/managerx/stats");
                if (!response.ok) throw new Error("Offline");

                const result = await response.json();
                setData({
                    uptime: result.uptime || "--",
                    latency: result.latency || "--",
                    guilds: result.guilds || 0,
                    users: result.users || 0,
                    bot_name: result.bot_name || "ManagerX",
                    bot_id: result.bot_id || null,
                    status: result.status || "online",
                    database: result.database || "disconnected"
                });
                setIsLoading(false);
            } catch (error) {
                setData((prev) => ({ ...prev, status: "offline", latency: "--", database: "disconnected" }));
                setIsLoading(false);
            }
        };

        fetchStats();
        // Optional: Alle 30 Sekunden aktualisieren
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    return { data, isLoading };
};
