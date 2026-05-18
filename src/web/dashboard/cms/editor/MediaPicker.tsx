import { useState, useEffect, useMemo } from "react";
import { Search, X, Image as ImageIcon, Check, Folder, ChevronRight, FolderOpen } from "lucide-react";
import { API_URL } from "../../../lib/api";
import { useAuth } from "../../../components/core/AuthProvider";
import { cn } from "../../../lib/utils";

interface MediaItem {
  id: number;
  original_name: string;
  url: string;
  mime_type: string;
  folder: string;
}

interface MediaFolder {
  id: number;
  name: string;
}

interface MediaPickerProps {
  onSelect: (url: string, name: string) => void;
  onClose: () => void;
}

export function MediaPicker({ onSelect, onClose }: MediaPickerProps) {
  const { token } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mediaRes, foldersRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/cms/media`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/dashboard/cms/folders`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const mData = await mediaRes.json();
      const fData = await foldersRes.json();
      if (mData.success) setMedia(mData.data.filter((m: MediaItem) => m.mime_type.startsWith("image/")));
      if (fData.success) setFolders(fData.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const allFolderNames = useMemo(() => {
    const names = new Set<string>(["general"]);
    folders.forEach(f => names.add(f.name));
    return Array.from(names).sort();
  }, [folders]);

  const filtered = media.filter(m => {
    const matchesSearch = m.original_name.toLowerCase().includes(search.toLowerCase());
    const matchesFolder = activeFolder === "all" || m.folder === activeFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-5xl bg-[#080808] border border-white/10 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
               <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black italic uppercase tracking-tight">Mediathek durchsuchen</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Wähle ein Bild für deinen Beitrag</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all text-muted-foreground hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-56 border-r border-white/5 p-6 flex flex-col gap-6 overflow-y-auto">
             <div className="space-y-4">
                <h4 className="px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ordner</h4>
                <div className="space-y-1">
                   <button 
                     onClick={() => setActiveFolder("all")}
                     className={cn(
                       "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                       activeFolder === "all" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                     )}
                   >
                     <FolderOpen className="w-4 h-4" />
                     Alle
                   </button>
                   {allFolderNames.map(f => (
                     <button 
                       key={f}
                       onClick={() => setActiveFolder(f)}
                       className={cn(
                         "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                         activeFolder === f ? "bg-white/10 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                       )}
                     >
                       <Folder className={cn("w-4 h-4", activeFolder === f ? "text-primary" : "text-muted-foreground/30")} />
                       <span className="truncate">{f}</span>
                     </button>
                   ))}
                </div>
             </div>
          </div>

          {/* Grid Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  placeholder="Bilder suchen..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-primary outline-none transition-all relative z-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Medien werden geladen...</p>
                </div>
              ) : filtered.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filtered.map(item => (
                    <button
                      key={item.id}
                      onClick={() => onSelect(`${API_URL}${item.url}`, item.original_name)}
                      className="group relative aspect-square rounded-[2rem] border border-white/5 overflow-hidden hover:border-primary transition-all shadow-xl"
                    >
                      <img src={`${API_URL}${item.url}`} alt={item.original_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center backdrop-blur-sm">
                        <Check className="w-10 h-10 text-white drop-shadow-2xl" />
                        <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-white">Wählen</span>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-black/80 p-3 text-[9px] font-black text-white truncate uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.original_name}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30">
                   <ImageIcon className="w-16 h-16 mb-4" />
                   <p className="text-xs font-black uppercase tracking-[0.3em]">Keine Bilder gefunden</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
