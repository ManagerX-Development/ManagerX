import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, FileText, Image, ArrowLeft, Hash, ListTodo, Map, Users, MessageSquare } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { cn } from "../../lib/utils";

// Tabs
import CMSPostsTab from "./CMSPostsTab";
import CMSMediaTab from "./CMSMediaTab";
import CMSChangelogTab from "./CMSChangelogTab";
import CMSTagsTab from "./CMSTagsTab";
import CMSRoadmapTab from "./CMSRoadmapTab";
import CMSTeamTab from "./CMSTeamTab";
import CMSFeedbackTab from "./CMSFeedbackTab";

// UI Components
import { useAuth } from "../../components/core/AuthProvider";
import { CMSStatusIndicator, StatusType } from "./CMSStatusIndicator";

const TABS = [
  { id: "posts",     label: "Beiträge",  icon: FileText },
  { id: "tags",      label: "Tags",      icon: Hash },
  { id: "media",     label: "Mediathek", icon: Image },
  { id: "changelog", label: "Changelog", icon: ListTodo },
  { id: "roadmap",   label: "Roadmap",   icon: Map },
  { id: "team",      label: "Team",      icon: Users },
  { id: "feedback",  label: "Feedback",  icon: MessageSquare },
] as const;

type Tab = typeof TABS[number]["id"];

export default function CMSPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("posts");
  
  // Global CMS Status
  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const notify = (type: StatusType, msg: string, duration = 2000) => {
    setStatus(type);
    setStatusMessage(msg);
    if (type !== "sending") {
      setTimeout(() => {
        setStatus("idle");
        setStatusMessage("");
      }, duration);
    }
  };

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/dash/login" />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 relative">
      {/* Global Status Indicator for the whole CMS */}
      <CMSStatusIndicator status={status} message={statusMessage} onClear={() => setStatus("idle")} />

      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/dash/admin" 
              className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
              title="Zurück zur Zentrale"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
            </Link>
            <div className="flex items-center gap-3 text-primary">
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">ADMINISTRATION</span>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic">
            CONTENT <span className="text-primary">MANAGEMENT</span>
          </h1>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 mb-8 w-fit overflow-x-auto no-scrollbar">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
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
          {/* We would pass the notify function to tabs here if they need it */}
          {tab === "posts"     && <CMSPostsTab notify={notify} />}
          {tab === "tags"      && <CMSTagsTab notify={notify} />}
          {tab === "media"     && <CMSMediaTab notify={notify} />}
          {tab === "changelog" && <CMSChangelogTab notify={notify} />}
          {tab === "roadmap"   && <CMSRoadmapTab notify={notify} />}
          {tab === "team"      && <CMSTeamTab notify={notify} />}
          {tab === "feedback"  && <CMSFeedbackTab notify={notify} />}
        </motion.div>
      </div>
    </div>
  );
}
