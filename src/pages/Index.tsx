import { useState, useEffect } from "react";
import { GlassDock } from "@/components/GlassDock";
import { Dashboard } from "@/components/Dashboard";
import { TransactionList } from "@/components/TransactionList";
import { SettingsPage } from "@/components/SettingsPage";
import { AddTransactionSheet } from "@/components/AddTransactionSheet";
import { NotificationsPage } from "@/components/NotificationsPage";
import { useFinanceStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

type TabId = 'home' | 'expenses' | 'add' | 'income' | 'notifications' | 'settings';
type SettingsSection = 'categories' | 'vendors' | 'projects' | 'reports' | null;

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(null);
  const { transactions, loadDemoData } = useFinanceStore();
  
  useEffect(() => {
    // Auto-load demo data on first visit
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    // Always load demo data for showcase
    if (transactions.length === 0) {
      loadDemoData();
    }
    
    return () => clearTimeout(timer);
  }, [transactions.length, loadDemoData]);
  
  const handleOpenAddSheet = () => setIsAddSheetOpen(true);
  
  const handleNavigate = (section: string) => {
    if (section === 'settings') {
      setActiveTab('settings');
      setSettingsSection(null);
    } else {
      setSettingsSection(section as SettingsSection);
      setActiveTab('settings');
    }
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard isLoading={isLoading} onAddClick={handleOpenAddSheet} onNavigate={handleNavigate} />;
      case 'expenses':
        return <TransactionList type="expense" />;
      case 'income':
        return <TransactionList type="income" />;
      case 'notifications':
        return <NotificationsPage />;
      case 'settings':
        return <SettingsPage initialSection={settingsSection} onSectionChange={setSettingsSection} />;
      default:
        return <Dashboard isLoading={isLoading} onAddClick={handleOpenAddSheet} onNavigate={handleNavigate} />;
    }
  };
  
  // Hide dock when viewing a settings sub-section
  const showDock = !(activeTab === 'settings' && settingsSection !== null);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
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
            setSettingsSection(null);
          }}
          onAddClick={() => setIsAddSheetOpen(true)}
        />
      )}
      
      {/* Add Transaction Sheet */}
      <AddTransactionSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
      />
    </div>
  );
};

export default Index;
