import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ChevronRight, 
  Moon,
  Sun,
  Pencil,
  Grid3X3,
  Store,
  FolderKanban,
  FileBarChart,
  ArrowLeft,
  LogOut
} from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import avatarImage from "@/assets/avatar-swati.jpg";
import { ProfileEditSheet } from "./ProfileEditSheet";
import { CategoriesSection } from "./settings/CategoriesSection";
import { VendorsSection } from "./settings/VendorsSection";
import { ProjectsSection } from "./settings/ProjectsSection";
import { ReportsSection } from "./settings/ReportsSection";
import { Button } from "./ui/button";

type SettingsSection = 'categories' | 'vendors' | 'projects' | 'reports' | null;

interface SettingsPageProps {
  initialSection?: SettingsSection;
  onSectionChange?: (section: SettingsSection) => void;
  onBack?: () => void;
}

export const SettingsPage = ({ initialSection = null, onSectionChange, onBack }: SettingsPageProps) => {
  const { categories, projects, userProfile } = useFinanceStore();
  const { signOut, user } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  
  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
  };
  
  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);
  
  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
    onSectionChange?.(section);
  };
  
  const handleBack = () => {
    handleSectionChange(null);
  };
  
  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  // Get unique vendors count from transactions
  const { transactions, vendors } = useFinanceStore();
  const vendorCount = vendors.length || new Set(transactions.map(t => t.vendor)).size;
  
  const menuItems = [
    {
      section: "Data Management",
      items: [
        { 
          icon: Grid3X3, 
          label: "Categories", 
          sublabel: `${categories.length} categories`,
          onClick: () => handleSectionChange('categories')
        },
        { 
          icon: Store, 
          label: "Vendors", 
          sublabel: `${vendorCount} vendors`,
          onClick: () => handleSectionChange('vendors')
        },
        { 
          icon: FolderKanban, 
          label: "Project Labels", 
          sublabel: `${projects.length} projects`,
          onClick: () => handleSectionChange('projects')
        },
        { 
          icon: FileBarChart, 
          label: "Reports", 
          sublabel: "View & export",
          onClick: () => handleSectionChange('reports')
        },
      ]
    },
  ];
  
  // Render section sub-pages using dedicated components
  if (activeSection === 'categories') {
    return <CategoriesSection onBack={handleBack} />;
  }
  if (activeSection === 'vendors') {
    return <VendorsSection onBack={handleBack} />;
  }
  if (activeSection === 'projects') {
    return <ProjectsSection onBack={handleBack} />;
  }
  if (activeSection === 'reports') {
    return <ReportsSection onBack={handleBack} />;
  }
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="p-4 pt-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>
      
      {/* Profile Card */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-card border border-border"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
              <img 
                src={userProfile.avatar || avatarImage} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{userProfile.name}</h2>
              <p className="text-sm text-muted-foreground">swati.sharma@email.com</p>
              <p className="text-xs text-primary mt-1">Guest Mode • Data stored locally</p>
            </div>
          </div>
          <button 
            onClick={() => setShowProfileEdit(true)}
            className="w-full mt-4 flex items-center justify-center gap-2 p-2.5 bg-primary/10 text-primary rounded-xl font-medium text-sm hover:bg-primary/20 transition-colors"
          >
            <Pencil size={14} />
            Edit Profile
          </button>
        </motion.div>
      </div>
      
      {/* Theme Toggle */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-card border border-border"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon size={20} /> : <Sun size={20} />}
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                isDark ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  isDark ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Menu Sections */}
      {menuItems.map((section, sectionIndex) => (
        <div key={section.section} className="px-4 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {section.section}
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="bg-card rounded-2xl shadow-card border border-border overflow-hidden"
          >
            {section.items.map((item, index) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${
                  index !== section.items.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted">
                  <item.icon size={20} className="text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.sublabel}</p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
            ))}
          </motion.div>
        </div>
      ))}
      
      {/* Logout Button */}
      <div className="px-4 mb-6">
        <Button 
          variant="outline" 
          className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-2" />
          Sign Out
        </Button>
      </div>
      
      {/* App Info */}
      <div className="px-4 text-center">
        <p className="text-xs text-muted-foreground">
          FinTrack Pro v1.0.0
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {user?.email}
        </p>
      </div>
      
      {/* Profile Edit Sheet */}
      <ProfileEditSheet
        isOpen={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
      />
    </div>
  );
};
