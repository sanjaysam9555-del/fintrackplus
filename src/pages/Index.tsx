import { useState, useEffect, lazy, Suspense, useRef, useCallback } from "react";
import { GlassDock } from "@/components/GlassDock";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { Dashboard } from "@/components/Dashboard";
import { DashboardSkeleton, TransactionSkeleton } from "@/components/ui/skeleton-loader";
import { useFinanceStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { useSyncEngine } from "@/hooks/useSyncEngine";
import { motion, AnimatePresence } from "framer-motion";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";
import { Search } from "lucide-react";

// Lazy load heavy components that aren't needed immediately
const TransactionList = lazy(() => import("@/components/TransactionList").then(m => ({ default: m.TransactionList })));
const SettingsPage = lazy(() => import("@/components/SettingsPage").then(m => ({ default: m.SettingsPage })));
const AddTransactionSheet = lazy(() => import("@/components/AddTransactionSheet").then(m => ({ default: m.AddTransactionSheet })));
const ProjectOverviewPage = lazy(() => import("@/components/ProjectOverviewPage").then(m => ({ default: m.ProjectOverviewPage })));
const AISummaryPage = lazy(() => import("@/components/AISummaryPage").then(m => ({ default: m.AISummaryPage })));
const OnboardingFlow = lazy(() => import("@/components/OnboardingFlow").then(m => ({ default: m.OnboardingFlow })));

type TabId = 'home' | 'expenses' | 'add' | 'income' | 'projects';
type ViewMode = TabId | 'settings' | 'ai';
type SettingsSection = 'categories' | 'vendors' | 'projects' | 'reports' | 'notifications' | null;

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const { syncStatus } = useFinanceStore();
  const { user } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize airtight sync engine (all syncing happens silently in background)
  const { showOnboarding, userName, completeOnboarding, refreshData, isOnline, pendingCount } = useSyncEngine();
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Cmd/Ctrl + N for new transaction
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setIsAddSheetOpen(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Scroll to top when view changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [viewMode]);
  
  // Only show loading on initial mount, not during syncs
  useEffect(() => {
    // Once we have any data or the first sync completes, stop showing loading
    if (syncStatus === 'synced' || syncStatus === 'error') {
      setIsLoading(false);
    }
  }, [syncStatus]);
  
  const handleOpenAddSheet = () => setIsAddSheetOpen(true);
  const handleOpenSearch = useCallback(() => setIsSearchOpen(true), []);
  
  const handleNavigate = (section: string) => {
    if (section === 'settings') {
      setViewMode('settings');
      setSettingsSection(null);
    } else if (section === 'ai') {
      setViewMode('ai');
    } else if (section === 'search') {
      setIsSearchOpen(true);
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
  
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setViewMode(tab);
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
            onSearchClick={handleOpenSearch}
            onEditSheetChange={setIsEditSheetOpen}
          />
        );
      case 'expenses':
        return (
          <Suspense fallback={<TransactionListSkeleton />}>
            <TransactionList type="expense" userId={user?.id} onEditSheetChange={setIsEditSheetOpen} />
          </Suspense>
        );
      case 'income':
        return (
          <Suspense fallback={<TransactionListSkeleton />}>
            <TransactionList type="income" userId={user?.id} onEditSheetChange={setIsEditSheetOpen} />
          </Suspense>
        );
      case 'projects':
        return (
          <Suspense fallback={<ContentSkeleton />}>
            <ProjectOverviewPage userId={user?.id} onEditSheetChange={setIsEditSheetOpen} />
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
  
  // Hide dock when viewing settings, AI, or when any transaction sheet is open
  const showDock = viewMode !== 'settings' && viewMode !== 'ai' && !isAddSheetOpen && !isEditSheetOpen;
  
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
      
      {/* Desktop Layout with Sidebar */}
      <div className="flex w-full">
        {/* Desktop Sidebar - Hidden on mobile */}
        <DesktopSidebar
          activeTab={activeTab}
          viewMode={viewMode}
          onTabChange={handleTabChange}
          onAddClick={handleOpenAddSheet}
          onNavigate={handleNavigate}
        />
        
        {/* Main Content Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 h-screen overflow-y-auto overscroll-contain scroll-smooth"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="max-w-md mx-auto md:max-w-none md:mx-0 will-change-transform"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Glass Dock Navigation - Hidden on desktop and in settings/ai on mobile */}
      {showDock && (
        <GlassDock
          activeTab={activeTab}
          onTabChange={handleTabChange}
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
      
      {/* Global Search Dialog */}
      <GlobalSearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default Index;