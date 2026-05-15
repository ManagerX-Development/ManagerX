import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Newspaper, 
  BookOpen, 
  Search, 
  Tag, 
  Calendar, 
  User as UserIcon, 
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Eye,
  Megaphone,
  Bell,
  Terminal
} from "lucide-react";
import { API_URL } from "../lib/api";
import { cn } from "../lib/utils";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { PremiumMarkdown } from "../components/core/PremiumMarkdown";

interface Post {
  id: number;
  post_type: 'dev' | 'tutorial' | 'changelog' | 'announcement' | 'news';
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  author_id: string;
  author_name: string;
  tags: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const TYPE_CONFIG = {
  dev:          { label: 'Dev Update',   icon: Terminal,   color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  tutorial:     { label: 'Tutorial',     icon: BookOpen,   color: 'text-purple-400', bg: 'bg-purple-500/10' },
  changelog:    { label: 'Changelog',    icon: Terminal,   color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  announcement: { label: 'Ankündigung', icon: Megaphone,  color: 'text-rose-400',   bg: 'bg-rose-500/10' },
  news:         { label: 'News',         icon: Bell,       color: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
};

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'dev' | 'tutorial' | 'changelog'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [availableTags, setAvailableTags] = useState<any[]>([]);

  const postSlug = searchParams.get("post");

  useEffect(() => {
    fetchPosts();
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/tags`);
      const json = await res.json();
      if (json.success) setAvailableTags(json.data);
    } catch (err) {
      console.error("Failed to fetch tags");
    }
  };

  useEffect(() => {
    if (postSlug) {
      fetchPostBySlug(postSlug);
    } else {
      setCurrentPost(null);
    }
  }, [postSlug]);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/posts`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostBySlug = async (slug: string) => {
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/posts/by-slug/${slug}`);
      const data = await res.json();
      if (data.success) {
        setCurrentPost(data.data);
        window.scrollTo(0, 0);
      }
    } catch (err) {
      console.error("Failed to fetch post by slug:", err);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesTab = activeTab === 'all' || post.post_type === activeTab;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (post.tags && post.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      <Navbar />

      <main className="container mx-auto px-4 pt-32 pb-20">
        <AnimatePresence mode="wait">
          {!currentPost ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto"
            >
              {/* Header */}
              <div className="text-center mb-16">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-6"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>MANAGERX CONTENT HUB</span>
                </motion.div>
                <h1 
                  onClick={() => setSearchParams({})}
                  className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent italic cursor-pointer hover:opacity-80 transition-opacity"
                >
                  DEV BLOG <span className="text-primary tracking-normal">&</span> TUTORIALS
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
                  Bleibe auf dem Laufenden über neue Features und lerne, wie du ManagerX optimal für deinen Server nutzt.
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10 overflow-x-auto max-w-full no-scrollbar">
                  {(['all', 'dev', 'tutorial', 'changelog'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-6 py-2.5 rounded-xl text-sm font-bold transition-all uppercase tracking-tight whitespace-nowrap",
                        activeTab === tab 
                          ? "bg-primary text-white shadow-lg shadow-primary/20" 
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      )}
                    >
                      {tab === 'all' ? 'Alle' : tab === 'dev' ? 'Dev updates' : tab === 'tutorial' ? 'Tutorials' : 'Changelog'}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-[400px] rounded-[2.5rem] bg-white/5 animate-pulse border border-white/10" />
                  ))}
                </div>
              ) : filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredPosts.map((post, idx) => {
                    const cfg = TYPE_CONFIG[post.post_type] || TYPE_CONFIG.dev;
                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => setSearchParams({ post: post.slug })}
                        className="group cursor-pointer"
                      >
                        <div className="relative h-full glass-strong rounded-[2.5rem] border border-white/10 hover:border-primary/50 transition-all duration-500 overflow-hidden flex flex-col">
                          {post.cover_image && (
                            <div className="h-48 overflow-hidden">
                              <img 
                                src={post.cover_image.startsWith('http') ? post.cover_image : `${API_URL}${post.cover_image}`} 
                                alt={post.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                            </div>
                          )}
                          <div className="p-8 flex flex-col flex-1">
                            <div className="flex items-center justify-between mb-6">
                              <span className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5",
                                cfg.bg, cfg.color
                              )}>
                                <cfg.icon className="w-3 h-3" />
                                {cfg.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                {formatDate(post.created_at)}
                              </span>
                            </div>
                            
                            <h2 className="text-2xl font-black tracking-tight mb-4 group-hover:text-primary transition-colors line-clamp-2 italic">
                              {post.title}
                            </h2>
                            
                            <div className="text-muted-foreground text-sm line-clamp-3 mb-8 font-medium leading-relaxed">
                              {post.excerpt || post.content.substring(0, 150) + "..."}
                            </div>

                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                  <UserIcon className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-white/80 leading-none">{post.author_name}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] text-muted-foreground font-bold flex items-center gap-1">
                                      <Eye className="w-2.5 h-2.5" /> {post.view_count || 0}
                                    </span>
                                    {post.tags && (
                                      <div className="flex gap-1">
                                        {post.tags.split(',').slice(0, 2).map(t => {
                                          const tagData = availableTags.find(tag => tag.name === t.trim());
                                          return (
                                            <span 
                                              key={t} 
                                              className="px-1 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter"
                                              style={{ 
                                                backgroundColor: (tagData?.color || '#3b82f6') + '20',
                                                color: tagData?.color || '#3b82f6'
                                              }}
                                            >
                                              {tagData?.emoji} {t.trim()}
                                            </span>
                                          );
                                        })}
                                        {post.tags.split(',').length > 2 && (
                                          <span className="text-[7px] text-muted-foreground font-bold">+{post.tags.split(',').length - 2}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all border border-white/10 group-hover:border-primary">
                                <ChevronRight className="w-5 h-5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-white/10">
                  <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground font-bold uppercase tracking-widest">Keine Beiträge gefunden</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <button
                onClick={() => setSearchParams({})}
                className="relative z-[100] pointer-events-auto inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-muted-foreground hover:text-white hover:bg-white/10 hover:border-primary/50 transition-all font-bold uppercase tracking-widest text-xs group cursor-pointer mb-12 mb-12 shadow-xl shadow-black/20"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-primary" />
                <span>Zurück zur Übersicht</span>
              </button>

              <article className="glass-strong rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl relative">
                {currentPost.cover_image && (
                  <div className="w-full h-[400px] overflow-hidden border-b border-white/10">
                    <img 
                      src={currentPost.cover_image.startsWith('http') ? currentPost.cover_image : `${API_URL}${currentPost.cover_image}`} 
                      alt={currentPost.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-8 md:p-16">
                   <div className="flex flex-wrap items-center gap-4 mb-8">
                    {(() => {
                      const cfg = TYPE_CONFIG[currentPost.post_type] || TYPE_CONFIG.dev;
                      return (
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2",
                          cfg.bg, cfg.color
                        )}>
                          <cfg.icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(currentPost.created_at)}
                    </span>
                    <span className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5" />
                      {currentPost.author_name}
                    </span>
                    <span className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5" />
                      {currentPost.view_count || 0} Aufrufe
                    </span>
                  </div>

                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-12 italic leading-[1.1]">
                    {currentPost.title}
                  </h1>

                  <PremiumMarkdown content={currentPost.content} />

                  {currentPost.tags && (
                    <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap gap-2">
                      {currentPost.tags.split(',').map(tag => (
                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-muted-foreground">
                          <Tag className="w-3 h-3" />
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
