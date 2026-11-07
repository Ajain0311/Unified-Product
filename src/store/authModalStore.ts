import { create } from 'zustand';

interface AuthModalState {
  isOpen: boolean;
  title: string;
  subtitle: string;
  onSuccessCallback: (() => void) | null;
  openAuthModal: (options?: { title?: string; subtitle?: string; onSuccess?: () => void }) => void;
  closeAuthModal: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set, get) => ({
  isOpen: false,
  title: 'Sign In to Continue',
  subtitle: 'Verify your phone number to place your order seamlessly',
  onSuccessCallback: null,
  openAuthModal: (options) => {
    set({
      isOpen: true,
      title: options?.title || 'Sign In to Continue',
      subtitle: options?.subtitle || 'Verify your phone number to place your order seamlessly',
      onSuccessCallback: options?.onSuccess || null,
    });
  },
  closeAuthModal: () => {
    set({
      isOpen: false,
      onSuccessCallback: null,
    });
  },
}));
