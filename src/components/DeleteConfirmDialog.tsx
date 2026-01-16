import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Archive, ArchiveRestore } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  variant?: 'delete' | 'archive' | 'restore';
}

export const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Transaction",
  description = "Are you sure you want to delete this transaction? This action cannot be undone.",
  confirmText,
  variant = 'delete',
}: DeleteConfirmDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getIcon = () => {
    switch (variant) {
      case 'archive': return Archive;
      case 'restore': return ArchiveRestore;
      default: return Trash2;
    }
  };

  const getIconBgColor = () => {
    switch (variant) {
      case 'archive': return 'bg-yellow-500/10';
      case 'restore': return 'bg-green-500/10';
      default: return 'bg-destructive/10';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'archive': return 'text-yellow-600';
      case 'restore': return 'text-green-600';
      default: return 'text-destructive';
    }
  };

  const getButtonStyle = () => {
    switch (variant) {
      case 'archive': return 'bg-yellow-600 hover:bg-yellow-700';
      case 'restore': return 'bg-green-600 hover:bg-green-700';
      default: return 'bg-destructive hover:bg-destructive/90';
    }
  };

  const getDefaultConfirmText = () => {
    switch (variant) {
      case 'archive': return 'Archive';
      case 'restore': return 'Restore';
      default: return 'Delete';
    }
  };

  const Icon = getIcon();
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader>
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2", getIconBgColor())}>
            <Icon className={getIconColor()} size={24} />
          </div>
          <AlertDialogTitle className="text-center">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
          <AlertDialogCancel className="flex-1 mt-0">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={cn("flex-1", getButtonStyle())}
          >
            {confirmText || getDefaultConfirmText()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
