import {
    Rocket, CheckCircle2, CircleDashed, Clock, Sparkles,
    MessageSquare, ShieldAlert, Zap, Globe, Cpu, LucideIcon
} from "lucide-react";

export interface RoadmapItem {
    title: string;
    status: "completed" | "in-progress" | "planned";
    description: string;
    icon: LucideIcon;
    date: string;
}

export const ROADMAP_ITEMS: RoadmapItem[] = [
    {
        title: "Version 2.0 Launch",
        status: "in-progress",
        description: "Launch der neuen Dashboard-Technologie und des optimierten Python Cores.",
        icon: Rocket,
        date: "Q1 2026"
    },
    {
        title: "Web-Dashboard Update",
        status: "in-progress",
        description: "Synchronere Einstellungen zwischen Discord und dieser Website.",
        icon: Cpu,
        date: "In Entwicklung"
    },
    {
        title: "Plugin Marktplatz",
        status: "planned",
        description: "Entdecke und lade neue Cogs direkt über die Community.",
        icon: Zap,
        date: "Q2 2026"
    },
    {
        title: "Levelsystem Erweiterung",
        status: "planned",
        description: "Belohnungen, Shop-System und Voice-Activity Tracking.",
        icon: Sparkles,
        date: "Q3 2026"
    }
];
