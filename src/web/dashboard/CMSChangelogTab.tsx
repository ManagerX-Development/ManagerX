import { useState, useEffect } from "react";
import { BookOpen, Calendar, User as UserIcon, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "../lib/api";
import { useAuth } from "../components/core/AuthProvider";

interface ChangelogEntry {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  author_name: string;
  created_at: string;
}

export default function CMSChangelogTab() {
  const { user, token } = useAuth();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChangelog = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/changelog`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "X-User-ID": user?.id || "1427994077332373554"
        }
      });
      const data = await res.json();
      if (data.success) {
        setEntries(data.data);
      }
    } catch (err) {
      toast.error("Fehler beim Laden des Changelogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChangelog();
  }, [token, user]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Changelog Vorschau</h2>
          <p className="text-muted-foreground text-sm">Diese Einträge werden öffentlich im Changelog-Feed angezeigt.</p>
        </div>
        <button 
          onClick={fetchChangelog}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-muted-foreground hover:text-white"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length > 0 ? (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <div key={entry.id} className="glass-strong rounded-2xl border border-white/10 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary/30 transition-all group">
              <div className="space-y-1">
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors italic">{entry.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    {entry.author_name}
                  </span>
                  <span>/{entry.slug}</span>
                </div>
              </div>
              
              <a 
                href={`/blog/${entry.slug}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-primary hover:text-white text-xs font-bold transition-all border border-white/10"
              >
                Ansehen <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 glass-strong rounded-[2rem] border border-white/10">
          <BookOpen className="w-12 h-12 text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Noch keine Changelog-Einträge</p>
          <p className="text-muted-foreground/60 text-xs mt-2">Erstelle einen neuen Beitrag mit dem Typ "Changelog".</p>
        </div>
      )}
    </div>
  );
}
