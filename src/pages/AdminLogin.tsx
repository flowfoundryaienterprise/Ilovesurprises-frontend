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

    const clean = forgotEmail.trim();
    if (!clean) {
      setForgotFeedback({
        type: 'error',
        message: 'Please provide your registered administrator email.',
      });
      return;
    }

    setIsForgotLoading(true);

    try {
      const res = await authService.adminForgotPassword(clean);
      if (res.success) {
        setForgotFeedback({
          type: 'success',
          message: res.message || 'Recovery instructions have been transmitted to your email.',
        });
      } else {
        setForgotFeedback({
          type: 'error',
          message: res.error || 'Unable to dispatch recovery link at this time.',
        });
      }
    } catch (err: any) {
      setForgotFeedback({
        type: 'error',
        message: err?.message || 'Failed to submit recovery request.',
      });
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#fff1f2] via-[#fcf8fa] to-[#fbf2f6] relative overflow-hidden flex flex-col items-center justify-center px-4 py-8 sm:py-12 text-[#141219] select-none">
      {/* Signature warm ambient light flares matching I Love Surprises brand */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] rounded-full bg-[#D30915]/10 blur-[130px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-rose-400/10 blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-400/5 blur-[160px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Navigation / Storefront Return */}
      <header className="w-full max-w-md sm:max-w-lg mb-4 sm:mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateToHome}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#716d77] hover:text-[#D30915] transition-colors cursor-pointer group"
          id="admin-login-back-to-store"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Return to Storefront</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#fecdd3] text-xs font-black text-[#D30915] shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-[#D30915]" />
          <span>Restricted Portal</span>
        </div>
      </header>

      {/* Main Admin Authentication Card with Luxury Dual-Layer Aura */}
      <div className="w-full max-w-md sm:max-w-lg p-[1.5px] rounded-[30px] sm:rounded-[36px] bg-gradient-to-b from-[#fecdd3] via-white/70 to-[#eedbe6] shadow-[0_25px_80px_rgba(211,9,21,0.09),0_6px_28px_rgba(20,18,25,0.04)] relative z-10 transition-all">
        <main className="w-full bg-white/95 backdrop-blur-2xl rounded-[28px] sm:rounded-[34px] p-6 sm:p-10 relative overflow-hidden">
          {/* Subtle interior ambient glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-b from-[#fff1f2] to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-7 sm:mb-8">
            <div className="relative mb-4 flex items-center justify-center">
              {/* Logo Ambient Halo */}
              <div
                className="absolute -inset-4 bg-gradient-to-r from-red-100/60 via-rose-100/50 to-amber-100/40 blur-2xl rounded-full -z-10"
                aria-hidden="true"
              />
              <img
                src="/assets/ilovesurprises/logo/logo-16k.png"
                alt="I Love Surprises"
                width={8192}
                height={2728}
                className="h-14 min-[420px]:h-16 sm:h-20 w-auto max-w-[240px] min-[420px]:max-w-[280px] sm:max-w-[340px] object-contain drop-shadow-xs"
                loading="eager"
                style={{
                  imageRendering: '-webkit-optimize-contrast',
                  WebkitBackfaceVisibility: 'hidden',
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                }}
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] text-xs sm:text-[13px] font-black uppercase tracking-wider mb-2.5 shadow-2xs">
              <span>Administrator Suite</span>
            </div>

            <p className="text-sm text-[#716d77] max-w-sm font-medium m-0 leading-relaxed">
              Sign in with authorized executive credentials to manage commerce, inventory, and storefront content.
            </p>

            {/* Quick Demo Credentials Autofill Pill */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  setEmail('cookuwithcomali336@gmail.com');
                  setPassword('Admin@123456');
                  setErrorMessage(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf7f9] hover:bg-[#fff1f2] border border-[#eedbe6] hover:border-[#fecdd3] text-[11px] font-bold text-[#716d77] hover:text-[#D30915] transition-all cursor-pointer shadow-2xs group"
                title="Fill authorized admin demo credentials"
              >
                <span>Fill Authorized Admin Credentials</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              id="admin-login-error"
              className="mb-5 p-4 rounded-2xl bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] flex items-start gap-3 text-xs sm:text-sm leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xs"
              role="alert"
            >
              <AlertCircle className="w-4.5 h-4.5 text-[#D30915] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-black text-[#141219] m-0 text-sm">Authentication Failed</p>
                <p className="text-[#716d77] mt-0.5 m-0 font-medium text-xs sm:text-[13px]">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
            {/* Email Address */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-black text-[#141219] uppercase tracking-wider mb-2"
              >
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8a858f]">
                  <Mail className="w-4.5 h-4.5" />
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
                  className="w-full pl-11 pr-4 py-3.5 bg-[#faf7f9] border border-[#eedbe6] rounded-xl text-sm sm:text-base font-semibold text-[#141219] placeholder-[#9c93a4] focus:bg-white focus:outline-none focus:border-[#D30915] focus:ring-4 focus:ring-[#D30915]/10 shadow-2xs transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-black text-[#141219] uppercase tracking-wider"
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
                  className="text-xs sm:text-sm font-bold text-[#D30915] hover:text-[#B60711] hover:underline transition-colors cursor-pointer"
                  id="admin-forgot-password-trigger"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8a858f]">
                  <Lock className="w-4.5 h-4.5" />
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
                  className="w-full pl-11 pr-12 py-3.5 bg-[#faf7f9] border border-[#eedbe6] rounded-xl text-sm sm:text-base font-semibold text-[#141219] placeholder-[#9c93a4] focus:bg-white focus:outline-none focus:border-[#D30915] focus:ring-4 focus:ring-[#D30915]/10 shadow-2xs transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8a858f] hover:text-[#D30915] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Session Persistence / Remember Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs sm:text-sm text-[#716d77] font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-[#eedbe6] bg-[#faf7f9] text-[#D30915] focus:ring-[#D30915]/20 cursor-pointer accent-[#D30915]"
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            {/* Submit Sign In Button with Shimmer Sweep */}
            <div className="pt-2">
              <button
                id="admin-login-submit"
                type="submit"
                disabled={isLoading}
                className="relative overflow-hidden w-full py-4 px-5 rounded-xl bg-gradient-to-r from-[#D30915] via-[#e11d48] to-[#B60711] hover:from-[#b80712] hover:to-[#9f060f] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_12px_32px_rgba(211,9,21,0.28)] hover:shadow-[0_16px_40px_rgba(211,9,21,0.38)] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {/* Subtle Shimmer Sweep */}
                <span
                  className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none"
                  aria-hidden="true"
                />
                {isLoading ? (
                  <>
                    <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5 transition-transform group-hover:rotate-12" />
                    <span>Sign In to Admin Suite</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Triple Security & Trust Badges */}
          <div className="mt-8 pt-5 border-t border-[#f4e2ed] grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#faf7f9] border border-[#f4e2ed]">
              <ShieldCheck className="w-4 h-4 text-[#D30915]" />
              <span className="text-[10px] font-black uppercase text-[#141219] tracking-wider">256-Bit SSL</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#faf7f9] border border-[#f4e2ed]">
              <KeyRound className="w-4 h-4 text-[#D30915]" />
              <span className="text-[10px] font-black uppercase text-[#141219] tracking-wider">Zero Trust</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#faf7f9] border border-[#f4e2ed]">
              <Lock className="w-4 h-4 text-[#D30915]" />
              <span className="text-[10px] font-black uppercase text-[#141219] tracking-wider">RBAC Auth</span>
            </div>
          </div>
        </main>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141219]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white border border-[#eedbe6] rounded-2xl sm:rounded-3xl shadow-2xl p-6 relative z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-[#f4e2ed] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] flex items-center justify-center">
                  <KeyRound className="w-4.5 h-4.5" />
                </div>
                <h3 id="forgot-password-title" className="text-sm sm:text-base font-black text-[#141219] uppercase tracking-wider m-0">
                  Admin Password Recovery
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1.5 rounded-lg text-[#716d77] hover:text-[#141219] hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#716d77] mb-4 font-medium leading-relaxed">
              Enter your registered administrator email address. We will transmit a secure, single-use password recovery link.
            </p>

            {forgotFeedback && (
              <div
                className={`p-3.5 rounded-xl mb-4 text-xs sm:text-sm flex items-start gap-2.5 ${
                  forgotFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-[#fff1f2] border border-[#fecdd3] text-[#D30915]'
                }`}
              >
                {forgotFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4.5 h-4.5 text-[#D30915] shrink-0 mt-0.5" />
                )}
                <span className="font-semibold">{forgotFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="forgot-admin-email"
                  className="block text-xs font-black text-[#141219] uppercase tracking-wider mb-2"
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
                  className="w-full px-4 py-3 bg-[#faf7f9] border border-[#eedbe6] rounded-xl text-sm sm:text-base font-semibold text-[#141219] placeholder-[#9c93a4] focus:bg-white focus:outline-none focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/10 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#716d77] hover:text-[#141219] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#D30915] hover:bg-[#b80712] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isForgotLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
