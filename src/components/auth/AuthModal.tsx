import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import type { UserProfile } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup' | 'forgot' | 'reset';
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'reset'>(initialMode);
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);
  const [prefillEmail, setPrefillEmail] = useState('');

  if (initialMode !== prevInitialMode) {
    setPrevInitialMode(initialMode);
    setView(initialMode);
  }

  const handleTriggerClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 260);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleTriggerClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleTriggerClose]);

  if (typeof document === 'undefined' || (!isOpen && !isClosing)) return null;

  const handleAuthSuccess = (user: UserProfile) => {
    onSuccess(user);
    handleTriggerClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto p-3 sm:p-4 flex items-center justify-center min-h-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Smooth Backdrop */}
      <div
        className={`fixed inset-0 bg-[#141219]/60 backdrop-blur-xs transition-all ${
          isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
        }`}
        onClick={handleTriggerClose}
        aria-hidden="true"
      />

      {/* Auth Card Container */}
      <div
        className={`relative w-full max-w-[440px] rounded-[24px] sm:rounded-[28px] bg-white border border-[#eedbe6] p-5 sm:p-7 shadow-[0_20px_50px_rgba(50,31,63,0.22)] z-10 overflow-hidden isolate my-auto ${
          isClosing ? 'animate-modal-out' : 'animate-modal-in'
        }`}
      >
        {/* Soft Ambient Corner Glows */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#D30915]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#54217f]/8 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleTriggerClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-[#fff1f2] text-[#716d77] hover:text-[#D30915] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs z-20 focus:outline-none focus:ring-2 focus:ring-[#D30915]/30 active:scale-90"
          aria-label="Close authentication modal"
        >
          <X className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Dynamic View: Login, Sign Up, or Forgot Password */}
        <div className="transition-all duration-300 ease-out">
          {view === 'login' && (
            <LoginForm
              initialEmail={prefillEmail}
              onSuccess={handleAuthSuccess}
              onSwitchToSignUp={() => setView('signup')}
              onSwitchToForgotPassword={() => setView('forgot')}
            />
          )}

          {view === 'signup' && (
            <SignUpForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={(prefEmail) => {
                if (prefEmail) setPrefillEmail(prefEmail);
                setView('login');
              }}
            />
          )}

          {view === 'forgot' && (
            <ForgotPasswordForm
              onSwitchToLogin={() => setView('login')}
            />
          )}

          {view === 'reset' && (
            <ResetPasswordForm
              onSwitchToLogin={() => setView('login')}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
