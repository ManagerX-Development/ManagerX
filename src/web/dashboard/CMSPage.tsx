import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, FileText, Image, BookOpen } from "lucide-react";
import { cn } from "../lib/utils";
import CMSPostsTab from "./CMSPostsTab";
import CMSMediaTab from "./CMSMediaTab";
import CMSChangelogTab from "./CMSChangelogTab";

const TABS = [
  { id: "posts",     label: "Beiträge",  icon: FileText },
  { id: "media",     label: "Mediathek", icon: Image },
  { id: "changelog", label: "Changelog", icon: BookOpen },
] as const;
type Tab = typeof TABS[number]["id"];

export default function CMSPage() {
  const [tab, setTab] = useState<Tab>("posts");

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-3 text-primary mb-2">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">ADMINISTRATION</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic">
            CONTENT <span className="text-primary">MANAGEMENT</span>
          </h1>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 mb-8 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                tab === id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-white"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "posts"     && <CMSPostsTab />}
          {tab === "media"     && <CMSMediaTab />}
          {tab === "changelog" && <CMSChangelogTab />}
        </motion.div>
      </div>
    </div>
  );
}
