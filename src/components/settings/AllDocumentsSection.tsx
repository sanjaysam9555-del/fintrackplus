import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, FileImage, File, FileSpreadsheet, Eye, Download, FolderOpen, Grid3X3, List, Loader2 } from "lucide-react";
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
    // Match signed URL pattern: /object/sign/<bucket>/<path>?token=...
    const signedMatch = url.match(new RegExp(`/object/sign/${bucket}/(.+?)\\?`));
    if (signedMatch) return decodeURIComponent(signedMatch[1]);

    // Match public URL pattern: /object/public/<bucket>/<path>
    const publicMatch = url.match(new RegExp(`/object/public/${bucket}/(.+?)($|\\?)`));
    if (publicMatch) return decodeURIComponent(publicMatch[1]);

    // Match storage path pattern: /storage/v1/object/.../<bucket>/<path>
    const storageMatch = url.match(new RegExp(`/storage/v1/object/(?:sign|public|authenticated)/${bucket}/(.+?)(?:\\?|$)`));
    if (storageMatch) return decodeURIComponent(storageMatch[1]);

    return null;
  } catch {
    return null;
  }
};

const isImageType = (type: string) =>
  type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(type);

const getFileIcon = (type: string) => {
  if (isImageType(type)) return FileImage;
  if (type.includes('pdf')) return FileText;
  if (type.includes('sheet') || type.includes('csv') || type.includes('excel')) return FileSpreadsheet;
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

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      const [{ data: projDocs }, { data: receiptTxns }] = await Promise.all([
        supabase.from('project_documents').select('*').order('uploaded_at', { ascending: false }),
        supabase.from('transactions').select('id, receipt_url, date, project_id, vendor, title').not('receipt_url', 'is', null).order('date', { ascending: false }),
      ]);

      const items: DocItem[] = [];

      (projDocs || []).forEach((d: any) => {
        const bucket = 'project-documents';
        items.push({
          id: d.id,
          fileName: d.file_name,
          fileUrl: d.file_url,
          storagePath: extractStoragePath(d.file_url, bucket),
          bucket,
          fileType: d.file_type,
          fileSize: d.file_size,
          date: d.uploaded_at,
          projectId: d.project_id,
          source: 'document',
        });
      });

      (receiptTxns || []).forEach((t: any) => {
        const url = t.receipt_url as string;
        const name = t.title || t.vendor || 'Receipt';
        const ext = url.split('.').pop()?.split('?')[0] || '';
        const mimeGuess = isImageType(ext) ? `image/${ext}` : 'application/octet-stream';
        const bucket = 'receipts';
        items.push({
          id: `receipt-${t.id}`,
          fileName: `${name}.${ext || 'file'}`,
          fileUrl: url,
          storagePath: extractStoragePath(url, bucket),
          bucket,
          fileType: mimeGuess,
          fileSize: 0,
          date: t.date,
          projectId: t.project_id,
          source: 'receipt',
        });
      });

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

  const [openingId, setOpeningId] = useState<string | null>(null);

  const handleOpenDocument = useCallback(async (item: DocItem) => {
    if (openingId) return;
    setOpeningId(item.id);
    try {
      if (item.storagePath) {
        const { data, error } = await supabase.storage
          .from(item.bucket)
          .createSignedUrl(item.storagePath, 3600);
        if (error) throw error;
        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
          setOpeningId(null);
          return;
        }
      }
      // Fallback: open stored URL directly
      window.open(item.fileUrl, '_blank');
    } catch (err: any) {
      console.error('Failed to open document:', err);
      toast.error("Could not open document");
    } finally {
      setOpeningId(null);
    }
  }, [openingId]);

  const ThumbnailCard = ({ item }: { item: DocItem }) => {
    const Icon = getFileIcon(item.fileType);
    const isImg = isImageType(item.fileType);
    const isOpening = openingId === item.id;

    return (
      <button
        onClick={() => handleOpenDocument(item)}
        disabled={isOpening}
        className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors text-left w-full"
      >
        <div className="aspect-square flex items-center justify-center bg-muted/50 overflow-hidden relative">
          {isOpening && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          )}
          {isImg ? (
            <img src={item.fileUrl} alt={item.fileName} className="w-full h-full object-cover" loading="lazy" />
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

  return (
    <div className="min-h-screen pb-24">
      <div className="p-4 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold flex-1">All Documents</h1>
        </div>

        {/* Toggle */}
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
          /* Flat grid */
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
          /* Grouped view */
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
    </div>
  );
};
