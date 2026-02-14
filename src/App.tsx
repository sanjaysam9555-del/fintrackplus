import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useStatusBar } from "@/hooks/useStatusBar";
import { AnimatePresence } from "framer-motion";
import { SplashScreen } from "@/components/SplashScreen";
import { isLandingDomain } from "@/lib/domainUtils";

// Lazy load pages for better initial load performance
const Index = lazy(() => import("./pages/Index"));
const AuthPage = lazy(() => import("./pages/Auth").then(m => ({ default: m.AuthPage })));
const InstallPage = lazy(() => import("./pages/Install").then(m => ({ default: m.InstallPage })));
const NotFound = lazy(() => import("./pages/NotFound"));
const Landing = lazy(() => import("./pages/Landing"));

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

  // On fintrackplus.com / www.fintrackplus.com → always show landing page
  if (isLandingDomain()) {
    return (
      <Suspense fallback={<AuthPageSkeleton />}>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={user ? <AppSkeleton /> : <AuthPageSkeleton />}>
      <Routes>
        {/* Public routes */}
        <Route path="/install" element={<InstallPage />} />
        <Route path="/landing" element={<Landing />} />
        {!user ? (
          <Route path="*" element={<AuthPage />} />
        ) : (
          <>
            <Route path="/" element={<Index />} />
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
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
