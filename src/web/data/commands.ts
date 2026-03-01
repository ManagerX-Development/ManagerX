import {
    ShieldCheck, Zap, Gamepad2, Users, Globe, Settings2, LayoutGrid,
    LucideIcon
} from "lucide-react";

export interface Category {
    id: string;
    title: string;
    icon: LucideIcon;
}

export interface Command {
    name: string;
    description: string;
    category: string;
    usage: string;
    badges: string[];
}

export const CATEGORIES: Category[] = [
    { id: "all", title: "Alle Befehle", icon: LayoutGrid },
    { id: "moderation", title: "Moderation", icon: ShieldCheck },
    { id: "management", title: "Management", icon: Settings2 },
    { id: "general", title: "Allgemein", icon: Zap },
    { id: "fun", title: "Entertainment", icon: Gamepad2 },
    { id: "stats", title: "Statistiken", icon: Users },
    { id: "global", title: "Global Chat", icon: Globe },
    { id: "admin", title: "Admin", icon: ShieldCheck },
];

export const COMMANDS: Command[] = [
    //////////////
    // Moderation
    //////////////
    {
        name: "ban",
        description: "Bannt ein Nutzer vom Server",
        category: "moderation",
        usage: "/mod ban [user] [reason] [notify_user]",
        badges: ["moderation"]
    },
    {
        name: "kick",
        description: "kickt einen Nutzer vom Server",
        category: "moderation",
        usage: "/mod kick [user] [reason] [notify_user]",
        badges: ["moderation"]
    },
    {
        name: "timeout",
        description: "Versetzt ein Mitglied in Timeout",
        category: "moderation",
        usage: "/mod timeout [member] [duration] [reason] [notify_user]",
        badges: ["moderation"]
    },
    {
        name: "untimeout",
        description: "Hebt einen Timeout auf",
        category: "moderation",
        usage: "/mod untimeout [member] [reason] [notify_user]",
        badges: ["moderation"]
    },
    {
        name: "slowmode",
        description: "Setzt den Slowmode für den aktuellen Channel",
        category: "moderation",
        usage: "/mod slowmode [duration] [reason]",
        badges: ["moderation"]
    },
    {
        name: "votekick",
        description: "Startet eine Votekick-Abstimmung für ein Mitglied",
        category: "moderation",
        usage: "/mod votekick [member] [reason] [duration]",
        badges: ["moderation"]
    },
    ////////
    // Moderation - AntiSpam
    ///////
    {
        name: "setup",
        description: "Richte das Anti-Spam-System ein.",
        category: "moderation",
        usage: "/antispam setup [log_channel] [max_messages] [time_frame]",
        badges: ["antispam", "owner"]
    },
    {
        name: "set",
        description: "Ändere die Anti-Spam-Parameter.",
        category: "moderation",
        usage: "/antispam set [max_messages] [time_frame]",
        badges: ["antispam", "owner"]
    },
    {
        name: "log-channel",
        description: "Ändere den Log-Channel.",
        category: "moderation",
        usage: "/antispam log-channel [log_channel]",
        badges: ["antispam", "owner"]
    },
    {
        name: "logs",
        description: "Zeige Anti-Spam-Logs an.",
        category: "moderation",
        usage: "antispam logs",
        badges: ["antispam", "owner"]
    },
    {
        name: "clear",
        description: "Lösche alle Anti-Spam-Logs für diesen Server.",
        category: "moderation",
        usage: "/antispam clear",
        badges: ["antispam", "owner"]
    },
    {
        name: "whitelist",
        description: "Füge einen Benutzer zur Whitelist hinzu.",
        category: "moderation",
        usage: "/antispam whitelist [user]",
        badges: ["antispam", "owner"]
    },
    {
        name: "disable",
        description: "Deaktiviere das Anti-Spam-System",
        category: "moderation",
        usage: "/antispam disable",
        badges: ["antispam", "owner"]
    },

];
