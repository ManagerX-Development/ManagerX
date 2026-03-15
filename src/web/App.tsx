import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Lazy load all route components for better performance
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
const RoadmaPage = lazy(() => import("./pages/RoadmapPage"));
const License = lazy(() => import("./pages/License").then(module => ({ default: module.License })));
const LoginPage = lazy(() => import("./dashboard/LoginPage"));
const SettingsPage = lazy(() => import("./dashboard/SettingsPage"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30"
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
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

const DashboardRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.25,
          ease: "easeInOut",
        }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/dash/login" element={<LoginPage />} />
            <Route path="/dash/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/dash/settings" element={<SettingsPage />} />
            <Route path="/dash" element={<LoginPage />} />
            <Route path="/" element={<LoginPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

const MainRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.25, // Reduced from 0.4 for even snappier transitions
          ease: "easeInOut",
        }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Index />} />
            <Route path="/legal/imprint" element={<Impressum />} />
            <Route path="/impressum.html" element={<Impressum />} />
            <Route path="/legal/privacy" element={<Datenschutz />} />
            <Route path="/datenschutz.html" element={<Datenschutz />} />
            <Route path="/legal/terms" element={<Nutzungsbedingungen />} />
            <Route path="/agb.html" element={<Nutzungsbedingungen />} />
            <Route path="/legal/license" element={<License />} />
            <Route path="/plugins" element={<PluginsPage />} />
            <Route path="/commands" element={<CommandsPage />} />
            <Route path="/status" element={<Status />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/dash/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/dash/settings" element={<SettingsPage />} />
            <Route path="/dash/login" element={<LoginPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

const AppContent = () => {
  const hostname = window.location.hostname;
  const isDashboard = hostname.startsWith("dashboard.");

  // Wenn wir auf der Dashboard Subdomain sind
  if (isDashboard) {
    return <DashboardRoutes />;
  }

  // Normale Webseite (Haupt-Domain)
  return <MainRoutes />;
};

import { AuthProvider } from "./components/AuthProvider";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
