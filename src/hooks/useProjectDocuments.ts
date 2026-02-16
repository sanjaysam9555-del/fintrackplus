import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjectDocument {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export const useProjectDocuments = (projectId: string | undefined, userId: string | undefined) => {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!projectId || !userId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments((data || []).map((d: any) => ({
        id: d.id,
        projectId: d.project_id,
        fileName: d.file_name,
        fileUrl: d.file_url,
        fileType: d.file_type,
        fileSize: d.file_size,
        uploadedAt: d.uploaded_at,
      })));
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, userId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = useCallback(async (file: File) => {
    if (!projectId || !userId) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${projectId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get download URL
      const { data: urlData } = supabase.storage
        .from('project-documents')
        .getPublicUrl(filePath);

      // For private bucket, use signed URL
      const { data: signedData } = await supabase.storage
        .from('project-documents')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      const fileUrl = signedData?.signedUrl || urlData.publicUrl;

      const { data: docData, error: insertError } = await supabase
        .from('project_documents')
        .insert({
          user_id: userId,
          project_id: projectId,
          file_name: file.name,
          file_url: fileUrl,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (docData) {
        setDocuments(prev => [{
          id: docData.id,
          projectId: docData.project_id,
          fileName: docData.file_name,
          fileUrl: docData.file_url,
          fileType: docData.file_type,
          fileSize: docData.file_size,
          uploadedAt: docData.uploaded_at,
        }, ...prev]);
      }

      toast.success("Document uploaded");
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error("Upload failed: " + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  }, [projectId, userId]);

  const deleteDocument = useCallback(async (docId: string) => {
    if (!userId) return;
    try {
      const doc = documents.find(d => d.id === docId);
      
      // Delete from DB
      const { error } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', docId)
        .eq('user_id', userId);

      if (error) throw error;

      setDocuments(prev => prev.filter(d => d.id !== docId));
      toast.success("Document deleted");
    } catch (err: any) {
      console.error('Delete failed:', err);
      toast.error("Failed to delete document");
    }
  }, [userId, documents]);

  return { documents, isLoading, isUploading, uploadDocument, deleteDocument, refetch: fetchDocuments };
};
