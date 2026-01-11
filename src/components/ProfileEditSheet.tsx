import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, User } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import avatarImage from "@/assets/avatar-swati.jpg";

interface ProfileEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditSheet = ({ isOpen, onClose }: ProfileEditSheetProps) => {
  const { userProfile, updateUserProfile } = useFinanceStore();
  const [name, setName] = useState(userProfile.name);
  
  const handleSave = () => {
    updateUserProfile({ name });
    onClose();
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl"
          >
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 bg-muted rounded-full" />
            </div>
            
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary">
                    <img 
                      src={userProfile.avatar || avatarImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg">
                    <Camera size={14} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Tap to change photo</p>
              </div>
              
              {/* Name */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>
              
              {/* Email (Read-only) */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
                <div className="mt-1 p-3 bg-muted rounded-xl flex items-center gap-2">
                  <User size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">swati.sharma@email.com</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
              
              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={!name.trim()}
                className="w-full py-5 text-base font-semibold gradient-primary text-primary-foreground rounded-xl"
              >
                Save Changes
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
