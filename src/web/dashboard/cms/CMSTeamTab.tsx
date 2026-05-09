import { useState, useEffect } from "react";
import { 
  Plus, Trash2, Save, Github, Twitter, Youtube, 
  Instagram, Globe, Edit3, X, Users, FolderTree, LayoutList
} from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "../../lib/api";
import { useAuth } from "../../components/core/AuthProvider";
import { TeamMember, TeamCategory } from "./cmsTypes";
import { cn } from "../../lib/utils";

const COLOR_OPTIONS = [
  { label: "Primary (Blue)", value: "bg-primary" },
  { label: "Accent (Cyan)",  value: "bg-accent" },
  { label: "Rose",           value: "bg-rose-500" },
  { label: "Emerald",        value: "bg-emerald-500" },
  { label: "Amber",          value: "bg-amber-500" },
  { label: "Purple",         value: "bg-purple-500" },
];

export default function CMSTeamTab() {
  const { token } = useAuth();
  const [view, setView] = useState<"members" | "categories">("members");
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [categories, setCategories] = useState<TeamCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Member State
  const [editingMember, setEditingMember] = useState<Partial<TeamMember> | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Category State
  const [editingCategory, setEditingCategory] = useState<Partial<TeamCategory> | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
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
      toast.error("Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  // --- MEMBERS ---
  const handleSaveMember = async () => {
    if (!editingMember?.name || !editingMember?.role) {
      return toast.error("Name und Rolle sind erforderlich");
    }
    try {
      const isNew = !editingMember.id;
      const url = isNew 
        ? `${API_URL}/dashboard/cms/team` 
        : `${API_URL}/dashboard/cms/team/${editingMember.id}`;
      
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editingMember)
      });
      const json = await res.json();
      if (json.success) {
        toast.success(isNew ? "Mitglied hinzugefügt" : "Mitglied aktualisiert");
        setShowMemberModal(false);
        fetchData();
      } else toast.error(json.detail || "Fehler beim Speichern");
    } catch (err) { toast.error("Verbindungsfehler"); }
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm("Dieses Mitglied wirklich entfernen?")) return;
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/team/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Mitglied entfernt");
        fetchData();
      }
    } catch (err) { toast.error("Fehler beim Löschen"); }
  };

  const openEditMember = (member: TeamMember | null = null) => {
    setEditingMember(member || { 
      name: "", role: "", bio: "", avatar: "👤", color: "bg-primary",
      github: "", twitter: "", youtube: "", instagram: "", website: "",
      order_index: members.length, category_id: null
    });
    setShowMemberModal(true);
  };

  // --- CATEGORIES ---
  const handleSaveCategory = async () => {
    if (!editingCategory?.name) return toast.error("Name ist erforderlich");
    try {
      const isNew = !editingCategory.id;
      const url = isNew 
        ? `${API_URL}/dashboard/cms/team-categories` 
        : `${API_URL}/dashboard/cms/team-categories/${editingCategory.id}`;
      
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editingCategory)
      });
      const json = await res.json();
      if (json.success) {
        toast.success(isNew ? "Kategorie erstellt" : "Kategorie aktualisiert");
        setShowCategoryModal(false);
        fetchData();
      } else toast.error(json.detail || "Fehler beim Speichern");
    } catch (err) { toast.error("Verbindungsfehler"); }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Kategorie wirklich löschen? Mitglieder dieser Kategorie werden auf 'Ohne Kategorie' gesetzt.")) return;
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/team-categories/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Kategorie entfernt");
        fetchData();
      }
    } catch (err) { toast.error("Fehler beim Löschen"); }
  };

  const openEditCategory = (cat: TeamCategory | null = null) => {
    setEditingCategory(cat || { name: "", order_index: categories.length });
    setShowCategoryModal(true);
  };

  // --- RENDER HELPERS ---
  const getCategoryName = (catId: number | null) => {
      if (!catId) return "Ohne Kategorie";
      const cat = categories.find(c => c.id === catId);
      return cat ? cat.name : "Unbekannte Kategorie";
  };

  return (
    <div className="space-y-6">
      {/* Header & View Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-black italic tracking-tight uppercase">Team Verwaltung</h2>
        </div>
        
        <div className="flex gap-4 items-center w-full md:w-auto">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                    onClick={() => setView("members")}
                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all", view === "members" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}
                >
                    <Users className="w-4 h-4" /> Mitglieder
                </button>
                <button 
                    onClick={() => setView("categories")}
                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all", view === "categories" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}
                >
                    <FolderTree className="w-4 h-4" /> Kategorien
                </button>
            </div>
            
            {view === "members" ? (
                <button onClick={() => openEditMember()} className="btn-primary flex items-center gap-2 !py-2.5 !px-5 whitespace-nowrap">
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Mitglied</span>
                </button>
            ) : (
                <button onClick={() => openEditCategory()} className="btn-primary flex items-center gap-2 !py-2.5 !px-5 whitespace-nowrap">
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Kategorie</span>
                </button>
            )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : view === "categories" ? (
        // CATEGORIES VIEW
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.length === 0 && (
                <div className="col-span-full text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Keine Kategorien vorhanden</p>
                </div>
            )}
            {categories.map((cat) => (
                <div key={cat.id} className="glass-strong rounded-2xl border border-white/5 p-5 flex items-center justify-between group hover:border-primary/30 transition-all">
                    <div>
                        <div className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">Index: {cat.order_index}</div>
                        <div className="text-lg font-black italic tracking-tight">{cat.name}</div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => openEditCategory(cat)} className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white">
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      ) : (
        // MEMBERS VIEW
        <div className="space-y-8">
            {members.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                    <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Noch keine Teammitglieder</p>
                </div>
            )}

            {/* Gruppiert nach Kategorien rendern */}
            {Array.from(new Set(members.map(m => m.category_id))).map(catId => {
                const catMembers = members.filter(m => m.category_id === catId);
                return (
                    <div key={catId || "none"} className="space-y-4">
                        <h3 className="text-sm font-black italic uppercase tracking-widest text-muted-foreground border-b border-white/10 pb-2">
                            {getCategoryName(catId)}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {catMembers.map((member) => (
                                <div key={member.id} className="glass-strong rounded-[2.5rem] border border-white/5 p-6 flex items-center gap-6 group hover:border-primary/30 transition-all overflow-hidden relative">
                                    <div className={cn("absolute top-0 left-0 w-1.5 h-full opacity-50", member.color)} />
                                    
                                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl", member.color)}>
                                        {member.avatar || "👤"}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="text-primary text-[10px] font-black uppercase tracking-widest mb-1">{member.role}</div>
                                        <h3 className="text-lg font-black italic tracking-tight text-white mb-1 truncate">{member.name}</h3>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openEditMember(member)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteMember(member.id)} className="p-3 rounded-xl bg-white/5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Member Modal */}
      {showMemberModal && editingMember && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl glass-strong rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-black italic uppercase tracking-tight">Mitglied bearbeiten</h3>
              <button onClick={() => setShowMemberModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[75vh] no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Name</label>
                  <input type="text" value={editingMember.name} onChange={e => setEditingMember({...editingMember, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kategorie</label>
                  <select 
                    value={editingMember.category_id || ""} 
                    onChange={e => setEditingMember({...editingMember, category_id: e.target.value ? parseInt(e.target.value) : null})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                  >
                      <option value="" className="bg-black text-white">Ohne Kategorie</option>
                      {categories.map(c => (
                          <option key={c.id} value={c.id} className="bg-black text-white">{c.name}</option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Rolle (z.B. Projektleitung)</label>
                  <input type="text" value={editingMember.role} onChange={e => setEditingMember({...editingMember, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sortier-Index</label>
                  <input type="number" value={editingMember.order_index} onChange={e => setEditingMember({...editingMember, order_index: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
                </div>
              </div>

              {/* Avatar und Farben (wie vorher) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Avatar (Emoji/URL)</label>
                  <input type="text" value={editingMember.avatar || ''} onChange={e => setEditingMember({...editingMember, avatar: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center outline-none" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Themenfarbe</label>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setEditingMember({...editingMember, color: opt.value})} className={cn("py-2 rounded-lg border text-[8px] font-black uppercase flex items-center gap-2 px-2 transition-all", editingMember.color === opt.value ? "bg-white/10 border-white/40 text-white" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10")}>
                        <div className={cn("w-3 h-3 rounded-full", opt.value)} /> <span className="truncate">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bio</label>
                  <textarea value={editingMember.bio || ''} onChange={e => setEditingMember({...editingMember, bio: e.target.value})} className="w-full h-20 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none resize-none" />
              </div>
            </div>

            <div className="p-8 border-t border-white/10 flex gap-3">
              <button onClick={() => setShowMemberModal(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase">Abbrechen</button>
              <button onClick={handleSaveMember} className="flex-1 py-4 bg-primary hover:bg-primary/80 rounded-2xl text-xs font-black uppercase flex justify-center gap-2"><Save className="w-4 h-4"/> Speichern</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && editingCategory && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md glass-strong rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-black italic uppercase tracking-tight">Kategorie bearbeiten</h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kategorie Name</label>
                  <input type="text" value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} placeholder="z.B. Management" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sortier-Index (0 = Ganz oben)</label>
                  <input type="number" value={editingCategory.order_index} onChange={e => setEditingCategory({...editingCategory, order_index: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
                </div>
            </div>

            <div className="p-8 border-t border-white/10 flex gap-3">
              <button onClick={() => setShowCategoryModal(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase">Abbrechen</button>
              <button onClick={handleSaveCategory} className="flex-1 py-4 bg-primary hover:bg-primary/80 rounded-2xl text-xs font-black uppercase flex justify-center gap-2"><Save className="w-4 h-4"/> Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
