import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Hash, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Palette, 
  Smile,
  AlertCircle
} from "lucide-react";
import { API_URL } from "../../lib/api";
import { useAuth } from "../../components/core/AuthProvider";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
  emoji: string;
}

const CMSTagsTab = () => {
  const { token } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    color: "#3b82f6",
    emoji: ""
  });

  const fetchTags = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/tags`);
      const json = await res.json();
      if (json.success) setTags(json.data);
    } catch (err) {
      toast.error("Tags konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Tag erstellt!");
        setShowAddForm(false);
        setFormData({ name: "", slug: "", color: "#3b82f6", emoji: "" });
        fetchTags();
      }
    } catch (err) {
      toast.error("Fehler beim Erstellen");
    }
  };

  const handleUpdate = async (tagId: number) => {
    try {
      const tagToUpdate = tags.find(t => t.id === tagId);
      if (!tagToUpdate) return;

      const res = await fetch(`${API_URL}/dashboard/cms/tags/${tagId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(tagToUpdate)
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Tag aktualisiert");
        setIsEditing(null);
      }
    } catch (err) {
      toast.error("Fehler beim Speichern");
    }
  };

  const handleDelete = async (tagId: number) => {
    if (!confirm("Tag wirklich löschen?")) return;
    
    // Optimistic Update
    const oldTags = [...tags];
    setTags(tags.filter(t => t.id !== tagId));

    try {
      const res = await fetch(`${API_URL}/dashboard/cms/tags/${tagId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Tag gelöscht");
        fetchTags();
      } else {
        setTags(oldTags);
        toast.error("Fehler beim Löschen");
      }
    } catch (err) {
      setTags(oldTags);
      toast.error("Fehler beim Löschen");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Tag Management</h2>
          <p className="text-muted-foreground text-sm">Organisiere deine Blog-Posts mit Kategorien und Farben.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-all font-bold text-sm shadow-lg shadow-primary/20"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? "Abbrechen" : "Neuer Tag"}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAdd} className="bg-white/5 border border-white/10 p-6 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2 px-1">Name</label>
                <input
                  type="text"
                  placeholder="z.B. Update"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2 px-1">Farbe</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={e => setFormData({...formData, color: e.target.value})}
                    className="w-10 h-10 bg-transparent border-none rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={e => setFormData({...formData, color: e.target.value})}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono focus:border-primary outline-none transition-colors uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-2 px-1">Emoji (Optional)</label>
                <input
                  type="text"
                  placeholder="🚀"
                  value={formData.emoji}
                  onChange={e => setFormData({...formData, emoji: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-colors text-center"
                />
              </div>
              <button
                type="submit"
                className="bg-white text-black hover:bg-white/90 font-bold py-2.5 rounded-xl transition-all"
              >
                Erstellen
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.length === 0 && !showAddForm && (
          <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
            <Hash className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-muted-foreground">Noch keine Tags erstellt.</p>
          </div>
        )}

        {tags.map(tag => (
          <motion.div
            key={tag.id}
            layout
            className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.08] transition-colors relative overflow-hidden"
          >
            {/* Tag Glow */}
            <div 
              className="absolute -right-8 -top-8 w-24 h-24 blur-3xl opacity-20 transition-opacity group-hover:opacity-40"
              style={{ backgroundColor: tag.color }}
            />

            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                {isEditing === tag.id ? (
                  <input
                    type="text"
                    value={tag.emoji}
                    onChange={e => setTags(tags.map(t => t.id === tag.id ? {...t, emoji: e.target.value} : t))}
                    className="w-10 h-10 bg-black/40 border border-white/10 rounded-lg text-center"
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg"
                    style={{ backgroundColor: tag.color + "20", color: tag.color }}
                  >
                    {tag.emoji || <Hash className="w-5 h-5" />}
                  </div>
                )}
                
                {isEditing === tag.id ? (
                  <input
                    type="text"
                    value={tag.name}
                    onChange={e => setTags(tags.map(t => t.id === tag.id ? {...t, name: e.target.value} : t))}
                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm font-bold w-32"
                  />
                ) : (
                  <div>
                    <h3 className="font-bold text-white">{tag.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">/{tag.slug}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-1">
                {isEditing === tag.id ? (
                  <>
                    <button onClick={() => handleUpdate(tag.id)} className="p-2 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsEditing(null)} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(tag.id)} className="p-2 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(tag.id)} className="p-2 hover:bg-white/10 text-white/40 hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing === tag.id && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <input
                  type="color"
                  value={tag.color}
                  onChange={e => setTags(tags.map(t => t.id === tag.id ? {...t, color: e.target.value} : t))}
                  className="w-full h-8 bg-transparent border-none rounded cursor-pointer"
                />
              </div>
            )}

            {!isEditing && (
              <div className="flex items-center gap-2">
                <div 
                  className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: tag.color + "20", color: tag.color, border: `1px solid ${tag.color}40` }}
                >
                  Vorschau
                </div>
                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full" style={{ width: "100%", backgroundColor: tag.color }} />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex gap-4 items-start">
        <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-primary block mb-1">Hinweis zu Tags</strong>
          Tags werden global für alle Post-Typen (Blog, Changelog, Tutorials) verwendet. 
          Wenn du einen Tag löschst, wird er automatisch aus allen Beiträgen entfernt, die ihn nutzen. 
          Die Slug-Generierung erfolgt automatisch, kann aber später im Code angepasst werden.
        </p>
      </div>

    </div>
  );
};

export default CMSTagsTab;
