import { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Github, Twitter, Globe, Heart, Shield, Code2, Sparkles, Coffee, Youtube, Instagram } from "lucide-react";
import { API_URL } from "../lib/api";
import { SEO } from "../components/layout/SEO";

export const TeamPage = memo(function TeamPage() {
    const [members, setMembers] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resTeam, resCat] = await Promise.all([
                    fetch(`${API_URL}/dashboard/cms/team`),
                    fetch(`${API_URL}/dashboard/cms/team-categories`)
                ]);
                const jsonTeam = await resTeam.json();
                const jsonCat = await resCat.json();
                if (jsonTeam.success) setMembers(jsonTeam.data);
                if (jsonCat.success) setCategories(jsonCat.data);
            } catch (err) {
                console.error("Failed to fetch team data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const renderMemberCard = (member: any, idx: number) => (
        <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden group"
        >
            <div className={member.color + " absolute top-0 left-0 w-2 h-full opacity-50"} />
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className={member.color + " w-24 h-24 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-2xl relative z-10"}>
                    {member.avatar}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-black text-white italic tracking-tight mb-2 group-hover:text-primary transition-colors truncate">{member.name}</h3>
                    <div className="text-primary text-xs font-black uppercase tracking-widest mb-4">{member.role}</div>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium mb-6 line-clamp-3">
                        {member.bio}
                    </p>
                    <div className="flex flex-wrap gap-4">
                        {member.github && (
                            <a href={member.github} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all" title="GitHub">
                                <Github className="w-5 h-5" />
                            </a>
                        )}
                        {member.youtube && (
                            <a href={member.youtube} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-[#FF0000] hover:bg-white/10 transition-all" title="YouTube">
                                <Youtube className="w-5 h-5" />
                            </a>
                        )}
                        {member.instagram && (
                            <a href={member.instagram} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-[#E4405F] hover:bg-white/10 transition-all" title="Instagram">
                                <Instagram className="w-5 h-5" />
                            </a>
                        )}
                        {member.twitter && (
                            <a href={member.twitter} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-[#1DA1F2] hover:bg-white/10 transition-all" title="Twitter">
                                <Twitter className="w-5 h-5" />
                            </a>
                        )}
                        {member.website && (
                            <a href={member.website} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-primary hover:bg-white/10 transition-all" title="Website">
                                <Globe className="w-5 h-5" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-300 flex flex-col font-sans selection:bg-primary/30">
            <SEO
                title="Team"
                description="Lerne das Team hinter ManagerX kennen. Die Köpfe hinter dem Bot."
            />
            <Navbar />

            <main className="flex-grow container mx-auto px-4 pt-48 pb-24">
                <header className="max-w-4xl mx-auto text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-center gap-4 text-primary mb-6"
                    >
                        <Heart className="w-6 h-6 text-primary fill-primary animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-[0.4em]">Das Team hinter ManagerX</span>
                    </motion.div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.9] mb-8">
                        Hinter den <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">Kulissen</span>
                    </h1>
                    <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        ManagerX ist mehr als nur Code – es ist eine Vision für sicherere und smartere Discord-Communities.
                    </p>
                </header>

                <div className="max-w-5xl mx-auto mb-32 space-y-24">
                    {loading ? (
                         <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                         </div>
                    ) : (
                        <>
                            {/* Render members with a category */}
                            {categories.map(cat => {
                                const catMembers = members.filter(m => m.category_id === cat.id);
                                if (catMembers.length === 0) return null;
                                return (
                                    <section key={cat.id}>
                                        <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter mb-10 border-b border-white/5 pb-6">
                                            <span className="text-primary mr-4">//</span>{cat.name}
                                        </h2>
                                        <div className="grid md:grid-cols-2 gap-8">
                                            {catMembers.map((member, idx) => renderMemberCard(member, idx))}
                                        </div>
                                    </section>
                                );
                            })}
                            
                            {/* Render members without a category */}
                            {members.filter(m => !m.category_id).length > 0 && (
                                <section>
                                    {categories.length > 0 && (
                                        <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter mb-10 border-b border-white/5 pb-6">
                                            <span className="text-primary mr-4">//</span>Weiteres Team
                                        </h2>
                                    )}
                                    <div className="grid md:grid-cols-2 gap-8">
                                        {members.filter(m => !m.category_id).map((member, idx) => renderMemberCard(member, idx))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>

                <section className="max-w-4xl mx-auto py-24 border-y border-white/5">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Unsere Werte</h2>
                        <div className="h-1 w-24 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
                    </div>
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h4 className="text-lg font-black text-white uppercase mb-3">Sicherheit</h4>
                            <p className="text-sm text-slate-400 font-medium">Datenschutz steht bei uns an erster Stelle. Jede Zeile Code wird auf Sicherheit geprüft.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto mb-6">
                                <Code2 className="w-8 h-8" />
                            </div>
                            <h4 className="text-lg font-black text-white uppercase mb-3">Open Source</h4>
                            <p className="text-sm text-slate-400 font-medium">Wir glauben an Transparenz. Fast unser gesamtes Ökosystem ist für jeden einsehbar.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <h4 className="text-lg font-black text-white uppercase mb-3">Innovation</h4>
                            <p className="text-sm text-slate-400 font-medium">Ständig am Puls der Zeit mit neuen Features wie AI-gestützten Moderations-Tools.</p>
                        </div>
                    </div>
                </section>

                <section className="mt-32 text-center">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex flex-col items-center gap-6 p-12 glass rounded-[3rem] border border-primary/20 relative overflow-hidden"
                    >
                        <Coffee className="w-12 h-12 text-primary" />
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Willst du beitragen?</h3>
                        <p className="text-slate-400 font-medium max-w-sm">Wir freuen uns immer über Hilfe von GitHub-Entwicklern oder kreatives Feedback.</p>
                        <a href="https://github.com/ManagerX-Development/ManagerX" className="px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                            GitHub Repository
                        </a>
                    </motion.div>
                </section>
            </main>

            <Footer />
        </div>
    );
});

export default TeamPage;
