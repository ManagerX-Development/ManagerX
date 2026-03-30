import { memo } from "react";
import { motion } from "framer-motion";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import {
    Rocket, CheckCircle2, CircleDashed, Clock, Sparkles,
    MessageSquare, ShieldAlert, Zap, Globe, Cpu
} from "lucide-react";
import { cn } from "../lib/utils";
import { ROADMAP_ITEMS } from "../data/roadmap";
import { SEO } from "../components/SEO";

const StatusBadge = ({ status }: { status: string }) => {
    const configs: { [key: string]: { label: string, color: string, icon: any } } = {
        completed: { label: "Abgeschlossen", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
        "in-progress": { label: "In Arbeit", color: "text-primary bg-primary/10 border-primary/20", icon: CircleDashed },
        planned: { label: "Geplant", color: "text-slate-500 bg-white/5 border-white/10", icon: Clock }
    };
    const config = configs[status] || configs.planned;
    const Icon = config.icon;

    return (
        <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", config.color)}>
            <Icon className="w-3 h-3" />
            {config.label}
        </div>
    );
};

export const RoadmapPage = memo(function RoadmapPage() {
    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-300 flex flex-col font-sans selection:bg-primary/30">
            <SEO
                title="Roadmap"
                description="Unsere Pläne für die Zukunft von ManagerX. Meilensteine und kommende Features."
            />
            <Navbar />

            <main className="flex-grow container mx-auto px-4 pt-48 pb-24">
                <header className="max-w-4xl mx-auto text-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-center gap-4 text-primary mb-6"
                    >
                        <Rocket className="w-6 h-6 text-primary animate-bounce" />
                        <span className="text-xs font-black uppercase tracking-[0.4em]">Zukunft von ManagerX</span>
                    </motion.div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.9] mb-8">
                        Unsere <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">Roadmap</span>
                    </h1>
                    <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        Wir bauen den Discord-Bot der nächsten Generation. Bleib auf dem Laufenden über unsere aktuellen Meilensteine.
                    </p>
                </header>

                <section className="relative max-w-4xl mx-auto">
                    {/* Timeline Connector */}
                    <div className="absolute left-[39px] md:left-1/2 top-4 bottom-4 w-px bg-white/5 md:-translate-x-1/2" />

                    <div className="space-y-24">
                        {ROADMAP_ITEMS.map((item, idx) => {
                            const Icon = item.icon;
                            const isEven = idx % 2 === 0;

                            return (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    className={cn(
                                        "relative flex flex-col md:flex-row items-center gap-12",
                                        isEven ? "md:flex-row" : "md:flex-row-reverse"
                                    )}
                                >
                                    {/* Icon Node */}
                                    <div className="absolute left-0 md:left-1/2 top-0 md:top-1/2 w-20 h-20 rounded-3xl bg-[#111318] border border-white/10 flex items-center justify-center text-primary shadow-2xl z-20 md:-translate-x-1/2 md:-translate-y-1/2 group">
                                        <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Icon className="w-10 h-10 relative z-10" />
                                    </div>

                                    {/* Content Card */}
                                    <div className={cn(
                                        "flex-1 w-full md:w-auto mt-24 md:mt-0",
                                        isEven ? "md:text-right" : "md:text-left"
                                    )}>
                                        <div className={cn(
                                            "glass p-10 rounded-[2.5rem] border border-white/5 relative group hover:bg-white/[0.08] transition-all",
                                            isEven ? "md:mr-10" : "md:ml-10"
                                        )}>
                                            <div className="mb-4 flex flex-wrap gap-4 items-center md:contents">
                                                <StatusBadge status={item.status} />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest md:block md:mt-2">{item.date}</span>
                                            </div>
                                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mt-4 mb-3">{item.title}</h3>
                                            <p className="text-slate-400 font-medium leading-relaxed italic">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Spacer for MD screens to keep alignment */}
                                    <div className="hidden md:block flex-1" />
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                <section className="mt-48 text-center p-16 glass rounded-[4rem] border border-white/5 max-w-4xl mx-auto overflow-hidden relative">
                    <div className="absolute inset-0 bg-primary/5 opacity-50 blur-[100px]" />
                    <MessageSquare className="w-12 h-12 text-accent mx-auto mb-8" />
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-6 relative z-10">Hast du eigene Ideen?</h2>
                    <p className="text-slate-400 font-medium max-w-md mx-auto mb-10 relative z-10">
                        ManagerX wird für euch entwickelt. Schlag uns neue Features auf unserem Support-Server vor!
                    </p>
                    <a href="https://discord.gg/9T28DWup3g" className="relative z-10 px-10 py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-accent/20">
                        Feedback geben
                    </a>
                </section>
            </main>

            <Footer />
        </div>
    );
});

export default RoadmapPage;
