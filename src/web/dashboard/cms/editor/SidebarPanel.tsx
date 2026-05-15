import React from "react";
import { Globe, Clock } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Post, POST_TYPES } from "../cmsTypes";

interface SidebarPanelProps {
  formData: Partial<Post>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Post>>>;
  availableTags: any[];
  tagInput: string;
  setTagInput: (v: string) => void;
  showTagSuggestions: boolean;
  setShowTagSuggestions: (v: boolean) => void;
  horizontal?: boolean;
}

export function SidebarPanel({
  formData, setFormData, availableTags,
  tagInput, setTagInput, showTagSuggestions, setShowTagSuggestions,
  horizontal = false,
}: SidebarPanelProps) {
  return (
    <div className={cn("contents", horizontal && "flex gap-6 items-start")}>
      {/* Publishing */}
      <div className={cn("glass-strong rounded-2xl border border-white/10 p-5 space-y-4", horizontal && "shrink-0 w-64")}>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
          <Globe className="w-3.5 h-3.5" /> Publishing
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground">Typ</label>
          <select
            value={formData.post_type}
            onChange={(e) => setFormData((p) => ({ ...p, post_type: e.target.value as any }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none"
          >
            {POST_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-[#0a0a0a]">{t.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
          <span className="text-xs font-bold">Veröffentlicht</span>
          <button
            onClick={() => setFormData((p) => ({ ...p, is_published: !p.is_published }))}
            className={cn("w-10 h-5 rounded-full transition-colors relative", formData.is_published ? "bg-primary" : "bg-white/10")}
          >
            <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", formData.is_published ? "left-6" : "left-1")} />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Geplant (Optional)
          </label>
          <input
            type="datetime-local"
            value={formData.scheduled_at ? new Date(formData.scheduled_at).toISOString().slice(0, 16) : ""}
            onChange={(e) => setFormData((p) => ({ ...p, scheduled_at: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none invert-calendar-icon"
          />
        </div>
      </div>

      {/* Media & Tags */}
      <div className={cn("glass-strong rounded-2xl border border-white/10 p-5 space-y-4", horizontal && "flex-1 min-w-0")}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground">Cover-Bild URL</label>
          <input
            type="text"
            value={formData.cover_image || ""}
            onChange={(e) => setFormData((p) => ({ ...p, cover_image: e.target.value }))}
            placeholder="https://..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground">URL Slug</label>
          <input
            type="text"
            value={formData.slug || ""}
            onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono outline-none"
          />
        </div>

        <div className="space-y-1.5 relative">
          <label className="text-[10px] font-bold text-muted-foreground">Tags</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {formData.tags?.split(",").filter(Boolean).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase flex items-center gap-1">
                {t.trim()}
                <button onClick={() => setFormData(p => ({ ...p, tags: p.tags?.split(",").filter(x => x.trim() !== t.trim()).join(",") }))} className="hover:text-white">×</button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
              setShowTagSuggestions(true);
            }}
            onFocus={() => setShowTagSuggestions(true)}
            placeholder="Tags hinzufügen..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none"
          />
          {showTagSuggestions && tagInput && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#121212] border border-white/10 rounded-xl p-1 shadow-2xl max-h-40 overflow-y-auto">
              {availableTags.filter(t => t.name.toLowerCase().includes(tagInput.toLowerCase())).map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    const current = formData.tags?.split(",").map(x => x.trim()).filter(Boolean) || [];
                    if (!current.includes(t.name)) {
                      setFormData(p => ({ ...p, tags: [...current, t.name].join(",") }));
                    }
                    setTagInput("");
                    setShowTagSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-[10px] font-bold flex items-center gap-2"
                >
                  <span style={{ color: t.color }}>{t.emoji} {t.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
