import { useState, useRef } from "react";
import { Camera, X, Image as ImageIcon, Loader2, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReceiptUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  userId?: string;
  transactionId?: string;
}

// Compress image before upload
const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to compress image'));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export const ReceiptUpload = ({ value, onChange, userId, transactionId }: ReceiptUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Max 10MB allowed.');
      return;
    }

    setIsUploading(true);
    
    try {
      // Compress the image
      const compressedBlob = await compressImage(file);
      
      // Generate unique filename
      const fileExt = 'jpg';
      const fileName = `${userId}/${transactionId || Date.now()}.${fileExt}`;
      
      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Store raw storage path in DB, use local blob for preview
      const localPreview = URL.createObjectURL(compressedBlob);
      setPreviewUrl(localPreview);
      onChange(fileName);
      toast.success('Receipt uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload receipt');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value || !userId) {
      setPreviewUrl(undefined);
      onChange(undefined);
      return;
    }

    try {
      // Extract the file path from the URL
      const urlParts = value.split('/receipts/');
      if (urlParts[1]) {
        const filePath = urlParts[1].split('?')[0]; // Remove query params
        await supabase.storage.from('receipts').remove([filePath]);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }

    setPreviewUrl(undefined);
    onChange(undefined);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {previewUrl ? (
        // Preview state
        <div className="relative bg-muted rounded-xl p-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-background flex-shrink-0">
            <img 
              src={previewUrl} 
              alt="Receipt" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Receipt attached</p>
            <p className="text-xs text-muted-foreground">Tap to view</p>
          </div>
          <button
            onClick={handleRemove}
            className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition-colors"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        // Empty state
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "w-full p-4 bg-muted rounded-xl border-2 border-dashed border-border",
            "flex items-center justify-center gap-3 transition-colors",
            "hover:border-primary/50 hover:bg-muted/80",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
          type="button"
        >
          {isUploading ? (
            <>
              <Loader2 size={20} className="animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Paperclip size={18} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Attach Receipt</p>
                <p className="text-xs text-muted-foreground">Tap to take photo or upload</p>
              </div>
            </>
          )}
        </button>
      )}
    </div>
  );
};
