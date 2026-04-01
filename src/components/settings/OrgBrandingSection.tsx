import { useState, useRef } from "react";
import { ArrowLeft, Building2, Upload, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useFinanceStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface OrgBrandingSectionProps {
  onBack: () => void;
}

export const OrgBrandingSection = ({ onBack }: OrgBrandingSectionProps) => {
  const { orgName, orgLogoUrl, setOrgBranding } = useFinanceStore();
  const { user } = useAuth();
  const [name, setName] = useState(orgName || '');
  const [logoUrl, setLogoUrl] = useState(orgLogoUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/logo.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('org-logos')
        .upload(path, file, { upsert: true });
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('org-logos')
        .getPublicUrl(path);

      setLogoUrl(publicUrl + '?t=' + Date.now());
      toast.success('Logo uploaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: name.trim() || 'My Organization', logo_url: logoUrl || null })
        .eq('id', (await supabase.rpc('get_user_org_id', { _user_id: user.id })).data);

      if (error) throw error;

      setOrgBranding(name.trim() || 'My Organization', logoUrl || null);
      toast.success('Organisation branding updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save branding');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="p-4 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Organisation Branding</h1>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-card border border-border"
        >
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Logo</p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
              {logoUrl ? (
                <img src={logoUrl} alt="Org logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 size={32} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {isUploading ? 'Uploading...' : 'Upload Logo'}
              </Button>
              {logoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLogo}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 size={14} /> Remove
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PNG, JPG or SVG. Max 2MB.</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </motion.div>

        {/* Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl p-6 shadow-card border border-border"
        >
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Organisation Name</p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Saffron Events"
            className="rounded-xl"
          />
          <p className="text-xs text-muted-foreground mt-2">Shown on the desktop sidebar for quick identification.</p>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 shadow-card border border-border"
        >
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Preview</p>
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
            {logoUrl ? (
              <img src={logoUrl} alt="Preview" className="w-8 h-8 rounded-lg object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 size={16} className="text-primary" />
              </div>
            )}
            <span className="text-sm font-semibold truncate">{name || 'My Organization'}</span>
          </div>
        </motion.div>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-xl h-12 gradient-primary text-primary-foreground font-medium"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
          Save Changes
        </Button>
      </div>
    </div>
  );
};
