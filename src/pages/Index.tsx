import { useState, useEffect, lazy, Suspense, useCallback, useRef } from "react";
import { GlassDock } from "@/components/GlassDock";
import { Dashboard } from "@/components/Dashboard";
import { DashboardSkeleton, TransactionSkeleton } from "@/components/ui/skeleton-loader";
import { useFinanceStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { useSyncEngine } from "@/hooks/useSyncEngine";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy load heavy components that aren't needed immediately
const TransactionList = lazy(() => import("@/components/TransactionList").then(m => ({ default: m.TransactionList })));
const SettingsPage = lazy(() => import("@/components/SettingsPage").then(m => ({ default: m.SettingsPage })));
const AddTransactionSheet = lazy(() => import("@/components/AddTransactionSheet").then(m => ({ default: m.AddTransactionSheet })));
const NotificationsPage = lazy(() => import("@/components/NotificationsPage").then(m => ({ default: m.NotificationsPage })));
const AISummaryPage = lazy(() => import("@/components/AISummaryPage").then(m => ({ default: m.AISummaryPage })));
const OnboardingFlow = lazy(() => import("@/components/OnboardingFlow").then(m => ({ default: m.OnboardingFlow })));

type TabId = 'home' | 'expenses' | 'add' | 'income' | 'notifications';
type ViewMode = TabId | 'settings' | 'ai';
type SettingsSection = 'categories' | 'vendors' | 'projects' | 'reports' | null;

// Skeleton loader for transaction lists
const TransactionListSkeleton = () => (
  <div className="p-4 space-y-2">
    <div className="h-6 w-32 bg-muted rounded skeleton mb-4" />
    {[1, 2, 3, 4, 5].map(i => (
      <TransactionSkeleton key={i} />
    ))}
  </div>
);

// Skeleton loader for settings
const SettingsSkeleton = () => (
  <div className="p-4 space-y-4">
    <div className="h-8 w-24 bg-muted rounded skeleton" />
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-muted rounded skeleton" />
            <div className="h-3 w-32 bg-muted rounded skeleton" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Generic content skeleton
const ContentSkeleton = () => (
  <div className="p-4 space-y-4">
    <div className="h-6 w-40 bg-muted rounded skeleton" />
    <div className="bg-card rounded-2xl p-6 space-y-4">
      <div className="h-4 w-full bg-muted rounded skeleton" />
      <div className="h-4 w-3/4 bg-muted rounded skeleton" />
      <div className="h-4 w-1/2 bg-muted rounded skeleton" />
    </div>
  </div>
);

const PULL_THRESHOLD = 80;
const INDICATOR_SIZE = 40;

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(null);
  const { syncStatus } = useFinanceStore();
  const { user } = useAuth();
  
  // Pull to refresh state
  const [isPulling, setIsPulling] = useState(false);
  const pullY = useMotionValue(0);
  const pullOpacity = useTransform(pullY, [0, 20, PULL_THRESHOLD], [0, 0.5, 1]);
  const pullScale = useTransform(pullY, [0, PULL_THRESHOLD], [0.6, 1]);
  const pullRotation = useTransform(pullY, [0, PULL_THRESHOLD], [0, 180]);
  const pullTop = useTransform(pullY, [0, PULL_THRESHOLD], [-INDICATOR_SIZE, 16]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize airtight sync engine
  const { showOnboarding, userName, completeOnboarding, refreshData, isRefreshing, isOnline, pendingCount } = useSyncEngine();
  
  useEffect(() => {
    // Set loading based on sync status
    if (syncStatus === 'synced' || syncStatus === 'error') {
      setIsLoading(false);
    } else if (syncStatus === 'syncing') {
      setIsLoading(true);
    }
  }, [syncStatus]);
  
  // Handle pull to refresh
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = scrollContainerRef.current;
    if (container && container.scrollTop <= 0) {
      setIsPulling(true);
    }
  }, []);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;
    const container = scrollContainerRef.current;
    if (!container || container.scrollTop > 0) {
      setIsPulling(false);
      pullY.set(0);
      return;
    }
  }, [isPulling, pullY]);
  
  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isPulling) return;
    if (info.offset.y > 0) {
      const dampedY = Math.min(info.offset.y * 0.5, 120);
      pullY.set(dampedY);
    }
  }, [isPulling, pullY]);
  
  const handleDragEnd = useCallback(async () => {
    if (pullY.get() >= PULL_THRESHOLD && !isRefreshing) {
      refreshData();
    }
    pullY.set(0);
    setIsPulling(false);
  }, [pullY, isRefreshing, refreshData]);
  
  const handleOpenAddSheet = () => setIsAddSheetOpen(true);
  
  const handleNavigate = (section: string) => {
    if (section === 'settings') {
      setViewMode('settings');
      setSettingsSection(null);
    } else if (section === 'ai') {
      setViewMode('ai');
    } else {
      setSettingsSection(section as SettingsSection);
      setViewMode('settings');
    }
  };
  
  const handleBackToHome = () => {
    setViewMode('home');
    setActiveTab('home');
    setSettingsSection(null);
  };
  
  const renderContent = () => {
    switch (viewMode) {
      case 'home':
        return isLoading ? <DashboardSkeleton /> : (
          <Dashboard 
            isLoading={false} 
            onAddClick={handleOpenAddSheet} 
            onNavigate={handleNavigate}
            onRefresh={refreshData}
            isRefreshing={isRefreshing}
            isOnline={isOnline}
            pendingCount={pendingCount}
            userId={user?.id}
          />
        );
      case 'expenses':
        return (
          <Suspense fallback={<TransactionListSkeleton />}>
            <TransactionList type="expense" userId={user?.id} />
          </Suspense>
        );
      case 'income':
        return (
          <Suspense fallback={<TransactionListSkeleton />}>
            <TransactionList type="income" userId={user?.id} />
          </Suspense>
        );
      case 'notifications':
        return (
          <Suspense fallback={<ContentSkeleton />}>
            <NotificationsPage />
          </Suspense>
        );
      case 'ai':
        return (
          <Suspense fallback={<ContentSkeleton />}>
            <AISummaryPage onBack={handleBackToHome} />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<SettingsSkeleton />}>
            <SettingsPage initialSection={settingsSection} onSectionChange={setSettingsSection} onBack={handleBackToHome} />
          </Suspense>
        );
      default:
        return isLoading ? <DashboardSkeleton /> : <Dashboard isLoading={false} onAddClick={handleOpenAddSheet} onNavigate={handleNavigate} />;
    }
  };
  
  // Hide dock when viewing settings or AI (accessed from home page buttons)
  const showDock = viewMode !== 'settings' && viewMode !== 'ai';
  
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Pull to Refresh Indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, top: -INDICATOR_SIZE }}
            animate={{ 
              opacity: isRefreshing ? 1 : pullOpacity.get(),
              scale: isRefreshing ? 1 : pullScale.get(),
              top: isRefreshing ? 16 : pullTop.get()
            }}
            exit={{ opacity: 0, scale: 0.6, top: -INDICATOR_SIZE }}
            transition={{ duration: 0.2 }}
            style={!isRefreshing ? { opacity: pullOpacity, scale: pullScale, top: pullTop } : undefined}
            className={cn(
              "fixed left-1/2 z-50 flex items-center justify-center",
              "w-10 h-10 rounded-full bg-card border border-border shadow-lg",
              "pointer-events-none",
              "-translate-x-1/2"
            )}
          >
            <motion.div
              style={!isRefreshing ? { rotate: pullRotation } : undefined}
              animate={isRefreshing ? { rotate: 360 } : {}}
              transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
            >
              <RefreshCw size={18} className="text-primary" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Flow */}
      <AnimatePresence>
        {showOnboarding && (
          <Suspense fallback={null}>
            <OnboardingFlow 
              onComplete={completeOnboarding} 
              userName={userName}
            />
          </Suspense>
        )}
      </AnimatePresence>
      
      {/* Main Content Area with Pull to Refresh */}
      <motion.div
        ref={scrollContainerRef}
        className="h-screen overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        drag={isPulling ? "y" : false}
        dragConstraints={{ top: 0, bottom: 120 }}
        dragElastic={0}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y: isPulling ? pullY : 0 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="max-w-md mx-auto"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      
      {/* Glass Dock Navigation - Hidden in settings sub-sections */}
      {showDock && (
        <GlassDock
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setViewMode(tab);
            setSettingsSection(null);
          }}
          onAddClick={() => setIsAddSheetOpen(true)}
        />
      )}
      
      {/* Add Transaction Sheet - Lazy loaded */}
      {isAddSheetOpen && (
        <Suspense fallback={null}>
          <AddTransactionSheet
            isOpen={isAddSheetOpen}
            onClose={() => setIsAddSheetOpen(false)}
            userId={user?.id}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Index;