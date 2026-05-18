import { useState, useEffect, useMemo } from "react";
import { 
  Image as ImageIcon, Trash2, Upload, Link, 
  FileText, Film, File as FileIcon, Search, 
  Star, Folder, Plus, FolderOpen, MoreVertical,
  ChevronRight, Move, X
} from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "../../lib/api";
import { useAuth } from "../../components/core/AuthProvider";
import { cn } from "../../lib/utils";
import { StatusType } from "./CMSStatusIndicator";

interface MediaItemEx {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploader_name: string;
  uploaded_at: string;
  url: string;
  is_stock: boolean;
  folder: string;
}

interface MediaFolder {
  id: number;
  name: string;
  created_at: string;
}

export default function CMSMediaTab({ notify }: { notify: (type: StatusType, msg: string) => void }) {
  const { user, token } = useAuth();
  const [media, setMedia] = useState<MediaItemEx[]>([]);
  const [dbFolders, setDbFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [movingId, setMovingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mediaRes, foldersRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/cms/media`, {
          headers: { "Authorization": `Bearer ${token}`, "X-User-ID": user?.id || "1" }
        }),
        fetch(`${API_URL}/dashboard/cms/folders`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);
      
      const mediaData = await mediaRes.json();
      const foldersData = await foldersRes.json();
      
      if (mediaData.success) setMedia(mediaData.data);
      if (foldersData.success) setDbFolders(foldersData.data);
    } catch (err) {
      notify("error", "Fehler beim Laden der Daten");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, user]);

  const allFolders = useMemo(() => {
    const names = new Set<string>(["general"]);
    dbFolders.forEach(f => names.add(f.name));
    media.forEach(m => names.add(m.folder || "general"));
    return Array.from(names).sort();
  }, [media, dbFolders]);

  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/folders`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: newFolderName })
      });
      if (res.ok) {
        notify("success", `Ordner '${newFolderName}' erstellt`);
        setNewFolderName("");
        setShowNewFolderInput(false);
        fetchData();
      }
    } catch {
      notify("error", "Ordner konnte nicht erstellt werden");
    }
  };

  const handleDeleteFolder = async (name: string) => {
    if (name === "general") return;
    if (!confirm(`Ordner '${name}' wirklich löschen? Bilder werden nach 'general' verschoben.`)) return;
    
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/folders/${name}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        notify("success", "Ordner gelöscht");
        if (activeFolder === name) setActiveFolder("all");
        fetchData();
      }
    } catch {
      notify("error", "Fehler beim Löschen");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", activeFolder === "all" ? "general" : activeFolder);

    setUploading(true);
    notify("sending", "Datei wird hochgeladen...");
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/upload`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "X-User-ID": user?.id || "1"
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        notify("success", "Datei erfolgreich hochgeladen");
        fetchData();
      } else {
        notify("error", data.detail || "Upload fehlgeschlagen");
      }
    } catch (err) {
      notify("error", "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const handleMove = async (id: number, newFolder: string) => {
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/media/${id}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-User-ID": user?.id || "1"
        },
        body: JSON.stringify({ folder: newFolder })
      });
      if (res.ok) {
        notify("success", `Verschoben nach ${newFolder}`);
        setMovingId(null);
        fetchData();
      }
    } catch {
      notify("error", "Fehler beim Verschieben");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Datei wirklich löschen?")) return;
    notify("sending", "Datei wird gelöscht...");
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/media/${id}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "X-User-ID": user?.id || "1"
        }
      });
      const data = await res.json();
      if (data.success) {
        notify("success", "Datei erfolgreich gelöscht");
        fetchData();
      }
    } catch (err) {
      notify("error", "Fehler beim Löschen");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL kopiert!");
  };

  const filteredMedia = media.filter(m => {
    const matchesSearch = m.original_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = activeFolder === "all" || m.folder === activeFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="flex flex-col md:flex-row gap-8 h-full min-h-[600px] animate-in fade-in duration-500">
      {/* Sidebar Folders */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Mediathek</h3>
            <button 
              onClick={() => setShowNewFolderInput(!showNewFolderInput)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all shadow-sm"
              title="Neuer Ordner"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showNewFolderInput && (
            <div className="px-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
               <input 
                 autoFocus
                 type="text" 
                 placeholder="Ordnername..."
                 value={newFolderName}
                 onChange={e => setNewFolderName(e.target.value)}
                 onKeyDown={e => e.key === "Enter" && handleCreateFolder()}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs focus:border-primary outline-none shadow-inner"
               />
               <div className="flex gap-2">
                  <button onClick={handleCreateFolder} className="flex-1 bg-primary text-white text-[10px] font-bold py-1.5 rounded-lg uppercase">Erstellen</button>
                  <button onClick={() => setShowNewFolderInput(false)} className="px-3 bg-white/5 text-muted-foreground py-1.5 rounded-lg"><X className="w-3 h-3" /></button>
               </div>
            </div>
          )}

          <div className="space-y-1">
            <button 
              onClick={() => setActiveFolder("all")}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all group",
                activeFolder === "all" ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <FolderOpen className={cn("w-4 h-4", activeFolder === "all" ? "text-white" : "text-primary")} />
                Alle Medien
              </div>
              <span className="text-[10px] opacity-60 bg-black/20 px-2 py-0.5 rounded-full">{media.length}</span>
            </button>

            <div className="pt-2 pb-1 px-2">
               <div className="h-px bg-white/5 w-full" />
            </div>

            {allFolders.map(f => (
              <div key={f} className="group/folder relative">
                <button 
                  onClick={() => setActiveFolder(f)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all",
                    activeFolder === f ? "bg-white/10 text-white border border-white/5 shadow-lg" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Folder className={cn("w-4 h-4", activeFolder === f ? "text-primary" : "text-muted-foreground/40")} />
                    <span className="truncate max-w-[120px]">{f}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] opacity-40">
                      {media.filter(m => m.folder === f).length}
                    </span>
                  </div>
                </button>
                {f !== "general" && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover/folder:opacity-100 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Ordner löschen"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto p-5 glass-strong rounded-3xl border border-white/5 space-y-4 shadow-2xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
           <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground relative">Cloud-Speicher</h4>
           <div className="space-y-2 relative">
             <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min(100, (media.reduce((acc, m) => acc + m.size_bytes, 0) / (100 * 1024 * 1024)) * 100)}%` }} />
             </div>
             <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground">
                <span>{(media.reduce((acc, m) => acc + m.size_bytes, 0) / 1024 / 1024).toFixed(1)} MB</span>
                <span className="text-white/20">/ 100 MB</span>
             </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative flex-1 w-full max-w-md group">
            <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder={`${activeFolder === "all" ? "Alle Medien" : activeFolder} durchsuchen...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all relative z-10"
            />
          </div>
          
          <label className={cn(
            "btn-primary flex items-center gap-3 !px-8 !py-3.5 !text-xs cursor-pointer group shadow-2xl shadow-primary/20",
            uploading && "opacity-50 pointer-events-none"
          )}>
            <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            {uploading ? "Wird hochgeladen..." : "Datei hochladen"}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 overflow-y-auto pr-2 custom-scrollbar pb-10">
          {filteredMedia.map((item) => (
            <div key={item.id} className="group relative glass-strong rounded-[2rem] border border-white/5 overflow-hidden aspect-square hover:border-primary/50 transition-all shadow-xl hover:shadow-primary/10">
              {item.mime_type.startsWith('image/') ? (
                <img 
                  src={`${API_URL}${item.url}`} 
                  alt={item.original_name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white/[0.02] text-muted-foreground">
                  <FileText className="w-10 h-10 opacity-10" />
                  <span className="text-[9px] mt-3 font-black uppercase tracking-widest px-4 text-center line-clamp-1">{item.original_name}</span>
                </div>
              )}
              
              <div className={cn(
                "absolute inset-0 bg-black/90 transition-all duration-500 flex flex-col items-center justify-center p-6 backdrop-blur-sm",
                movingId === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                <p className="text-[10px] font-black text-white text-center line-clamp-2 mb-6 uppercase tracking-widest leading-relaxed">{item.original_name}</p>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button 
                    onClick={() => copyToClipboard(`${API_URL}${item.url}`)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-primary hover:text-white transition-all text-white flex items-center justify-center border border-white/5"
                    title="URL kopieren"
                  >
                    <Link className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-rose-500 hover:text-white transition-all text-white flex items-center justify-center border border-white/5"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="col-span-2 relative">
                    <button 
                      onClick={() => setMovingId(movingId === item.id ? null : item.id)}
                      className={cn(
                        "w-full py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-white/5 transition-all",
                        movingId === item.id ? "bg-primary text-white" : "bg-white/5 hover:bg-white/10"
                      )}
                    >
                       <Move className={cn("w-3 h-3", movingId === item.id ? "text-white" : "text-primary")} /> {movingId === item.id ? "Abbrechen" : "Verschieben"}
                    </button>
                    
                    {movingId === item.id && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden z-20 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                         <div className="p-2 text-[8px] font-black text-muted-foreground uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">Ziel wählen</div>
                         <div className="max-h-40 overflow-y-auto custom-scrollbar">
                           {allFolders.filter(f => f !== item.folder).map(f => (
                             <button 
                               key={f}
                               onClick={() => handleMove(item.id, f)}
                               className="w-full px-4 py-2.5 text-[9px] font-bold text-left hover:bg-primary hover:text-white transition-colors border-b border-white/5 last:border-0 flex items-center gap-2"
                             >
                               <ChevronRight className="w-3 h-3 opacity-40" /> {f}
                             </button>
                           ))}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Label Tags */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                 <div className="px-2 py-0.5 rounded-lg bg-black/60 text-[8px] font-black uppercase tracking-widest text-primary backdrop-blur-md border border-white/5 shadow-lg">
                    {item.folder}
                 </div>
              </div>
            </div>
          ))}
          
          {filteredMedia.length === 0 && (
             <div className="col-span-full py-32 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]">
                <div className="relative inline-block mb-6">
                   <FolderOpen className="w-16 h-16 text-white/5 mx-auto" />
                   <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                </div>
                <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.3em]">Dieser Ordner ist leer</p>
                <p className="text-[10px] text-white/20 mt-2 font-bold italic">Lade Bilder hoch, um sie hier zu sehen.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
