import { useState, useEffect, lazy, Suspense, useRef, useCallback, useMemo } from "react";
import { GlassDock } from "@/components/GlassDock";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { Dashboard } from "@/components/Dashboard";
import { DashboardSkeleton, PageLoader } from "@/components/ui/skeleton-loader";
import { useFinanceStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { useSyncEngine } from "@/hooks/useSyncEngine";
import { useTheme } from "@/hooks/useTheme";
import { useUserRole } from "@/hooks/useUserRole";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { ForcePasswordChange } from "@/components/ForcePasswordChange";
import { useLocation, useNavigate } from "react-router-dom";
import { appPath } from "@/lib/domainUtils";

// Lazy load heavy components that aren't needed immediately
const TransactionList = lazy(() => import("@/components/TransactionList").then(m => ({ default: m.TransactionList })));
const SettingsPage = lazy(() => import("@/components/SettingsPage").then(m => ({ default: m.SettingsPage })));
const AddTransactionSheet = lazy(() => import("@/components/AddTransactionSheet").then(m => ({ default: m.AddTransactionSheet })));
const ProjectOverviewPage = lazy(() => import("@/components/ProjectOverviewPage").then(m => ({ default: m.ProjectOverviewPage })));
const AISummaryPage = lazy(() => import("@/components/AISummaryPage").then(m => ({ default: m.AISummaryPage })));
const OnboardingFlow = lazy(() => import("@/components/OnboardingFlow").then(m => ({ default: m.OnboardingFlow })));
const GlobalSearchDialog = lazy(() => import("@/components/GlobalSearchDialog").then(m => ({ default: m.GlobalSearchDialog })));

type TabId = 'home' | 'expenses' | 'add' | 'income' | 'projects';
type ViewMode = TabId | 'settings' | 'ai';
type SettingsSection = 'categories' | 'vendors' | 'labels' | 'reports' | 'logs' | 'partners' | 'features' | 'team' | 'approvals' | 'backup' | 'recurring' | 'branding' | 'documents' | 'subscription' | null;

// Unified loading state — single centered branded spinner across all views
const TransactionListSkeleton = () => <PageLoader />;
const SettingsSkeleton = () => <PageLoader />;
const ContentSkeleton = () => <PageLoader />;

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const handleEditSheetChange = useCallback((open: boolean) => {
    setIsEditSheetOpen(open);
  }, []);
  const { syncStatus } = useFinanceStore();
  const { user } = useAuth();
  const { isEmployee, isOwner, mustChangePassword, memberId, loading: roleLoading, refetch: refetchRole } = useUserRole();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Honor deep-link state (e.g. from Billing back button) to open a Settings section
  useEffect(() => {
    const state = location.state as { openSettings?: SettingsSection } | null;
    if (state?.openSettings !== undefined) {
      setViewMode('settings');
      setSettingsSection(state.openSettings);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Initialize airtight sync engine (all syncing happens silently in background)
  const { showOnboarding, userName, completeOnboarding, refreshData, isOnline, pendingCount } = useSyncEngine();
  
  // Apply theme at app level (not just Settings)
  useTheme();
  
  const isMobile = useIsMobile();
  
  // Swipe from right edge to open settings (mobile only)
  const openSettingsSwipe = useSwipeGesture({
    onSwipeLeft: () => {
      setViewMode('settings');
      setSettingsSection(null);
    },
    enabled: isMobile && viewMode !== 'settings' && viewMode !== 'ai' && !isAddSheetOpen && !isEditSheetOpen,
    requireRightEdge: true,
    edgeThreshold: 30,
    swipeThreshold: 80,
  });
  
  
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
  
  // Show the dashboard skeleton only on the very first paint, then hand off
  // to the live Dashboard. Sync updates flow in silently — never gate the UI
  // on syncStatus, which can flip and cause skeleton↔content flicker.
  useEffect(() => {
    setIsLoading(false);
  }, []);
  
  const resetScrollPosition = useCallback(() => {
    // iOS PWA: reset scroll after sheets close to prevent safe-area spacing drift
    requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({ top: 0 });
    });
  }, []);

  const handleOpenAddSheet = () => setIsAddSheetOpen(true);
  const handleCloseAddSheet = useCallback(() => {
    setIsAddSheetOpen(false);
    resetScrollPosition();
  }, [resetScrollPosition]);
  const handleOpenSearch = useCallback(() => setIsSearchOpen(true), []);
  
  const navigatedFromHome = useRef(false);
  
  const handleNavigate = (section: string) => {
    if (section === 'settings') {
      navigatedFromHome.current = false;
      setViewMode('settings');
      setSettingsSection(null);
    } else if (section === 'ai') {
      if (isEmployee) return;
      setViewMode('ai');
    } else if (section === 'search') {
      setIsSearchOpen(true);
    } else {
      // Track if navigating from non-settings view (e.g. home)
      navigatedFromHome.current = viewMode !== 'settings';
      setSettingsSection(section as SettingsSection);
      setViewMode('settings');
    }
  };
  
  const handleBackToHome = useCallback(() => {
    setViewMode('home');
    setActiveTab('home');
    setSettingsSection(null);
  }, []);
  
  // Swipe right to dismiss settings (mobile only)
  const dismissSettingsSwipe = useSwipeGesture({
    onSwipeRight: handleBackToHome,
    enabled: isMobile && viewMode === 'settings',
    swipeThreshold: 100,
  });
  
  // Track previous view to know if we're transitioning to/from settings
  const prevViewRef = useRef<ViewMode>(viewMode);
  useEffect(() => {
    prevViewRef.current = viewMode;
  }, [viewMode]);
  
  // Animation variants for settings on mobile
  const settingsMotionProps = useMemo(() => {
    const isSettingsTransition = isMobile && (viewMode === 'settings' || prevViewRef.current === 'settings');
    if (isSettingsTransition) {
      return {
        initial: viewMode === 'settings' ? { x: '100%', opacity: 1 } : { x: 0, opacity: 1 },
        animate: { x: 0, opacity: 1 },
        exit: viewMode === 'settings' ? { x: 0, opacity: 1 } : { x: '100%', opacity: 1 },
        transition: { type: 'spring' as const, damping: 20, stiffness: 200 },
      };
    }
    return {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -8 },
      transition: { duration: 0.2, ease: 'easeOut' as const },
    };
  }, [isMobile, viewMode]);
  
  const handleTabChange = (tab: TabId) => {
    if (tab === activeTab && viewMode === tab) return;
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
            onEditSheetChange={handleEditSheetChange}
            isEmployee={isEmployee}
          />
        );
      case 'expenses':
        return (
          <Suspense fallback={<TransactionListSkeleton />}>
            <TransactionList type="expense" userId={user?.id} isEmployee={isEmployee} onEditSheetChange={handleEditSheetChange} onSearchClick={handleOpenSearch} onNavigate={handleNavigate} />
          </Suspense>
        );
      case 'income':
        return (
          <Suspense fallback={<TransactionListSkeleton />}>
            <TransactionList type="income" userId={user?.id} isEmployee={isEmployee} onEditSheetChange={handleEditSheetChange} onSearchClick={handleOpenSearch} onNavigate={handleNavigate} />
          </Suspense>
        );
      case 'projects':
        return (
          <Suspense fallback={<ContentSkeleton />}>
            <ProjectOverviewPage userId={user?.id} isEmployee={isEmployee} onEditSheetChange={handleEditSheetChange} onSearchClick={handleOpenSearch} />
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
            <SettingsPage initialSection={settingsSection} onSectionChange={setSettingsSection} onBack={handleBackToHome} onBackToHome={navigatedFromHome.current ? handleBackToHome : undefined} onRefresh={refreshData} isRefreshing={false} isOnline={isOnline} pendingCount={pendingCount} />
          </Suspense>
        );
      default:
        return isLoading ? <DashboardSkeleton /> : <Dashboard isLoading={false} onAddClick={handleOpenAddSheet} onNavigate={handleNavigate} />;
    }
  };
  
  // Hide dock when viewing settings, AI, or when any transaction sheet is open
  const showDock = viewMode !== 'settings' && viewMode !== 'ai' && !isAddSheetOpen && !isEditSheetOpen;
  
  // Force password change gate
  if (mustChangePassword && memberId && !roleLoading) {
    return <ForcePasswordChange memberId={memberId} onComplete={refetchRole} />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Onboarding Flow */}
      <AnimatePresence>
        {showOnboarding && (
          <Suspense fallback={null}>
            <OnboardingFlow 
              onComplete={completeOnboarding} 
              onActivateTrial={() => {
                completeOnboarding();
                navigate(appPath('/billing'));
              }}
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
          isEmployee={isEmployee}
        />
        
        {/* Main Content Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 h-dvh overflow-y-auto overscroll-contain relative"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }}
          onTouchStart={openSettingsSwipe.onTouchStart}
          onTouchEnd={openSettingsSwipe.onTouchEnd}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={viewMode}
              {...settingsMotionProps}
              className="max-w-md mx-auto md:max-w-none md:mx-0 will-change-transform"
              onTouchStart={viewMode === 'settings' ? dismissSettingsSwipe.onTouchStart : undefined}
              onTouchEnd={viewMode === 'settings' ? dismissSettingsSwipe.onTouchEnd : undefined}
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
            onClose={handleCloseAddSheet}
            userId={user?.id}
            isEmployee={isEmployee}
            onNavigate={handleNavigate}
          />
        </Suspense>
      )}
      
      {/* Global Search Dialog — only mounted when open to avoid running search hook on every store change */}
      {isSearchOpen && (
        <Suspense fallback={null}>
          <GlobalSearchDialog
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onNavigate={handleNavigate}
            userId={user?.id}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Index;
