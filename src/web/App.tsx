import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthProvider } from "./components/core/AuthProvider";
import { ErrorBoundary } from "./components/core/ErrorBoundary";
import { Toaster } from "sonner";

// Lazy load all route components
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Impressum = lazy(() => import("./pages/Impressum"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const Nutzungsbedingungen = lazy(() => import("./pages/Nutzungsbedingungen"));
const PluginsPage = lazy(() => import("./pages/PluginsPage"));
const Status = lazy(() => import("./pages/Status"));
const CommandsPage = lazy(() => import("./pages/CommandsPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const RoadmapPage = lazy(() => import("./pages/RoadmapPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const License = lazy(() => import("./pages/License").then(m => ({ default: m.License })));
const LoginPage = lazy(() => import("./dashboard/auth/LoginPage"));
const SettingsPage = lazy(() => import("./dashboard/settings/SettingsPage"));
const UserSettingsPage = lazy(() => import("./dashboard/settings/UserSettingsPage"));
const GuildSelectionPage = lazy(() => import("./dashboard/settings/GuildSelectionPage"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const CMSPage = lazy(() => import("./dashboard/cms/CMSPage"));
const AdminPage = lazy(() => import("./dashboard/admin/AdminPage"));

// QueryClient with sane defaults — avoids hammering the API on every mount
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 min: don't refetch if data is fresh
      gcTime: 1000 * 60 * 10,      // 10 min: keep unused data in cache
      retry: 1,                     // only 1 retry on failure (default is 3)
      refetchOnWindowFocus: false,  // don't refetch just because user switched tabs
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30"
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{
          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
          scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
      </motion.div>
      <p className="text-muted-foreground text-sm font-medium">Lädt...</p>
    </div>
  </div>
);

// Shared page-transition wrapper
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Single unified route tree — no duplication, no double-render
const AppRoutes = () => (
  <PageTransition>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<Index />} />
        <Route path="/plugins" element={<PluginsPage />} />
        <Route path="/commands" element={<CommandsPage />} />
        <Route path="/status" element={<Status />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/tutorials" element={<BlogPage />} />

        {/* ── Legal ── */}
        <Route path="/legal/imprint" element={<Impressum />} />
        <Route path="/impressum.html" element={<Impressum />} />
        <Route path="/legal/privacy" element={<Datenschutz />} />
        <Route path="/datenschutz.html" element={<Datenschutz />} />
        <Route path="/legal/terms" element={<Nutzungsbedingungen />} />
        <Route path="/agb.html" element={<Nutzungsbedingungen />} />
        <Route path="/legal/license" element={<License />} />

        {/* ── Auth ── */}
        <Route path="/dash/login" element={<LoginPage />} />
        <Route path="/dash/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* ── Dashboard ── */}
        <Route path="/dash/guilds" element={<GuildSelectionPage />} />
        <Route path="/dash/settings" element={<SettingsPage />} />
        <Route path="/dash/user/settings" element={<UserSettingsPage />} />
        <Route path="/dash/admin" element={<AdminPage />} />
        <Route path="/dash/admin/cms" element={<CMSPage />} />

        {/* ── Fallback ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </PageTransition>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster richColors position="top-right" theme="dark" />
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;