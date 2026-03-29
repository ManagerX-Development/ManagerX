import * as React from "react";
import { Check, ChevronsUpDown, Hash, Shield, Search, Volume2, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Option {
    id: string;
    name: string;
    color?: string;
    type?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    emptyText?: string;
    type?: "channel" | "role" | "voice" | "category";
    className?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Auswählen...",
    emptyText = "Nichts gefunden.",
    type = "channel",
    className,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false);

    const selectedOption = options.find((option) => option.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/50 text-white rounded-xl h-12 px-4 transition-all",
                        className
                    )}
                >
                    <div className="flex items-center gap-2 truncate">
                        {selectedOption ? (
                            <>
                                {type === "channel" && <Hash className="w-4 h-4 text-primary/70 shrink-0" />}
                                {type === "voice" && <Volume2 className="w-4 h-4 text-primary/70 shrink-0" />}
                                {type === "category" && <Folder className="w-4 h-4 text-primary/70 shrink-0" />}
                                {type === "role" && (
                                    <div
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: (selectedOption.color && selectedOption.color !== "#000000") ? selectedOption.color : "#99aab5" }}
                                    />
                                )}
                                <span className="truncate">{selectedOption.name}</span>
                            </>
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#1a1c1e] border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                <Command className="bg-transparent">
                    <CommandInput placeholder={`${placeholder} suchen...`} className="h-12 border-none focus:ring-0" />
                    <CommandList className="max-h-64 scrollbar-thin scrollbar-thumb-white/10">
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.id}
                                    value={option.name}
                                    onSelect={() => {
                                        onChange(option.id === value ? "" : option.id);
                                        setOpen(false);
                                    }}
                                    className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-primary/10 aria-selected:bg-primary/20 transition-colors"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 text-primary transition-opacity",
                                            value === option.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {type === "channel" && <Hash className="w-4 h-4 text-primary/70 shrink-0" />}
                                    {type === "voice" && <Volume2 className="w-4 h-4 text-primary/70 shrink-0" />}
                                    {type === "category" && <Folder className="w-4 h-4 text-primary/70 shrink-0" />}
                                    {type === "role" && (
                                        <div
                                            className="w-3 h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: (option.color && option.color !== "#000000") ? option.color : "#99aab5" }}
                                        />
                                    )}
                                    <span className="truncate flex-1 text-white/90">{option.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
