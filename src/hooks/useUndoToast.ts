import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UndoAction {
  id: string;
  type: 'transaction' | 'category' | 'vendor' | 'project';
  data: unknown;
  description: string;
}

/**
 * Hook for showing undo toasts after delete operations
 * Provides a 5-second window to undo the action
 */
export const useUndoToast = () => {
  const pendingUndos = useRef<Map<string, UndoAction>>(new Map());

  const showUndoToast = useCallback((
    action: Omit<UndoAction, 'id'>,
    onUndo: () => void
  ) => {
    const id = crypto.randomUUID();
    
    // Store the undo action
    pendingUndos.current.set(id, { ...action, id });
    
    // Show toast with undo button
    toast(action.description, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          onUndo();
          pendingUndos.current.delete(id);
          toast.dismiss(id);
          toast.success('Action undone');
        },
      },
      onDismiss: () => {
        pendingUndos.current.delete(id);
      },
      id,
    });
    
    return id;
  }, []);

  const cancelUndo = useCallback((id: string) => {
    pendingUndos.current.delete(id);
    toast.dismiss(id);
  }, []);

  return {
    showUndoToast,
    cancelUndo,
  };
};
