import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ChevronRight, 
  Download, 
  FileText, 
  FolderOpen, 
  Tag, 
  Database,
  Trash2,
  Moon,
  Sun,
  User
} from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import avatarImage from "@/assets/avatar-swati.jpg";

export const SettingsPage = () => {
  const { loadDemoData, clearAllData, transactions, categories, projects } = useFinanceStore();
  const [isDark, setIsDark] = useState(false);
  
  const handleExportCSV = () => {
    const headers = ['Date', 'Time', 'Type', 'Vendor', 'Category', 'Amount', 'Payment Method', 'Notes'];
    const rows = transactions.map(t => {
      const category = categories.find(c => c.id === t.categoryId);
      return [
        t.date,
        t.time,
        t.type,
        t.vendor,
        category?.name || 'Other',
        t.amount.toString(),
        t.paymentMethod,
        t.notes || ''
      ];
    });
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('CSV exported successfully!');
  };
  
  const handleExportPDF = () => {
    toast.info('PDF export coming soon!');
  };
  
  const handleLoadDemoData = () => {
    loadDemoData();
    toast.success('Demo data loaded successfully!');
  };
  
  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      clearAllData();
      toast.success('All data cleared');
    }
  };
  
  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    toast.success(`${isDark ? 'Light' : 'Dark'} mode enabled`);
  };
  
  const menuItems = [
    {
      section: "Data Management",
      items: [
        { 
          icon: FolderOpen, 
          label: "Manage Categories", 
          sublabel: `${categories.length} categories`,
          onClick: () => toast.info('Categories management coming soon!')
        },
        { 
          icon: Tag, 
          label: "Manage Projects", 
          sublabel: `${projects.length} projects`,
          onClick: () => toast.info('Projects management coming soon!')
        },
      ]
    },
    {
      section: "Export",
      items: [
        { 
          icon: Download, 
          label: "Export as CSV", 
          sublabel: `${transactions.length} transactions`,
          onClick: handleExportCSV
        },
        { 
          icon: FileText, 
          label: "Export as PDF", 
          sublabel: "Coming soon",
          onClick: handleExportPDF
        },
      ]
    },
    {
      section: "Developer",
      items: [
        { 
          icon: Database, 
          label: "Reload Demo Data", 
          sublabel: "Reset with sample data",
          onClick: handleLoadDemoData,
          highlight: true
        },
        { 
          icon: Trash2, 
          label: "Clear All Data", 
          sublabel: "Delete everything",
          onClick: handleClearData,
          danger: true
        },
      ]
    },
  ];
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="p-4 pt-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      {/* Profile Card */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
            <img 
              src={avatarImage} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">Swati Sharma</h2>
            <p className="text-sm text-muted-foreground">Guest Mode</p>
            <p className="text-xs text-primary mt-1">Data stored locally</p>
          </div>
          <button className="p-2 rounded-full hover:bg-muted">
            <User size={20} className="text-muted-foreground" />
          </button>
        </motion.div>
      </div>
      
      {/* Theme Toggle */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-card"
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
            className="bg-card rounded-2xl shadow-card overflow-hidden"
          >
            {section.items.map((item, index) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${
                  index !== section.items.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  item.danger 
                    ? 'bg-destructive-light' 
                    : item.highlight 
                      ? 'bg-primary-light' 
                      : 'bg-muted'
                }`}>
                  <item.icon 
                    size={20} 
                    className={
                      item.danger 
                        ? 'text-destructive' 
                        : item.highlight 
                          ? 'text-primary' 
                          : 'text-muted-foreground'
                    } 
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-medium ${item.danger ? 'text-destructive' : ''}`}>
                    {item.label}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.sublabel}</p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
            ))}
          </motion.div>
        </div>
      ))}
      
      {/* App Info */}
      <div className="px-4 text-center">
        <p className="text-xs text-muted-foreground">
          FinTrack Pro v1.0.0
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Built with ❤️ for financial clarity
        </p>
      </div>
    </div>
  );
};
