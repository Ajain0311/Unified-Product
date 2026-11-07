import { create } from 'zustand';

interface AuthModalState {
  isOpen: boolean;
  title: string;
  subtitle: string;
  onSuccessCallback: (() => void) | null;
  openAuthModal: (options?: { title?: string; subtitle?: string; onSuccess?: () => void }) => void;
  closeAuthModal: () => void;
}

const DEFAULT_TITLE = 'Sign In to Continue';
const DEFAULT_SUBTITLE = 'Verify your phone number to place your order seamlessly';

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  title: DEFAULT_TITLE,
  subtitle: DEFAULT_SUBTITLE,
  onSuccessCallback: null,
  openAuthModal: (options) => {
    set((state) => ({
      isOpen: true,
      title: options?.title ?? (state.isOpen ? state.title : DEFAULT_TITLE),
      subtitle: options?.subtitle ?? (state.isOpen ? state.subtitle : DEFAULT_SUBTITLE),
      onSuccessCallback: options?.onSuccess ?? (state.isOpen ? state.onSuccessCallback : null),
    }));
  },
  closeAuthModal: () => {
    set({
      isOpen: false,
      onSuccessCallback: null,
    });
  },
}));
