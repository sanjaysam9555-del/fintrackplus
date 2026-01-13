import { useState, useEffect, lazy, Suspense } from "react";
import { GlassDock } from "@/components/GlassDock";
import { Dashboard } from "@/components/Dashboard";
import { DashboardSkeleton, TransactionSkeleton } from "@/components/ui/skeleton-loader";
import { useFinanceStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { useSyncEngine } from "@/hooks/useSyncEngine";
import { motion, AnimatePresence } from "framer-motion";

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

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(null);
  const { syncStatus } = useFinanceStore();
  const { user } = useAuth();
  
  // Initialize airtight sync engine (all syncing happens silently in background)
  const { showOnboarding, userName, completeOnboarding, refreshData, isOnline, pendingCount } = useSyncEngine();
  
  // Only show loading on initial mount, not during syncs
  useEffect(() => {
    // Once we have any data or the first sync completes, stop showing loading
    if (syncStatus === 'synced' || syncStatus === 'error') {
      setIsLoading(false);
    }
  }, [syncStatus]);
  
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
            isRefreshing={false}
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
      
      {/* Main Content Area - No pull-to-refresh, stable layout */}
      <div className="h-screen overflow-y-auto">
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
      </div>
      
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