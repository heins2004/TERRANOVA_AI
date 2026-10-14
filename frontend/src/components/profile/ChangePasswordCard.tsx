"use client";

import { useRef, useState } from "react";
import { changePassword } from "@/services/profile";

interface ChangePasswordCardProps {
  onSuccess?: () => void;
}

export function ChangePasswordCard({ onSuccess }: ChangePasswordCardProps = {}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSubmittingRef = useRef(false);

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = "Current password is required.";
    }

    if (!newPassword) {
      errors.newPassword = "New password is required.";
    } else if (newPassword.length < 8) {
      errors.newPassword = "New password must be at least 8 characters.";
    } else if (newPassword === currentPassword) {
      errors.newPassword = "New password must differ from current password.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;

    setServerError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      // Clear fields upon success as requested
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFieldErrors({});
      setSuccessMessage("Password changed successfully! Other active sessions were ended.");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to change password.";
      setServerError(message);
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-white/10 bg-surface-container-lowest/80 p-[20px] sm:p-[28px] backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col gap-[18px]"
    >
      <div className="border-b border-white/10 pb-[12px]">
        <h2 className="font-display-md text-[18px] font-semibold text-on-surface">
          Change Password
        </h2>
        <p className="mt-[2px] font-body-md text-[12px] text-on-surface-variant">
          Update your account password. All other active sessions will be terminated upon success.
        </p>
      </div>

      {serverError && (
        <div
          role="alert"
          className="flex items-center gap-[8px] rounded-lg border border-danger/40 bg-danger/10 px-[14px] py-[10px] text-[13px] text-danger"
        >
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-[8px] rounded-lg border border-success/40 bg-success/10 px-[14px] py-[10px] text-[13px] text-success"
        >
          <span className="material-symbols-outlined text-[18px]">
            check_circle
          </span>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-3">
        {/* Current Password */}
        <div className="flex flex-col gap-[6px]">
          <label
            htmlFor="password-current-input"
            className="font-body-md text-[13px] font-medium text-on-surface"
          >
            Current Password <span className="text-primary-container">*</span>
          </label>
          <input
            id="password-current-input"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            disabled={isLoading}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (fieldErrors.currentPassword) {
                setFieldErrors((prev) => ({ ...prev, currentPassword: "" }));
              }
            }}
            className={`h-[42px] rounded-lg border px-[14px] font-body-md text-[13px] text-on-surface bg-white/5 transition-all focus:outline-none ${
              fieldErrors.currentPassword
                ? "border-danger focus:border-danger"
                : "border-white/15 focus:border-primary-container"
            }`}
          />
          {fieldErrors.currentPassword && (
            <p className="font-body-md text-[11px] text-danger">
              {fieldErrors.currentPassword}
            </p>
          )}
        </div>

        {/* New Password */}
        <div className="flex flex-col gap-[6px]">
          <label
            htmlFor="password-new-input"
            className="font-body-md text-[13px] font-medium text-on-surface"
          >
            New Password (min 8) <span className="text-primary-container">*</span>
          </label>
          <input
            id="password-new-input"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            disabled={isLoading}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (fieldErrors.newPassword) {
                setFieldErrors((prev) => ({ ...prev, newPassword: "" }));
              }
            }}
            className={`h-[42px] rounded-lg border px-[14px] font-body-md text-[13px] text-on-surface bg-white/5 transition-all focus:outline-none ${
              fieldErrors.newPassword
                ? "border-danger focus:border-danger"
                : "border-white/15 focus:border-primary-container"
            }`}
          />
          {fieldErrors.newPassword && (
            <p className="font-body-md text-[11px] text-danger">
              {fieldErrors.newPassword}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-[6px]">
          <label
            htmlFor="password-confirm-input"
            className="font-body-md text-[13px] font-medium text-on-surface"
          >
            Confirm New Password <span className="text-primary-container">*</span>
          </label>
          <input
            id="password-confirm-input"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            disabled={isLoading}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }
            }}
            className={`h-[42px] rounded-lg border px-[14px] font-body-md text-[13px] text-on-surface bg-white/5 transition-all focus:outline-none ${
              fieldErrors.confirmPassword
                ? "border-danger focus:border-danger"
                : "border-white/15 focus:border-primary-container"
            }`}
          />
          {fieldErrors.confirmPassword && (
            <p className="font-body-md text-[11px] text-danger">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-[4px]">
        <button
          type="submit"
          id="password-submit-button"
          disabled={isLoading}
          className="h-[40px] inline-flex items-center justify-center gap-[8px] rounded-lg border border-primary-container/60 bg-primary-container/10 px-[20px] font-body-md text-[13px] font-semibold text-primary transition-all hover:bg-primary-container/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && (
            <span
              className="h-[14px] w-[14px] animate-spin rounded-full border-2 border-primary border-t-transparent"
              aria-hidden="true"
            />
          )}
          <span>{isLoading ? "Updating..." : "Update password"}</span>
        </button>
      </div>
    </form>
  );
}
