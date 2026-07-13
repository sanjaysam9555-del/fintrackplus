import { create } from 'zustand';

interface SuccessAnimationState {
  message: string | null;
  show: (message: string) => void;
  clear: () => void;
}

/**
 * Global trigger for the celebratory checkmark overlay (see SuccessConfirmation).
 * Any component can call `useSuccessAnimationStore.getState().show(...)` directly —
 * no prop-drilling needed — since the overlay itself is mounted once at the app root.
 */
export const useSuccessAnimationStore = create<SuccessAnimationState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  clear: () => set({ message: null }),
}));
