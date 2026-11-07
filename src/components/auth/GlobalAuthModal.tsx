import React from 'react';
import { AuthOtpModal } from './AuthOtpModal';
import { useAuthModalStore } from '../../store/authModalStore';

export const GlobalAuthModal: React.FC = () => {
  const { isOpen, title, subtitle, onSuccessCallback, closeAuthModal } = useAuthModalStore();

  if (!isOpen) return null;

  return (
    <AuthOtpModal
      visible={isOpen}
      title={title}
      subtitle={subtitle}
      onClose={closeAuthModal}
      onSuccess={() => {
        if (onSuccessCallback) {
          onSuccessCallback();
        }
      }}
    />
  );
};
