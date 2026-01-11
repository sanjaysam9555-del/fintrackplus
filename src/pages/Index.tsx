import { useState, useEffect } from "react";
import { GlassDock } from "@/components/GlassDock";
import { Dashboard } from "@/components/Dashboard";
import { TransactionList } from "@/components/TransactionList";
import { SettingsPage } from "@/components/SettingsPage";
import { AddTransactionSheet } from "@/components/AddTransactionSheet";
import { NotificationsPage } from "@/components/NotificationsPage";
import { AISummaryPage } from "@/components/AISummaryPage";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { useFinanceStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { useCloudSync } from "@/hooks/useCloudSync";
import { motion, AnimatePresence } from "framer-motion";

type TabId = 'home' | 'expenses' | 'add' | 'income' | 'notifications';
type ViewMode = TabId | 'settings' | 'ai';
type SettingsSection = 'categories' | 'vendors' | 'projects' | 'reports' | null;

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(null);
  const { syncStatus } = useFinanceStore();
  const { user } = useAuth();
  
  // Initialize cloud sync
  const { showOnboarding, userName, completeOnboarding } = useCloudSync();
  
  useEffect(() => {
    // Set loading based on sync status
    if (syncStatus === 'synced' || syncStatus === 'error') {
      setIsLoading(false);
    } else if (syncStatus === 'syncing') {
      setIsLoading(true);
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
        return <Dashboard isLoading={isLoading} onAddClick={handleOpenAddSheet} onNavigate={handleNavigate} />;
      case 'expenses':
        return <TransactionList type="expense" />;
      case 'income':
        return <TransactionList type="income" />;
      case 'notifications':
        return <NotificationsPage />;
      case 'ai':
        return <AISummaryPage onBack={handleBackToHome} />;
      case 'settings':
        return <SettingsPage initialSection={settingsSection} onSectionChange={setSettingsSection} onBack={handleBackToHome} />;
      default:
        return <Dashboard isLoading={isLoading} onAddClick={handleOpenAddSheet} onNavigate={handleNavigate} />;
    }
  };
  
  // Hide dock when viewing settings or AI (accessed from home page buttons)
  const showDock = viewMode !== 'settings' && viewMode !== 'ai';
  
  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Flow */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingFlow 
            onComplete={completeOnboarding} 
            userName={userName}
          />
        )}
      </AnimatePresence>
      {/* Main Content Area */}
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
      
      {/* Add Transaction Sheet */}
      <AddTransactionSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        userId={user?.id}
      />
    </div>
  );
};

export default Index;