import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Building2 } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface OrgEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrgEditSheet = ({ isOpen, onClose }: OrgEditSheetProps) => {
  const { orgName, orgLogoUrl, setOrgInfo } = useFinanceStore();
  const { user } = useAuth();
  const { orgId } = useUserRole();
  const [name, setName] = useState(orgName);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !orgId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: name.trim() })
        .eq('id', orgId);
      if (error) throw error;
      setOrgInfo(name.trim(), orgLogoUrl);
      toast.success("Organization updated");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update organization");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!orgId || !user) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${orgId}/logo.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('org-logos')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('org-logos')
        .getPublicUrl(filePath);

      const logoUrl = `${publicUrl}?t=${Date.now()}`;
      
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: logoUrl })
        .eq('id', orgId);
      if (updateError) throw updateError;

      setOrgInfo(orgName, logoUrl);
      toast.success("Logo updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setName(orgName);
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
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-background overflow-y-auto"
          >
            <div className="sticky top-0 bg-background z-10 flex items-center gap-3 p-4 safe-top border-b border-border">
              <button onClick={handleClose} className="p-2 -ml-2 rounded-full hover:bg-muted">
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold">Edit Organization</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Logo */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
                    {orgLogoUrl ? (
                      <img src={orgLogoUrl} alt="Org Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={32} className="text-muted-foreground" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {isUploading ? "Uploading..." : "Tap to change logo"}
                </p>
              </div>

              {/* Name */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Organization Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter organization name"
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={!name.trim() || isSaving}
                className="w-full py-5 text-base font-semibold gradient-primary text-primary-foreground rounded-xl"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
