import React, { useState, useRef, useEffect } from 'react';
import { Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { PasswordInput } from './PasswordInput';
import { GoogleAuthButton } from './GoogleAuthButton';
import { authService, isValidEmail } from '../../services/auth';
import type { UserProfile } from '../../types';

interface LoginFormProps {
  initialEmail?: string;
  onSuccess: (user: UserProfile) => void;
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  initialEmail = '',
  onSuccess,
  onSwitchToSignUp,
  onSwitchToForgotPassword,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [prevInitialEmail, setPrevInitialEmail] = useState(initialEmail);

  if (initialEmail && initialEmail !== prevInitialEmail) {
    setPrevInitialEmail(initialEmail);
    setEmail(initialEmail);
  }

  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isSubmittingRef = useRef(false);
  const isResendingRef = useRef(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string; general?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Please enter your password.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;
    if (!validate()) return;

    isSubmittingRef.current = true;
    setIsLoading(true);
    setErrors({});

    try {
      const res = await authService.login({
        identifier: email.trim(),
        password,
        rememberMe,
      });

      if (res.success && res.user) {
        onSuccess(res.user);
      } else if (res.requiresVerification) {
        setUnverifiedEmail(email.trim());
        setResendCooldown(60);
        setErrors({ general: res.error || 'Your email address is not verified yet. Please check your inbox or resend the verification link.' });
      } else {
        setUnverifiedEmail(null);
        setErrors({ general: res.error || 'Unable to sign in. Please verify your credentials.' });
      }
    } catch (err: any) {
      setErrors({ general: err?.message || 'Connection error. Please check your internet connection and try again.' });
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail || isResendingRef.current || isResending || resendCooldown > 0) return;
    isResendingRef.current = true;
    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await authService.resendVerification(unverifiedEmail);
      if (res.success) {
        setResendStatus('Verification email resent! Please check your inbox.');
        setResendCooldown(60);
      } else {
        setResendStatus(res.error || 'Failed to resend verification email.');
      }
    } catch (err: any) {
      setResendStatus(err?.message || 'Connection error. Please check your internet connection and try again.');
    } finally {
      isResendingRef.current = false;
      setIsResending(false);
    }
  };

  return (
    <div className="w-full">
      {/* Centered Logo & Welcome Header */}
      <div className="text-center mb-5">
        <img
          src="/assets/ilovesurprises/logo/logo-16k.png"
          alt="I Love Surprises Logo"
          width={8192}
          height={2728}
          className="h-[42px] min-[360px]:h-[46px] min-[390px]:h-[50px] min-[420px]:h-[52px] sm:h-[57px] w-auto max-w-[170px] min-[360px]:max-w-[195px] min-[390px]:max-w-[215px] min-[420px]:max-w-[230px] sm:max-w-[265px] mx-auto object-contain mb-3"
          loading="eager"
          style={{
            imageRendering: '-webkit-optimize-contrast',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
          }}
        />
        <h2 className="text-xl sm:text-2xl font-black text-[#141219] tracking-tight m-0 font-display">
          Welcome Back
        </h2>
        <p className="text-xs text-[#716d77] mt-1 m-0">
          Login to continue shopping and manage your orders
        </p>
      </div>

      {/* General Error Banner */}
      {errors.general && (
        <div className="mb-4 p-3 rounded-[13px] bg-red-50 border border-red-200 text-red-700 text-xs font-semibold space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{errors.general}</span>
          </div>
          {unverifiedEmail && (
            <div className="pl-6 pt-1">
              {resendStatus ? (
                <p className="text-[11px] text-emerald-700 font-bold m-0">{resendStatus}</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending || resendCooldown > 0}
                  className="text-[11px] font-black text-[#D30915] underline hover:text-[#B60711] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending
                    ? 'Resending Link...'
                    : resendCooldown > 0
                    ? `Resend Verification Link (${resendCooldown}s)`
                    : 'Resend Verification Link'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Continue with Google */}
      <div className="mb-4">
        <GoogleAuthButton
          onSuccess={(user) => onSuccess(user)}
          onError={(err) => setErrors({ general: err })}
          disabled={isLoading}
        />
      </div>

      {/* Modern OR Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="w-full border-t border-[#ebdce5]" />
        <span className="bg-white px-3 text-[11px] font-bold text-[#8a858f] uppercase tracking-wider select-none shrink-0">
          OR
        </span>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        {/* Email Address */}
        <div>
          <label htmlFor="login-email" className="block text-[11px] sm:text-xs font-bold text-[#141219] mb-1">
            Email Address <span className="text-[#D30915]">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a858f] pointer-events-none">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              disabled={isLoading}
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`w-full h-[42px] sm:h-[44px] pl-10 pr-3 rounded-[13px] bg-[#fffafb] border text-xs sm:text-sm font-medium text-[#141219] placeholder:text-[#9c95a0] transition-all outline-none disabled:opacity-50 ${errors.email
                ? 'border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
                : 'border-[#ebdce5] hover:border-[#f1b8cb] focus:border-[#D30915] focus:bg-white focus:ring-2 focus:ring-[#D30915]/10'
                }`}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
            />
          </div>
          {errors.email && (
            <p id="login-email-error" className="text-[11px] text-red-500 mt-1 font-medium flex items-center gap-1">
              <span>⚠️</span>
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Password with Show/Hide & Forgot Password */}
        <PasswordInput
          id="login-password"
          name="password"
          label="Password"
          required
          disabled={isLoading}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
          rightAction={
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-[11px] font-bold text-[#D30915] hover:text-[#B60711] hover:underline focus:outline-none cursor-pointer active:scale-95 transition-all"
            >
              Forgot Password?
            </button>
          }
        />

        {/* Remember Me */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 text-[#55505a] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-[#D30915] focus:ring-[#D30915] accent-[#D30915]"
            />
            <span className="text-[11px] sm:text-xs font-medium">Remember me on this device</span>
          </label>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[44px] sm:h-[46px] rounded-[14px] bg-gradient-to-r from-[#D30915] to-[#B60711] hover:from-[#B60711] hover:to-[#96050e] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_8px_22px_rgba(211,9,21,0.28)] hover:shadow-[0_12px_28px_rgba(211,9,21,0.38)] hover:-translate-y-0.5 active:translate-y-0 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-3"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Logging in...</span>
            </div>
          ) : (
            <>
              <span>LOGIN</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Sign Up */}
      <div className="mt-5 pt-4 border-t border-[#f2edf1] text-center">
        <p className="text-xs text-[#716d77] m-0">
          New to ILoveSurprises?{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-xs font-black text-[#D30915] hover:text-[#B60711] hover:underline focus:outline-none cursor-pointer ml-1 active:scale-95 transition-all"
          >
            Create Account
          </button>
        </p>
      </div>

      {/* Security Trust Note */}
      <div className="mt-3 text-center text-[10px] text-[#8a858f] flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>256-Bit SSL Encrypted & Protected Privacy</span>
      </div>
    </div>
  );
};
