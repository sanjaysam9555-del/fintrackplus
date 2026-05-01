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
import { PageLoader } from "@/components/ui/skeleton-loader";
import { useSubscriptionVerifier } from "@/hooks/useSubscriptionVerifier";

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

const FullScreenLoader = () => <PageLoader className="min-h-screen" />;
const AuthPageSkeleton = FullScreenLoader;
const AppSkeleton = FullScreenLoader;

const SubscriptionVerifier = () => {
  useSubscriptionVerifier();
  return null;
};

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

  // Mount the daily verifier exactly once whenever a user is signed in.
  // It owns ALL server-side subscription checks; nothing else triggers them.
  const verifier = user ? <SubscriptionVerifier /> : null;

  // On app.fintrackplus.com → serve app routes directly (same as dev/preview)
  if (isAppDomain()) {
    return (
      <>
        {verifier}
        <Suspense fallback={user ? <AppSkeleton /> : <AuthPageSkeleton />}>
          <Routes>
            <Route path="/install" element={<InstallPage />} />
            <Route path="/admin" element={<AdminConsole />} />
            <Route path="/admin/comp" element={<AdminConsole />} />
            <Route path="/landing" element={<Landing />} />
           <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
            {!user ? (
              <Route path="*" element={<Navigate to="/auth" replace />} />
            ) : (
              <>
                <Route path="/billing" element={<Billing />} />
                <Route path="/" element={<PaywallGate><Index /></PaywallGate>} />
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </Suspense>
      </>
    );
  }

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
          <Route path="/admin" element={<AdminConsole />} />
          <Route path="/admin/comp" element={<AdminConsole />} />

          {/* App routes under /application (backward compat) */}
          <Route path="/application/install" element={<InstallPage />} />
          <Route path="/application/admin" element={<AdminConsole />} />
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
            <Route path="/application/*" element={<Navigate to="/application/auth" replace />} />
          )}

          {/* Everything else → landing (PWA users go straight to app) */}
          <Route path="*" element={isPWA() ? <Navigate to="/application" replace /> : <Landing />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <>
      {verifier}
      <Suspense fallback={user ? <AppSkeleton /> : <AuthPageSkeleton />}>
        <Routes>
          {/* Public routes */}
          <Route path="/install" element={<InstallPage />} />
          <Route path="/admin" element={<AdminConsole />} />
          <Route path="/admin/comp" element={<AdminConsole />} />
          <Route path="/application/admin" element={<AdminConsole />} />
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
            <Route path="*" element={<Navigate to="/auth" replace />} />
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
    </>
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
