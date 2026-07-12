import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type ProjectDocumentRow = Database['public']['Tables']['project_documents']['Row'];

const PROJECT_DOCUMENTS_BUCKET = 'project-documents';

// file_url is normally stored as a raw storage path, but older rows may hold a full
// signed/public URL — extract the underlying path either way so we can mint a fresh signed URL.
const extractStoragePath = (value: string): string => {
  if (!value.startsWith('http')) return value;
  try {
    const signedMatch = value.match(new RegExp(`/object/sign/${PROJECT_DOCUMENTS_BUCKET}/(.+?)\\?`));
    if (signedMatch) return decodeURIComponent(signedMatch[1]);
    const publicMatch = value.match(new RegExp(`/object/public/${PROJECT_DOCUMENTS_BUCKET}/(.+?)($|\\?)`));
    if (publicMatch) return decodeURIComponent(publicMatch[1]);
    const storageMatch = value.match(new RegExp(`/storage/v1/object/(?:sign|public|authenticated)/${PROJECT_DOCUMENTS_BUCKET}/(.+?)(?:\\?|$)`));
    if (storageMatch) return decodeURIComponent(storageMatch[1]);
  } catch {
    // fall through to returning the raw value
  }
  return value;
};

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
      const resolved = await Promise.all((data || []).map(async (d: ProjectDocumentRow) => {
        const path = extractStoragePath(d.file_url);
        const { data: signedData } = await supabase.storage
          .from(PROJECT_DOCUMENTS_BUCKET)
          .createSignedUrl(path, 3600);
        return {
          id: d.id,
          projectId: d.project_id,
          fileName: d.file_name,
          fileUrl: signedData?.signedUrl || d.file_url,
          fileType: d.file_type,
          fileSize: d.file_size,
          uploadedAt: d.uploaded_at,
        };
      }));
      setDocuments(resolved);
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

      // Store the raw storage path — not a URL
      const fileUrl = filePath;

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
    } catch (err: unknown) {
      console.error('Upload failed:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error("Upload failed: " + message);
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
    } catch (err: unknown) {
      console.error('Delete failed:', err);
      toast.error("Failed to delete document");
    }
  }, [userId, documents]);

  return { documents, isLoading, isUploading, uploadDocument, deleteDocument, refetch: fetchDocuments };
};
