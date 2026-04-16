import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { UserRoleProvider } from "@/hooks/UserRoleProvider";
import { useStatusBar } from "@/hooks/useStatusBar";
import { AnimatePresence } from "framer-motion";
import { SplashScreen } from "@/components/SplashScreen";
import { isLandingDomain, isAppDomain, isPWA, appPath } from "@/lib/domainUtils";
import { PaywallGate } from "@/components/PaywallGate";

// Lazy load pages for better initial load performance
const Index = lazy(() => import("./pages/Index"));
const AuthPage = lazy(() => import("./pages/Auth").then(m => ({ default: m.AuthPage })));
const ResetPasswordPage = lazy(() => import("./pages/ResetPassword").then(m => ({ default: m.ResetPasswordPage })));
const InstallPage = lazy(() => import("./pages/Install").then(m => ({ default: m.InstallPage })));
const NotFound = lazy(() => import("./pages/NotFound"));
const Landing = lazy(() => import("./pages/Landing"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Refund = lazy(() => import("./pages/Refund"));
const Billing = lazy(() => import("./pages/Billing"));
const AdminConsole = lazy(() => import("./pages/AdminConsole"));

// Prefetch critical routes during idle time so they load instantly when needed
if (typeof window !== 'undefined') {
  const prefetch = () => {
    import("./pages/Index");
    import("./pages/Auth");
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(prefetch);
  } else {
    setTimeout(prefetch, 1000);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

// Skeleton loading component for auth page
const AuthPageSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col items-center justify-center p-4">
    <div className="w-full max-w-sm animate-pulse">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted skeleton" />
        <div className="h-8 w-40 mx-auto bg-muted rounded-lg skeleton" />
        <div className="h-4 w-32 mx-auto mt-2 bg-muted rounded skeleton" />
      </div>
      <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 space-y-5">
        <div className="space-y-2">
          <div className="h-3 w-12 bg-muted rounded skeleton" />
          <div className="h-12 w-full bg-muted rounded-xl skeleton" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 bg-muted rounded skeleton" />
          <div className="h-12 w-full bg-muted rounded-xl skeleton" />
        </div>
        <div className="h-12 w-full bg-primary/20 rounded-xl skeleton" />
      </div>
    </div>
  </div>
);

// Skeleton loading component for main app
const AppSkeleton = () => (
  <div className="min-h-screen bg-background p-4 animate-pulse">
    <div className="max-w-md mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-muted skeleton" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded skeleton" />
          <div className="h-5 w-32 bg-muted rounded skeleton" />
        </div>
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card rounded-2xl p-4 space-y-2">
            <div className="h-4 w-16 bg-muted rounded skeleton" />
            <div className="h-6 w-20 bg-muted rounded skeleton" />
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="bg-card rounded-2xl p-4 space-y-4">
        <div className="h-6 w-32 bg-muted rounded skeleton" />
        <div className="h-40 w-full bg-muted rounded-xl skeleton" />
      </div>
    </div>
  </div>
);

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [hasSeenSplash, setHasSeenSplash] = useState(false);
  
  // Configure native status bar
  useStatusBar();
  
  // Check if splash was shown in this session
  useEffect(() => {
    const splashShown = sessionStorage.getItem('splashShown');
    if (splashShown) {
      setShowSplash(false);
      setHasSeenSplash(true);
    }
  }, []);
  
  const handleSplashComplete = () => {
    setShowSplash(false);
    setHasSeenSplash(true);
    sessionStorage.setItem('splashShown', 'true');
  };

  // Show splash only on first load of session
  if (showSplash && !hasSeenSplash) {
    return (
      <AnimatePresence mode="wait">
        <SplashScreen onComplete={handleSplashComplete} />
      </AnimatePresence>
    );
  }

  if (loading) {
    return <AuthPageSkeleton />;
  }

  // On app.fintrackplus.com → serve app routes directly (same as dev/preview)
  if (isAppDomain()) {
    return (
      <Suspense fallback={user ? <AppSkeleton /> : <AuthPageSkeleton />}>
        <Routes>
          <Route path="/install" element={<InstallPage />} />
          <Route path="/admin/comp" element={<AdminConsole />} />
          <Route path="/landing" element={<Landing />} />
         <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
          {!user ? (
            <Route path="*" element={<AuthPage />} />
          ) : (
            <>
              <Route path="/billing" element={<Billing />} />
              <Route path="/" element={<PaywallGate><Index /></PaywallGate>} />
              <Route path="*" element={<NotFound />} />
            </>
          )}
        </Routes>
      </Suspense>
    );
  }

  // On fintrackplus.com / www.fintrackplus.com → landing + app under /application/*
  if (isLandingDomain()) {
    return (
      <Suspense fallback={user ? <AppSkeleton /> : <AuthPageSkeleton />}>
        <Routes>
          {/* Public pages */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund" element={<Refund />} />

          {/* Hidden super-admin route — works on root domain too */}
          <Route path="/admin/comp" element={<AdminConsole />} />

          {/* App routes under /application (backward compat) */}
          <Route path="/application/install" element={<InstallPage />} />
          <Route path="/application/admin/comp" element={<AdminConsole />} />
          <Route path="/application/reset-password" element={<ResetPasswordPage />} />
          <Route path="/application/auth" element={user ? <Navigate to="/application" replace /> : <AuthPage />} />
          {user ? (
            <>
              <Route path="/application/billing" element={<Billing />} />
              <Route path="/application" element={<PaywallGate><Index /></PaywallGate>} />
              <Route path="/application/*" element={<NotFound />} />
            </>
          ) : (
            <Route path="/application/*" element={<AuthPage />} />
          )}

          {/* Everything else → landing (PWA users go straight to app) */}
          <Route path="*" element={isPWA() ? <Navigate to="/application" replace /> : <Landing />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={user ? <AppSkeleton /> : <AuthPageSkeleton />}>
      <Routes>
        {/* Public routes */}
        <Route path="/install" element={<InstallPage />} />
        <Route path="/admin/comp" element={<AdminConsole />} />
        <Route path="/application/admin/comp" element={<AdminConsole />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />

        {/* /application/ routes for cross-domain compatibility */}
        <Route path="/application/install" element={<InstallPage />} />
        <Route path="/application/reset-password" element={<ResetPasswordPage />} />
        <Route path="/application/auth" element={user ? <Navigate to="/application" replace /> : <AuthPage />} />

        {!user ? (
          <Route path="*" element={<AuthPage />} />
        ) : (
          <>
            <Route path="/billing" element={<Billing />} />
            <Route path="/application/billing" element={<Billing />} />
            <Route path="/" element={<PaywallGate><Index /></PaywallGate>} />
            <Route path="/application" element={<PaywallGate><Index /></PaywallGate>} />
            <Route path="*" element={<NotFound />} />
          </>
        )}
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <UserRoleProvider>
            <AppRoutes />
          </UserRoleProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
