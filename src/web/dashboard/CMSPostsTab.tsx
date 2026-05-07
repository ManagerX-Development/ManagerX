import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Globe, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "../lib/api";
import { useAuth } from "../components/core/AuthProvider";
import { cn } from "../lib/utils";
import { Post, getPostType } from "./cmsTypes";
import CMSPostEditor from "./CMSPostEditor";

export default function CMSPostsTab() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);

  const fetchAdminPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/admin/posts`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "X-User-ID": user?.id || "1427994077332373554"
        }
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (err) {
      toast.error("Fehler beim Laden der Posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminPosts();
  }, [token, user]);

  const handleDelete = async (id: number) => {
    if (!confirm("Post wirklich löschen?")) return;
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/posts/${id}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "X-User-ID": user?.id || "1427994077332373554"
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Post gelöscht");
        fetchAdminPosts();
      }
    } catch (err) {
      toast.error("Fehler beim Löschen");
    }
  };

  const togglePublish = async (post: Post) => {
    try {
      const res = await fetch(`${API_URL}/dashboard/cms/posts/${post.id}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-User-ID": user?.id || "1427994077332373554"
        },
        body: JSON.stringify({ is_published: !post.is_published })
      });
      if (res.ok) {
        toast.success(post.is_published ? "Beitrag versteckt" : "Beitrag veröffentlicht");
        fetchAdminPosts();
      }
    } catch (err) {
      toast.error("Fehler beim Umschalten");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Beiträge verwalten</h2>
        <button
          onClick={() => {
            setEditingPost({ post_type: 'dev', is_published: false, title: '', content: '', tags: '', slug: '', excerpt: '', cover_image: '' });
            setIsEditorOpen(true);
          }}
          className="btn-primary flex items-center gap-2 !px-6 !py-3 !text-sm group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Neuer Beitrag
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
           <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-strong rounded-[2rem] border border-white/10 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Typ</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Titel & Autor</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Datum</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {posts.map((post) => {
                const typeInfo = getPostType(post.post_type);
                return (
                  <tr key={post.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
                        typeInfo.bg, typeInfo.text
                      )}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-white/90 group-hover:text-primary transition-colors">{post.title}</div>
                      <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2 mt-1">
                        <span>/{post.slug}</span>
                        <span>•</span>
                        <span>Von {post.author_name}</span>
                        <span>•</span>
                        <span>{post.view_count || 0} Aufrufe</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {post.is_published ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase">
                          <Globe className="w-3 h-3" /> Published
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-black uppercase">
                            <Settings2 className="w-3 h-3" /> Draft
                          </div>
                          {post.scheduled_at && (
                            <span className="text-[9px] text-amber-400">
                              Geplant: {new Date(post.scheduled_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => togglePublish(post)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            post.is_published ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                          )}
                          title={post.is_published ? "Verstecken" : "Veröffentlichen"}
                        >
                          <Globe className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingPost(post);
                            setIsEditorOpen(true);
                          }}
                          className="p-2 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isEditorOpen && editingPost && (
        <CMSPostEditor 
          post={editingPost} 
          onClose={() => setIsEditorOpen(false)} 
          onSave={() => {
            setIsEditorOpen(false);
            fetchAdminPosts();
          }}
        />
      )}
    </div>
  );
}
