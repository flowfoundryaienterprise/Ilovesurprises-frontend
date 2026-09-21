import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  KeyRound,
  X,
} from 'lucide-react';
import { authService } from '../services/auth';
import type { UserProfile } from '../types';

interface AdminLoginProps {
  onSuccess: (adminUser: UserProfile) => void;
  onNavigateToHome: () => void;
  onShowToast?: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onSuccess,
  onNavigateToHome,
  onShowToast,
}) => {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your administrator email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your secure administrator password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.adminLogin({
        identifier: cleanEmail,
        password,
        rememberMe,
      });

      if (!response.success || !response.user) {
        setErrorMessage(
          response.error || 'Authentication failed. Please verify your credentials and try again.'
        );
        setIsLoading(false);
        return;
      }

      if (!response.isAdmin) {
        setErrorMessage('Access denied. This account does not possess administrator privileges.');
        setIsLoading(false);
        return;
      }

      if (onShowToast) {
        onShowToast(`Welcome back, ${response.user.name || 'Administrator'}!`, {
          title: 'Admin Suite Authorized',
          type: 'success',
        });
      }

      onSuccess(response.user);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'An unexpected connection error occurred. Please try again.'
      );
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotFeedback(null);

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setForgotFeedback({
        type: 'error',
        message: 'Please enter your registered administrator email address.',
      });
      return;
    }

    setIsForgotLoading(true);
    try {
      const result = await authService.adminForgotPassword(cleanEmail);
      if (result.success) {
        setForgotFeedback({
          type: 'success',
          message:
            result.message ||
            `A password reset link has been dispatched to ${cleanEmail}. Please check your inbox.`,
        });
      } else {
        setForgotFeedback({
          type: 'error',
          message: result.error || 'Unable to process password reset request. Please try again.',
        });
      }
    } catch (err: any) {
      setForgotFeedback({
        type: 'error',
        message: err?.message || 'A network error occurred. Please try again.',
      });
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0a11] relative overflow-hidden flex flex-col items-center justify-center px-4 py-12 text-[#fbf8fa] select-none">
      {/* Dynamic Background Glows matching signature I Love Surprises palette */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#D30915]/15 blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-[#e11d48]/10 blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[160px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Navigation / Storefront Return */}
      <header className="w-full max-w-md mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateToHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#a69fad] hover:text-white transition-colors cursor-pointer group"
          id="admin-login-back-to-store"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Return to Storefront</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-[#e11d48]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D30915]" />
          <span>Restricted Portal</span>
        </div>
      </header>

      {/* Main Admin Authentication Card */}
      <main className="w-full max-w-md bg-[#16121d]/90 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.65)] p-6 sm:p-8 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-3 bg-white px-5 py-2 rounded-2xl shadow-[0_4px_24px_rgba(211,9,21,0.25)] border border-white/40">
            <img
              src="/assets/ilovesurprises/logo/logo-16k.png"
              alt="I Love Surprises"
              width={220}
              height={70}
              className="h-8 sm:h-9 w-auto object-contain"
              style={{
                imageRendering: '-webkit-optimize-contrast',
              }}
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D30915]/15 border border-[#D30915]/30 text-[#ff4b55] text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Administrator Suite</span>
          </div>

          <p className="text-xs text-[#9c93a4] max-w-xs font-medium">
            Sign in with authorized executive credentials to manage commerce, inventory, and operations.
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div
            id="admin-login-error"
            className="mb-6 p-3.5 rounded-xl bg-[#e11d48]/15 border border-[#e11d48]/35 text-[#fecdd3] flex items-start gap-3 text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-[#f43f5e] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-white">Authentication Failed</p>
              <p className="text-[#fecdd3]/90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email Address */}
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-bold text-[#d4cfd8] uppercase tracking-wider mb-1.5"
            >
              Administrator Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7d7386]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ilovesurprises.admin@gmail.com"
                disabled={isLoading}
                required
                className="w-full pl-10 pr-4 py-3 bg-[#1e1927] border border-white/10 rounded-xl text-sm text-white placeholder-[#685e72] focus:outline-none focus:border-[#D30915] focus:ring-1 focus:ring-[#D30915] transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold text-[#d4cfd8] uppercase tracking-wider"
              >
                Secure Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotFeedback(null);
                  setIsForgotModalOpen(true);
                }}
                className="text-xs font-semibold text-[#e11d48] hover:text-[#ff4b55] transition-colors cursor-pointer"
                id="admin-forgot-password-trigger"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7d7386]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLoading}
                required
                className="w-full pl-10 pr-11 py-3 bg-[#1e1927] border border-white/10 rounded-xl text-sm text-white placeholder-[#685e72] focus:outline-none focus:border-[#D30915] focus:ring-1 focus:ring-[#D30915] transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7d7386] hover:text-white transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Session Persistence / Remember Option */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#a69fad]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-[#1e1927] text-[#D30915] focus:ring-[#D30915] focus:ring-offset-0 cursor-pointer accent-[#D30915]"
              />
              <span>Remember this workstation</span>
            </label>
          </div>

          {/* Submit Sign In Button */}
          <div className="pt-2">
            <button
              id="admin-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D30915] via-[#e11d48] to-[#D30915] hover:from-[#b80712] hover:to-[#b80712] text-white font-extrabold text-sm uppercase tracking-wider shadow-[0_10px_25px_rgba(211,9,21,0.35)] hover:shadow-[0_12px_30px_rgba(211,9,21,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Sign In to Admin Suite</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security & Audit Notice */}
        <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-[#6d6376] font-medium text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D30915]" />
          <span>256-Bit SSL Encrypted Admin Console</span>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-[#16121d] border border-white/10 rounded-2xl shadow-2xl p-6 relative z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#D30915]/15 text-[#D30915] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 id="forgot-password-title" className="text-sm font-black text-white uppercase tracking-wider">
                  Admin Password Recovery
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-lg text-[#7d7386] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#9c93a4] mb-4 font-medium">
              Enter your registered administrator email address. We will transmit a secure, single-use password recovery link.
            </p>

            {forgotFeedback && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs flex items-start gap-2.5 ${
                  forgotFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-200'
                }`}
              >
                {forgotFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{forgotFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="forgot-admin-email"
                  className="block text-xs font-bold text-[#d4cfd8] uppercase tracking-wider mb-1.5"
                >
                  Admin Email
                </label>
                <input
                  id="forgot-admin-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="ilovesurprises.admin@gmail.com"
                  disabled={isForgotLoading}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#1e1927] border border-white/10 rounded-xl text-sm text-white placeholder-[#685e72] focus:outline-none focus:border-[#D30915] transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#9c93a4] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="px-5 py-2 rounded-xl bg-[#D30915] hover:bg-[#b80712] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isForgotLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminLogin;
