import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, User, Lock, Eye, EyeOff } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import avatarImage from "@/assets/avatar-swati.jpg";

interface ProfileEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditSheet = ({ isOpen, onClose }: ProfileEditSheetProps) => {
  const { userProfile, updateUserProfile } = useFinanceStore();
  const [name, setName] = useState(userProfile.name);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const handleSave = () => {
    if (name.trim() !== userProfile.name) {
      updateUserProfile({ name: name.trim() });
    }
    onClose();
  };
  
  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    // In a real app, this would call an API
    toast.success("Password changed successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordSection(false);
  };
  
  const handleClose = () => {
    setName(userProfile.name);
    setShowPasswordSection(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
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
            onClick={handleClose}
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 bg-muted rounded-full" />
            </div>
            
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-muted">
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
              
              {/* Change Password Section */}
              <div className="border-t border-border pt-4">
                <button
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="flex items-center gap-2 text-primary font-medium"
                >
                  <Lock size={16} />
                  {showPasswordSection ? "Cancel Password Change" : "Change Password"}
                </button>
                
                <AnimatePresence>
                  {showPasswordSection && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 mt-4">
                        {/* Current Password */}
                        <div>
                          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Current Password</Label>
                          <div className="relative mt-1">
                            <Input
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="Enter current password"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            >
                              {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        
                        {/* New Password */}
                        <div>
                          <Label className="text-xs text-muted-foreground uppercase tracking-wide">New Password</Label>
                          <div className="relative mt-1">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            >
                              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        
                        {/* Confirm Password */}
                        <div>
                          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Confirm New Password</Label>
                          <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="mt-1"
                          />
                        </div>
                        
                        <Button
                          onClick={handleChangePassword}
                          variant="outline"
                          className="w-full"
                        >
                          <Lock size={14} className="mr-2" />
                          Update Password
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
