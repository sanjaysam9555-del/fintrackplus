import { useState, useEffect } from "react";
import { ArrowLeft, Plus, RotateCcw, Loader2, Database, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

interface BackupSnapshot {
  transactions?: unknown[];
  categories?: unknown[];
  vendors?: unknown[];
  projects?: unknown[];
  partners?: unknown[];
  project_labels?: unknown[];
}

interface BackupRow {
  id: string;
  label: string;
  snapshot: BackupSnapshot;
  created_at: string;
}

interface BackupRestoreSectionProps {
  onBack: () => void;
}

export const BackupRestoreSection = ({ onBack }: BackupRestoreSectionProps) => {
  const { user } = useAuth();
  const { orgId } = useUserRole();
  const [backups, setBackups] = useState<BackupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackupRow | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    const { data, error } = await supabase.
    from("backups").
    select("id, label, snapshot, created_at").
    order("created_at", { ascending: false }).
    limit(50);

    if (!error && data) {
      setBackups(data as BackupRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    if (!orgId || !user) return;
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-backup", {
        body: { org_id: orgId, created_by: user.id }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Backup created successfully");
      fetchBackups();
    } catch (err: unknown) {
      toast.error((err instanceof Error && err.message) || "Failed to create backup");
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    setRestoringId(backupId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("restore-backup", {
        body: { backup_id: backupId }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Backup restored! Refreshing data...");
      // Force page reload to re-sync all data
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: unknown) {
      toast.error((err instanceof Error && err.message) || "Failed to restore backup");
      setRestoringId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("backups").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Failed to delete backup");
    } else {
      toast.success("Backup deleted");
      setBackups((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  const getSnapshotCounts = (snapshot: BackupSnapshot | null | undefined) => {
    if (!snapshot || typeof snapshot !== "object") return "";
    const parts: string[] = [];
    if (snapshot.transactions?.length) parts.push(`${snapshot.transactions.length} transactions`);
    if (snapshot.categories?.length) parts.push(`${snapshot.categories.length} categories`);
    if (snapshot.vendors?.length) parts.push(`${snapshot.vendors.length} vendors`);
    if (snapshot.projects?.length) parts.push(`${snapshot.projects.length} projects`);
    if (snapshot.partners?.length) parts.push(`${snapshot.partners.length} partners`);
    if (snapshot.project_labels?.length) parts.push(`${snapshot.project_labels.length} labels`);
    return parts.join(" · ") || "Empty snapshot";
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="p-4 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Backup & Restore</h1>
        </div>
        <p className="text-muted-foreground mt-1 ml-1 text-xs font-mono font-extralight mx-[2px] border-none">Your backups are stored forever like diamonds, but more useful 💎</p>
      </div>

      <div className="px-4 mt-2">
        <Button
          onClick={handleCreateBackup}
          disabled={creating}
          className="w-full gap-2"
          size="lg">
          
          {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {creating ? "Creating Backup..." : "Create Backup Now"}
        </Button>
      </div>

      <div className="px-4 mt-6 space-y-3">
        {loading ?
        <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div> :
        backups.length === 0 ?
        <div className="text-center py-12">
            <Database size={40} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No backups yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Create your first backup or wait for the automatic schedule.
            </p>
          </div> :

        backups.map((backup) =>
        <div
          key={backup.id}
          className="rounded-xl border bg-card p-4 space-y-2">
          
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{backup.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(backup.created_at), { addSuffix: true })}
                  </p>
                </div>
                <button
              onClick={() => setDeleteTarget(backup)}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
              
                  <Trash2 size={14} />
                </button>
              </div>

              <p className="text-xs text-muted-foreground/70">
                {getSnapshotCounts(backup.snapshot)}
              </p>

              <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 mt-1"
            disabled={restoringId === backup.id}
            onClick={() => {
              if (confirm("⚠️ This will replace ALL current data with this backup. This action cannot be undone. Continue?")) {
                handleRestore(backup.id);
              }
            }}>
            
                {restoringId === backup.id ?
            <Loader2 size={14} className="animate-spin" /> :

            <RotateCcw size={14} />
            }
                {restoringId === backup.id ? "Restoring..." : "Restore This Backup"}
              </Button>
            </div>
        )
        }
      </div>

      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Backup"
        description={`Delete "${deleteTarget?.label}"? This cannot be undone.`} />
      
    </div>);

};