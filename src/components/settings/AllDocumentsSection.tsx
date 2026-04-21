import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileText, FileImage, File, FileSpreadsheet, Download, FolderOpen, Share2, X, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFinanceStore } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface AllDocumentsSectionProps {
  onBack: () => void;
}

interface DocItem {
  id: string;
  fileName: string;
  fileUrl: string;
  storagePath: string | null;
  bucket: string;
  fileType: string;
  fileSize: number;
  date: string;
  projectId: string | null;
  source: 'document' | 'receipt';
}

const extractStoragePath = (url: string, bucket: string): string | null => {
  try {
    if (!url.startsWith('http')) return url;
    const signedMatch = url.match(new RegExp(`/object/sign/${bucket}/(.+?)\\?`));
    if (signedMatch) return decodeURIComponent(signedMatch[1]);
    const publicMatch = url.match(new RegExp(`/object/public/${bucket}/(.+?)($|\\?)`));
    if (publicMatch) return decodeURIComponent(publicMatch[1]);
    const storageMatch = url.match(new RegExp(`/storage/v1/object/(?:sign|public|authenticated)/${bucket}/(.+?)(?:\\?|$)`));
    if (storageMatch) return decodeURIComponent(storageMatch[1]);
    return null;
  } catch {
    return null;
  }
};

// Normalize a file extension to a standard MIME type
const extToMime = (ext: string): string => {
  const e = ext.toLowerCase().replace(/^\./, '').split('?')[0];
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    heic: 'image/heic',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    csv: 'text/csv',
    txt: 'text/plain',
  };
  return map[e] || 'application/octet-stream';
};

const isImageType = (typeOrName: string) => {
  const t = (typeOrName || '').toLowerCase();
  return t.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp|svg|heic)(\?|$)/i.test(t) || /^(jpg|jpeg|png|webp|gif|bmp|svg|heic)$/i.test(t);
};

const isPdfType = (typeOrName: string) => {
  const t = (typeOrName || '').toLowerCase();
  return t.includes('pdf') || /\.pdf(\?|$)/i.test(t);
};

const isOfficeType = (typeOrName: string) => {
  const t = (typeOrName || '').toLowerCase();
  return /(msword|wordprocessingml|ms-excel|spreadsheetml|ms-powerpoint|presentationml)/.test(t)
    || /\.(docx?|xlsx?|pptx?)(\?|$)/i.test(t)
    || /^(docx?|xlsx?|pptx?)$/i.test(t);
};

const getFileIcon = (typeOrName: string) => {
  if (isImageType(typeOrName)) return FileImage;
  if (isPdfType(typeOrName)) return FileText;
  if (typeOrName.includes('sheet') || typeOrName.includes('csv') || typeOrName.includes('excel') || /\.(xlsx?|csv)(\?|$)/i.test(typeOrName)) return FileSpreadsheet;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const AllDocumentsSection = ({ onBack }: AllDocumentsSectionProps) => {
  const { user } = useAuth();
  const { projects } = useFinanceStore();
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [thumbErrors, setThumbErrors] = useState<Record<string, boolean>>({});

  // Preview state
  const [previewDoc, setPreviewDoc] = useState<DocItem | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null); // blob: URL for img/download
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      const [{ data: projDocs }, { data: receiptTxns }] = await Promise.all([
        supabase.from('project_documents').select('*').order('uploaded_at', { ascending: false }),
        supabase.from('transactions').select('id, receipt_url, date, project_id, vendor, title').not('receipt_url', 'is', null).order('date', { ascending: false }),
      ]);

      const items: DocItem[] = [];

      for (const d of (projDocs || [])) {
        const bucket = 'project-documents';
        const path = extractStoragePath(d.file_url, bucket);
        let displayUrl = d.file_url;
        if (path) {
          const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
          if (signedData?.signedUrl) displayUrl = signedData.signedUrl;
        }
        // Normalize file_type if it's just an extension or unreliable
        const normalizedType = d.file_type && d.file_type.includes('/')
          ? d.file_type
          : extToMime(d.file_type || d.file_name.split('.').pop() || '');
        items.push({
          id: d.id, fileName: d.file_name, fileUrl: displayUrl, storagePath: path, bucket,
          fileType: normalizedType, fileSize: d.file_size, date: d.uploaded_at, projectId: d.project_id, source: 'document',
        });
      }

      for (const t of (receiptTxns || [])) {
        const url = t.receipt_url as string;
        const name = t.title || t.vendor || 'Receipt';
        const ext = (url.split('.').pop()?.split('?')[0] || '').toLowerCase();
        const mimeGuess = extToMime(ext);
        const bucket = 'receipts';
        const path = extractStoragePath(url, bucket);
        let displayUrl = url;
        if (path) {
          const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
          if (signedData?.signedUrl) displayUrl = signedData.signedUrl;
        }
        items.push({
          id: `receipt-${t.id}`, fileName: `${name}.${ext || 'file'}`, fileUrl: displayUrl, storagePath: path, bucket,
          fileType: mimeGuess, fileSize: 0, date: t.date, projectId: t.project_id, source: 'receipt',
        });
      }

      setDocs(items);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const projectMap = useMemo(() => {
    const map: Record<string, { name: string; color: string }> = {};
    projects.forEach(p => { map[p.id] = { name: p.name, color: p.color }; });
    return map;
  }, [projects]);

  const grouped = useMemo(() => {
    const groups: Record<string, DocItem[]> = {};
    const unassigned: DocItem[] = [];
    docs.forEach(d => {
      if (d.projectId && projectMap[d.projectId]) {
        if (!groups[d.projectId]) groups[d.projectId] = [];
        groups[d.projectId].push(d);
      } else {
        unassigned.push(d);
      }
    });
    return { groups, unassigned };
  }, [docs, projectMap]);

  // Clean up object URLs when preview changes/unmounts
  useEffect(() => {
    return () => {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    };
  }, [previewObjectUrl]);

  const handleOpenPreview = useCallback(async (item: DocItem) => {
    setPreviewDoc(item);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewObjectUrl(null);
    setPreviewBlob(null);

    try {
      let downloaded = false;
      if (item.storagePath) {
        const { data, error } = await supabase.storage
          .from(item.bucket)
          .download(item.storagePath);
        if (error) {
          console.warn('[AllDocuments] Download failed, will fall back to signed URL:', error.message, { bucket: item.bucket, path: item.storagePath });
        } else if (data) {
          const objectUrl = URL.createObjectURL(data);
          setPreviewObjectUrl(objectUrl);
          setPreviewBlob(data);
          downloaded = true;
        }
      } else {
        console.warn('[AllDocuments] No storagePath resolved for item; will use fileUrl directly:', { id: item.id, fileUrl: item.fileUrl });
      }
      // If blob download failed/skipped but we have an http signed URL, that's still usable for <img>/<iframe>
      if (!downloaded && !item.fileUrl?.startsWith('http')) {
        // Last-resort: try to mint a signed URL from the raw path
        const rawPath = item.storagePath || item.fileUrl;
        if (rawPath) {
          const { data: signed } = await supabase.storage.from(item.bucket).createSignedUrl(rawPath, 3600);
          if (signed?.signedUrl) {
            // Mutate previewDoc fileUrl so render branches see http URL
            setPreviewDoc(prev => prev ? { ...prev, fileUrl: signed.signedUrl } : prev);
          } else {
            throw new Error('Could not generate access URL for this file.');
          }
        } else {
          throw new Error('No file location available.');
        }
      }
      setPreviewLoading(false);
    } catch (err: any) {
      console.error('Failed to load document:', err);
      setPreviewError("Could not load document. The file may have been moved or deleted.");
      setPreviewLoading(false);
    }
  }, []);

  const handleClosePreview = useCallback(() => {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    setPreviewDoc(null);
    setPreviewObjectUrl(null);
    setPreviewBlob(null);
    setPreviewError(null);
  }, [previewObjectUrl]);

  const handleDownload = useCallback(() => {
    if (!previewDoc) return;
    const href = previewObjectUrl || previewDoc.fileUrl;
    if (!href) return;
    const a = document.createElement('a');
    a.href = href;
    a.download = previewDoc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download started");
  }, [previewObjectUrl, previewDoc]);

  const handleOpenExternal = useCallback(() => {
    if (!previewDoc?.fileUrl) return;
    window.open(previewDoc.fileUrl, '_blank', 'noopener,noreferrer');
  }, [previewDoc]);

  const handleShare = useCallback(async () => {
    if (!previewDoc) return;
    try {
      if (navigator.share && previewBlob) {
        const file = new window.File([previewBlob], previewDoc.fileName, { type: previewBlob.type || previewDoc.fileType });
        await navigator.share({ files: [file], title: previewDoc.fileName });
      } else if (navigator.share) {
        await navigator.share({ title: previewDoc.fileName, text: `Sharing: ${previewDoc.fileName}` });
      } else {
        handleDownload();
        toast.info("Share not supported on this device — downloaded instead");
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error("Could not share document");
      }
    }
  }, [previewDoc, previewBlob, handleDownload]);

  const ThumbnailCard = ({ item }: { item: DocItem }) => {
    const Icon = getFileIcon(item.fileType || item.fileName);
    const isImg = isImageType(item.fileType) || isImageType(item.fileName);
    const errored = thumbErrors[item.id];

    return (
      <button
        onClick={() => handleOpenPreview(item)}
        className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors text-left w-full"
      >
        <div className="aspect-square flex items-center justify-center bg-muted/50 overflow-hidden relative">
          {isImg && !errored ? (
            <img
              src={item.fileUrl}
              alt={item.fileName}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setThumbErrors(prev => ({ ...prev, [item.id]: true }))}
            />
          ) : (
            <Icon size={32} className="text-muted-foreground" />
          )}
        </div>
        <div className="p-2">
          <p className="text-xs font-medium truncate">{item.fileName}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">
              {item.date ? format(new Date(item.date), 'dd MMM yy') : ''}
            </span>
            {item.fileSize > 0 && (
              <span className="text-[10px] text-muted-foreground">{formatFileSize(item.fileSize)}</span>
            )}
          </div>
          <span className={cn(
            "text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full mt-1 inline-block",
            item.source === 'receipt' ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
          )}>
            {item.source === 'receipt' ? 'Receipt' : 'Doc'}
          </span>
        </div>
      </button>
    );
  };

  const ProjectGroup = ({ projectId, items }: { projectId: string; items: DocItem[] }) => {
    const proj = projectMap[projectId];
    return (
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center gap-2 w-full py-3 px-1 group">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: proj?.color || '#8B5CF6' }} />
          <span className="font-semibold text-sm flex-1 text-left">{proj?.name || 'Unknown Project'}</span>
          <span className="text-xs text-muted-foreground mr-1">{items.length}</span>
          <ChevronDown size={16} className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pb-4">
            {items.map(item => <ThumbnailCard key={item.id} item={item} />)}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // Decide preview mode
  const previewMode: 'image' | 'pdf' | 'office' | 'other' | null = previewDoc
    ? (isImageType(previewDoc.fileType) || isImageType(previewDoc.fileName))
      ? 'image'
      : (isPdfType(previewDoc.fileType) || isPdfType(previewDoc.fileName))
        ? 'pdf'
        : (isOfficeType(previewDoc.fileType) || isOfficeType(previewDoc.fileName))
          ? 'office'
          : 'other'
    : null;

  const officeViewerUrl = previewDoc && previewMode === 'office' && previewDoc.fileUrl?.startsWith('http')
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewDoc.fileUrl)}`
    : null;

  // Use signed URL (http) for PDF iframe; blob fallback if no http URL
  const pdfSrc = previewDoc && previewMode === 'pdf'
    ? (previewDoc.fileUrl?.startsWith('http')
        ? `${previewDoc.fileUrl}#view=FitH&toolbar=1`
        : previewObjectUrl)
    : null;

  return (
    <div className="min-h-screen pb-24">
      <div className="p-4 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold flex-1">All Documents</h1>
        </div>

        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-sm text-muted-foreground">{docs.length} document{docs.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{showAll ? 'Grid' : 'Grouped'}</span>
            <Switch checked={showAll} onCheckedChange={setShowAll} />
          </div>
        </div>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <FolderOpen size={24} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No documents yet</p>
            <p className="text-sm text-muted-foreground mt-1">Upload receipts or project documents to see them here</p>
          </div>
        ) : showAll ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3"
          >
            {docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
              <ThumbnailCard key={item.id} item={item} />
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {Object.entries(grouped.groups).map(([pid, items]) => (
              <ProjectGroup key={pid} projectId={pid} items={items} />
            ))}
            {grouped.unassigned.length > 0 && (
              <div>
                <div className="flex items-center gap-2 py-3 px-1">
                  <div className="w-3 h-3 rounded-full shrink-0 bg-muted-foreground/30" />
                  <span className="font-semibold text-sm flex-1">Unassigned</span>
                  <span className="text-xs text-muted-foreground">{grouped.unassigned.length}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pb-4">
                  {grouped.unassigned.map(item => <ThumbnailCard key={item.id} item={item} />)}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* In-app preview overlay */}
      <AnimatePresence>
        {previewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border safe-top shrink-0">
              <button onClick={handleClosePreview} className="p-2 -ml-2 rounded-full hover:bg-muted">
                <X size={20} />
              </button>
              <h2 className="text-sm font-medium truncate flex-1 mx-3 text-center">{previewDoc.fileName}</h2>
              <div className="flex items-center gap-1">
                <button onClick={handleOpenExternal} className="p-2 rounded-full hover:bg-muted" title="Open in new tab">
                  <ExternalLink size={18} />
                </button>
                <button onClick={handleShare} className="p-2 rounded-full hover:bg-muted" title="Share">
                  <Share2 size={18} />
                </button>
                <button onClick={handleDownload} className="p-2 rounded-full hover:bg-muted" title="Download">
                  <Download size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 flex flex-col bg-muted/30">
              {previewLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading document…</p>
                </div>
              ) : previewError ? (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center max-w-xs">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                      <File size={24} className="text-destructive" />
                    </div>
                    <p className="text-sm text-muted-foreground">{previewError}</p>
                  </div>
                </div>
              ) : previewMode === 'image' && (previewObjectUrl || previewDoc.fileUrl?.startsWith('http')) ? (
                <div className="flex-1 min-h-0 flex items-center justify-center p-4 overflow-auto">
                  <img
                    src={previewObjectUrl || previewDoc.fileUrl}
                    alt={previewDoc.fileName}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onError={() => setPreviewError("Could not display this image. Try downloading it.")}
                  />
                </div>
              ) : previewMode === 'pdf' && pdfSrc ? (
                <div className="flex-1 min-h-0 w-full">
                  <object
                    data={pdfSrc}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    className="w-full h-full"
                  >
                    <iframe
                      src={pdfSrc}
                      title={previewDoc.fileName}
                      className="w-full h-full border-0"
                    />
                  </object>
                </div>
              ) : previewMode === 'office' && officeViewerUrl ? (
                <div className="flex-1 min-h-0 w-full bg-background">
                  <iframe
                    src={officeViewerUrl}
                    title={previewDoc.fileName}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center max-w-xs">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                      {(() => { const Icon = getFileIcon(previewDoc.fileType || previewDoc.fileName); return <Icon size={32} className="text-muted-foreground" />; })()}
                    </div>
                    <p className="font-medium text-sm mb-1">{previewDoc.fileName}</p>
                    <p className="text-xs text-muted-foreground mb-4">This file type cannot be previewed in-app</p>
                    <div className="flex flex-col gap-2 items-center">
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                      >
                        <Download size={16} /> Download
                      </button>
                      {previewDoc.fileUrl?.startsWith('http') && (
                        <button
                          onClick={handleOpenExternal}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted"
                        >
                          <ExternalLink size={16} /> Open in new tab
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground shrink-0">
              <span>{previewDoc.date ? format(new Date(previewDoc.date), 'dd MMM yyyy') : ''}</span>
              <span className={cn(
                "font-semibold uppercase px-1.5 py-0.5 rounded-full",
                previewDoc.source === 'receipt' ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
              )}>
                {previewDoc.source === 'receipt' ? 'Receipt' : 'Document'}
              </span>
              {previewDoc.fileSize > 0 && <span>{formatFileSize(previewDoc.fileSize)}</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
