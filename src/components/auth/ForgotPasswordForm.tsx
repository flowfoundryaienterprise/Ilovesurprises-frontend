import React, { useState, useRef, useEffect } from 'react';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService, isValidEmail } from '../../services/auth';

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSwitchToLogin,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading || cooldown > 0) return;
    if (!identifier.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    if (!isValidEmail(identifier)) {
      setError('Please enter a valid email address.');
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const res = await authService.forgotPassword(identifier.trim());
      if (res.success) {
        setSuccessMessage(res.message);
        setCooldown(60);
      } else {
        setError(res.error || 'Unable to process request. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Connection error. Please check your internet connection and try again.');
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Centered Logo & Header */}
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
          Forgot Password?
        </h2>
        <p className="text-xs text-[#716d77] mt-1 m-0">
          Enter your registered email address to receive password reset instructions
        </p>
      </div>

      {/* Success State */}
      {successMessage ? (
        <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div>
            <h3 className="text-base font-black text-[#141219] mb-1">
              Instructions Sent!
            </h3>
            <p className="text-xs text-[#55505a] leading-relaxed max-w-xs mx-auto font-medium">
              {successMessage}
            </p>
          </div>

          <div className="p-3 rounded-[13px] bg-[#fff1f2] border border-[#fecdd3] text-left text-xs text-[#55505a]">
            <p className="m-0 font-medium">
              💡 <strong>Tip:</strong> If you don't see the email within a few minutes, check your spam or promotions folder.
            </p>
          </div>

          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full h-[44px] rounded-[13px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_8px_20px_rgba(211,9,21,0.28)] hover:shadow-[0_12px_28px_rgba(211,9,21,0.38)] hover:-translate-y-0.5 active:translate-y-0 active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Back to Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Forgot Password Request Form */
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div className="p-3 rounded-[13px] bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="forgot-identifier" className="block text-[11px] sm:text-xs font-bold text-[#141219] mb-1">
              Email Address <span className="text-[#D30915]">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a858f] pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="forgot-identifier"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                placeholder="example@gmail.com"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError(null);
                }}
                className={`w-full h-[42px] sm:h-[44px] pl-10 pr-3 rounded-[13px] bg-[#fffafb] border text-xs sm:text-sm font-medium text-[#141219] placeholder:text-[#9c95a0] transition-all outline-none disabled:opacity-50 ${error
                  ? 'border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
                  : 'border-[#ebdce5] hover:border-[#f1b8cb] focus:border-[#D30915] focus:bg-white focus:ring-2 focus:ring-[#D30915]/10'
                  }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || cooldown > 0}
            className="w-full h-[44px] sm:h-[46px] rounded-[14px] bg-gradient-to-r from-[#D30915] to-[#B60711] hover:from-[#B60711] hover:to-[#96050e] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_8px_22px_rgba(211,9,21,0.28)] hover:shadow-[0_12px_28px_rgba(211,9,21,0.38)] hover:-translate-y-0.5 active:translate-y-0 active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending Instructions...</span>
              </div>
            ) : cooldown > 0 ? (
              <span>Wait ({cooldown}s)</span>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#716d77] hover:text-[#D30915] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
