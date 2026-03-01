export interface TeamMember {
    name: string;
    role: string;
    bio: string;
    avatar: string;
    github: string;
    youtube?: string;
    instagram?: string;
    website?: string;
    color: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
    {
        name: "LennyPegauOfficial",
        role: "Lead Developer & Visionary",
        bio: "Architekt hinter ManagerX. Leidenschaftlicher Python-Entwickler und Discord-Enthusiast.",
        avatar: "L",
        github: "https://github.com/Medicopter117",
        youtube: "https://youtube.com/@LennyPegauOfficial117",
        instagram: "https://instagram.com/LennyPegauOfficial",
        website: "https://oppro-network.de",
        color: "from-primary to-accent"
    },
    {
        name: "Open Source Community",
        role: "Contributors",
        bio: "ManagerX lebt durch die Hilfe von talentierten Entwicklern weltweit.",
        avatar: "OS",
        github: "https://github.com/ManagerX-Development",
        color: "from-blue-500 to-cyan-500"
    }
];
