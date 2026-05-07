import { useState, useEffect } from "react";
import { Image as ImageIcon, Trash2, Upload, Link, FileText, Film, File as FileIcon, Search } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "../lib/api";
import { useAuth } from "../components/core/AuthProvider";
import { cn } from "../lib/utils";
import { MediaItem } from "./cmsTypes";

export default function CMSMediaTab() {
  const { user, token } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMedia = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/media`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "X-User-ID": user?.id || "1427994077332373554"
        }
      });
      const data = await res.json();
      if (data.success) {
        setMedia(data.data);
      }
    } catch (err) {
      toast.error("Fehler beim Laden der Medien");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [token, user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/upload`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "X-User-ID": user?.id || "1427994077332373554"
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Datei hochgeladen");
        fetchMedia();
      } else {
        toast.error(data.detail || "Upload fehlgeschlagen");
      }
    } catch (err) {
      toast.error("Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Datei wirklich löschen?")) return;
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/media/${id}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "X-User-ID": user?.id || "1427994077332373554"
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Datei gelöscht");
        fetchMedia();
      }
    } catch (err) {
      toast.error("Fehler beim Löschen");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL kopiert!");
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-6 h-6" />;
    if (mime.startsWith('video/')) return <Film className="w-6 h-6" />;
    if (mime === 'application/pdf') return <FileText className="w-6 h-6" />;
    return <FileIcon className="w-6 h-6" />;
  };

  const filteredMedia = media.filter(m => 
    m.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.mime_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mediathek</h2>
          <p className="text-muted-foreground text-sm">Verwalte deine hochgeladenen Bilder und Dateien.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          
          <label className={cn(
            "btn-primary flex items-center gap-2 !px-5 !py-2.5 !text-xs cursor-pointer whitespace-nowrap",
            uploading && "opacity-50 pointer-events-none"
          )}>
            <Upload className="w-4 h-4" />
            {uploading ? "Wird hochgeladen..." : "Hochladen"}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredMedia.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map((item) => (
            <div key={item.id} className="group relative glass-strong rounded-2xl border border-white/10 overflow-hidden aspect-square">
              {item.mime_type.startsWith('image/') ? (
                <img 
                  src={`${API_URL}${item.url}`} 
                  alt={item.original_name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-muted-foreground">
                  {getFileIcon(item.mime_type)}
                  <span className="text-[10px] mt-2 font-bold px-2 text-center line-clamp-1">{item.original_name}</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                <p className="text-[10px] font-bold text-white text-center line-clamp-2 mb-2">{item.original_name}</p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => copyToClipboard(`${API_URL}${item.url}`)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-primary hover:text-white transition-all text-white"
                    title="URL kopieren"
                  >
                    <Link className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-red-500 hover:text-white transition-all text-white"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-[8px] text-white/60 mt-2">
                  {(item.size_bytes / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 glass-strong rounded-[2rem] border border-dashed border-white/10">
          <ImageIcon className="w-12 h-12 text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Keine Medien gefunden</p>
        </div>
      )}
    </div>
  );
}
