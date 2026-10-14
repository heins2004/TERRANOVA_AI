"use client";

import { useRef, useState } from "react";
import { AvatarPickerGrid } from "./AvatarPickerGrid";
import { ProfileRoleExtras } from "./ProfileRoleExtras";
import { validateProfileForm } from "./profileValidation";
import { UserProfile, updateProfile } from "@/services/profile";
import { useAuth } from "@/components/layout/auth-provider";

type ProfileEditFormProps = {
  profile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
};

export function ProfileEditForm({
  profile,
  onProfileUpdated,
}: ProfileEditFormProps) {
  const { refreshUser } = useAuth();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone || "");
  const [city, setCity] = useState(profile.city || "");
  const [avatarKey, setAvatarKey] = useState(profile.avatar_key || "avatar-01");
  const [organization, setOrganization] = useState(profile.organization || "");
  const [designation, setDesignation] = useState(profile.designation || "");
  const [expertise, setExpertise] = useState(profile.expertise || "");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSubmittingRef = useRef(false);

  const role = profile.role;
  const isPlanner = role === "Urban Planner";
  const isOfficial = role === "Government Official";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;

    setServerError(null);
    setSuccessMessage(null);

    const errors = validateProfileForm(
      { name, phone, city, organization, designation, expertise },
      isPlanner,
      isOfficial,
    );
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        avatar_key: avatarKey,
      };

      if (isPlanner) {
        payload.organization = organization.trim() || null;
        payload.expertise = expertise.trim() || null;
      } else if (isOfficial) {
        payload.organization = organization.trim() || null;
        payload.designation = designation.trim() || null;
      }

      const updated = await updateProfile(payload);
      onProfileUpdated(updated);
      await refreshUser();
      setSuccessMessage("Profile updated successfully!");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile.";
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
      className="rounded-2xl border border-white/10 bg-surface-container-lowest/80 p-[20px] sm:p-[28px] backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col gap-[20px]"
    >
      <div className="border-b border-white/10 pb-[12px]">
        <h2 className="font-display-md text-[18px] font-semibold text-on-surface">
          Edit Profile
        </h2>
        <p className="mt-[2px] font-body-md text-[12px] text-on-surface-variant">
          Update your public profile details and role-specific information.
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
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Avatar Picker Grid */}
      <AvatarPickerGrid
        selectedKey={avatarKey}
        onSelect={(key) => setAvatarKey(key)}
        disabled={isLoading}
      />

      <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
        {/* Name */}
        <div className="flex flex-col gap-[6px]">
          <label
            htmlFor="profile-name-input"
            className="font-body-md text-[13px] font-medium text-on-surface"
          >
            Full Name <span className="text-primary-container">*</span>
          </label>
          <input
            id="profile-name-input"
            type="text"
            value={name}
            disabled={isLoading}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
            }}
            className={`h-[42px] rounded-lg border px-[14px] font-body-md text-[13px] text-on-surface bg-white/5 transition-all focus:outline-none ${
              fieldErrors.name
                ? "border-danger focus:border-danger"
                : "border-white/15 focus:border-primary-container"
            }`}
          />
          {fieldErrors.name && (
            <p className="font-body-md text-[11px] text-danger">{fieldErrors.name}</p>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-[6px]">
          <label
            htmlFor="profile-email-input"
            className="font-body-md text-[13px] font-medium text-on-surface-variant"
          >
            Email Address (Read-only)
          </label>
          <input
            id="profile-email-input"
            type="email"
            value={profile.email}
            disabled
            className="h-[42px] cursor-not-allowed rounded-lg border border-white/10 bg-white/[0.02] px-[14px] font-body-md text-[13px] text-on-surface-variant/70"
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-[6px]">
          <label
            htmlFor="profile-phone-input"
            className="font-body-md text-[13px] font-medium text-on-surface"
          >
            Phone Number (10 digits starting 6-9)
          </label>
          <input
            id="profile-phone-input"
            type="tel"
            placeholder="e.g. 9876543210"
            value={phone}
            disabled={isLoading}
            onChange={(e) => {
              setPhone(e.target.value);
              if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: "" }));
            }}
            className={`h-[42px] rounded-lg border px-[14px] font-body-md text-[13px] text-on-surface bg-white/5 transition-all focus:outline-none ${
              fieldErrors.phone
                ? "border-danger focus:border-danger"
                : "border-white/15 focus:border-primary-container"
            }`}
          />
          {fieldErrors.phone && (
            <p className="font-body-md text-[11px] text-danger">{fieldErrors.phone}</p>
          )}
        </div>

        {/* City */}
        <div className="flex flex-col gap-[6px]">
          <label
            htmlFor="profile-city-input"
            className="font-body-md text-[13px] font-medium text-on-surface"
          >
            City
          </label>
          <input
            id="profile-city-input"
            type="text"
            placeholder="e.g. Mumbai"
            value={city}
            disabled={isLoading}
            onChange={(e) => {
              setCity(e.target.value);
              if (fieldErrors.city) setFieldErrors((p) => ({ ...p, city: "" }));
            }}
            className="h-[42px] rounded-lg border border-white/15 bg-white/5 px-[14px] font-body-md text-[13px] text-on-surface transition-all focus:border-primary-container focus:outline-none"
          />
          {fieldErrors.city && (
            <p className="font-body-md text-[11px] text-danger">{fieldErrors.city}</p>
          )}
        </div>

        {/* Role Extras */}
        <ProfileRoleExtras
          role={role}
          organization={organization}
          setOrganization={setOrganization}
          designation={designation}
          setDesignation={setDesignation}
          expertise={expertise}
          setExpertise={setExpertise}
          isLoading={isLoading}
          fieldErrors={fieldErrors}
        />
      </div>

      <div className="flex justify-end pt-[8px]">
        <button
          type="submit"
          id="profile-save-button"
          disabled={isLoading}
          className="h-[40px] inline-flex items-center justify-center gap-[8px] rounded-lg bg-primary px-[22px] font-body-md text-[13px] font-semibold text-primary-foreground shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && (
            <span
              className="h-[14px] w-[14px] animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
              aria-hidden="true"
            />
          )}
          <span>{isLoading ? "Saving..." : "Save changes"}</span>
        </button>
      </div>
    </form>
  );
}
