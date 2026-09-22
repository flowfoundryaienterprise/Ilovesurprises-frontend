import React, { useState, useRef } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { PasswordInput } from './PasswordInput';
import { authService, evaluatePasswordStrength } from '../../services/auth';

interface ResetPasswordFormProps {
  onSwitchToLogin: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onSwitchToLogin,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const passwordStrength = evaluatePasswordStrength(newPassword);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!newPassword) {
      newErrors.newPassword = 'Password is required.';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password.';
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
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
      const res = await authService.resetPassword(newPassword);
      if (res.success) {
        setSuccessMessage(res.message || 'Your password has been successfully updated! You can now log in.');
      } else {
        setErrors({ general: res.error || 'Failed to update password. Please request a new reset link.' });
      }
    } catch (err: any) {
      setErrors({ general: err?.message || 'Connection error. Please check your internet connection and try again.' });
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
          Reset Your Password
        </h2>
        <p className="text-xs text-[#716d77] mt-1 m-0">
          Set a secure new password for your VIP account
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
              Password Changed!
            </h3>
            <p className="text-xs text-[#55505a] leading-relaxed max-w-xs mx-auto font-medium">
              {successMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full h-[44px] rounded-[13px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_8px_20px_rgba(211,9,21,0.28)] hover:shadow-[0_12px_28px_rgba(211,9,21,0.38)] hover:-translate-y-0.5 active:translate-y-0 active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Sign In with New Password</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Password Reset Form */
        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          {errors.general && (
            <div className="p-3 rounded-[13px] bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* New Password */}
          <div>
            <PasswordInput
              id="reset-new-password"
              name="newPassword"
              label="New Password"
              required
              disabled={isLoading}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: undefined }));
              }}
              error={errors.newPassword}
            />

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <div className="mt-1.5 px-0.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#716d77] mb-1">
                  <span>Password strength</span>
                  <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                </div>
                <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${passwordStrength.percentage}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <PasswordInput
            id="reset-confirm-password"
            name="confirmPassword"
            label="Confirm New Password"
            required
            disabled={isLoading}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            error={errors.confirmPassword}
          />

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[44px] sm:h-[46px] rounded-[14px] bg-gradient-to-r from-[#D30915] to-[#B60711] hover:from-[#B60711] hover:to-[#96050e] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_8px_22px_rgba(211,9,21,0.28)] hover:shadow-[0_12px_28px_rgba(211,9,21,0.38)] hover:-translate-y-0.5 active:translate-y-0 active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Updating Password...</span>
              </div>
            ) : (
              <>
                <span>SAVE NEW PASSWORD</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Back to Login Link */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs font-bold text-[#716d77] hover:text-[#D30915] transition-colors cursor-pointer"
            >
              Cancel and Return to Sign In
            </button>
          </div>
        </form>
      )}

      {/* Security Trust Note */}
      <div className="mt-4 text-center text-[10px] text-[#8a858f] flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Secured via End-to-End Session Protocol</span>
      </div>
    </div>
  );
};
