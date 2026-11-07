import React from 'react';
import { AuthOtpModal } from './AuthOtpModal';
import { useAuthModalStore } from '../../store/authModalStore';

export const GlobalAuthModal: React.FC = () => {
  const { isOpen, title, subtitle, closeAuthModal } = useAuthModalStore();

  if (!isOpen) return null;

  const handleSuccess = () => {
    const callback = useAuthModalStore.getState().onSuccessCallback;
    closeAuthModal();
    callback?.();
  };

  return (
    <AuthOtpModal
      visible={isOpen}
      title={title}
      subtitle={subtitle}
      onClose={closeAuthModal}
      onSuccess={handleSuccess}
    />
  );
};
