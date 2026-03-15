import React from "react";
import { useAuth } from "./AuthProvider";
import { ChevronDown, Server } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export default function GuildSelector() {
    const { guilds, selectedGuildId, setSelectedGuildId } = useAuth();

    const selectedGuild = guilds.find(g => g.id === selectedGuildId);

    if (guilds.length === 0) return null;

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all outline-none group">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/20 shadow-lg">
                        {selectedGuild?.icon ? (
                            <img
                                src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Server className="w-4 h-4 text-primary" />
                        )}
                    </div>
                    <div className="text-left hidden sm:block">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-tight">Server</p>
                        <p className="text-sm font-bold text-white max-w-[120px] truncate">{selectedGuild?.name || "Server wählen"}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="z-50 min-w-[220px] bg-[#1a1c1e] border border-white/5 rounded-2xl p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
                    sideOffset={8}
                    align="end"
                >
                    <DropdownMenu.Label className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/5 mb-1">
                        Deine Server
                    </DropdownMenu.Label>

                    {guilds.map((guild) => (
                        <DropdownMenu.Item
                            key={guild.id}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer outline-none transition-colors ${selectedGuildId === guild.id ? "bg-primary/20 text-white" : "hover:bg-white/5 text-white/70"
                                }`}
                            onClick={() => setSelectedGuildId(guild.id)}
                        >
                            <div className="w-6 h-6 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                                {guild.icon ? (
                                    <img
                                        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-[10px] font-bold">
                                        {guild.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <span className="text-sm font-medium truncate">{guild.name}</span>
                        </DropdownMenu.Item>
                    ))}

                    {guilds.length === 0 && (
                        <div className="px-3 py-4 text-center">
                            <p className="text-xs text-muted-foreground italic">Keine Server mit Bot gefunden.</p>
                        </div>
                    )}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
