"use client";

import { Avatar } from "@/components/ui/Avatar";
import { UserProfile } from "@/services/profile";

type ProfileHeaderProps = {
  profile: UserProfile;
};

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const formattedDate = new Date(profile.created_at).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface-container-lowest/80 p-[20px] sm:p-[28px] backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      {/* Background glow decoration */}
      <div
        className="pointer-events-none absolute -right-[40px] -top-[40px] h-[160px] w-[160px] rounded-full bg-primary-container/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-[20px] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-[16px] sm:gap-[20px]">
          <div className="relative shrink-0">
            <Avatar
              avatarKey={profile.avatar_key}
              size={72}
              alt={`${profile.name}'s avatar`}
              className="ring-2 ring-primary-container/60 shadow-[0_0_16px_rgba(34,211,238,0.25)]"
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-[8px]">
              <h1 className="truncate font-display-md text-[20px] font-bold text-on-surface sm:text-[24px]">
                {profile.name}
              </h1>
              <span className="inline-flex items-center rounded-full border border-primary-container/40 bg-primary-container/10 px-[10px] py-[2px] font-data-mono text-[11px] font-semibold tracking-wider uppercase text-primary-container">
                {profile.role}
              </span>
            </div>

            <p className="mt-[4px] font-body-md text-[13px] text-on-surface-variant">
              {profile.email}
            </p>

            <div className="mt-[6px] flex flex-wrap items-center gap-[12px] font-data-mono text-[11px] text-on-surface-variant/80">
              <span className="flex items-center gap-[4px]">
                <span className="material-symbols-outlined text-[14px]">
                  calendar_today
                </span>
                Joined {formattedDate}
              </span>
              {profile.city && (
                <span className="flex items-center gap-[4px]">
                  <span className="material-symbols-outlined text-[14px]">
                    location_on
                  </span>
                  {profile.city}
                </span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-[4px]">
                  <span className="material-symbols-outlined text-[14px]">
                    call
                  </span>
                  +91 {profile.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Read-only extras info card if present */}
        {(profile.organization || profile.designation || profile.expertise) && (
          <div className="flex flex-col gap-[4px] rounded-xl border border-white/5 bg-white/[0.02] p-[12px] sm:min-w-[220px]">
            {profile.organization && (
              <div className="text-[12px]">
                <span className="font-data-mono text-on-surface-variant/70 uppercase tracking-wider text-[10px]">
                  Organization:
                </span>
                <p className="font-body-md font-medium text-on-surface truncate">
                  {profile.organization}
                </p>
              </div>
            )}
            {profile.designation && (
              <div className="text-[12px]">
                <span className="font-data-mono text-on-surface-variant/70 uppercase tracking-wider text-[10px]">
                  Designation:
                </span>
                <p className="font-body-md font-medium text-on-surface truncate">
                  {profile.designation}
                </p>
              </div>
            )}
            {profile.expertise && (
              <div className="text-[12px]">
                <span className="font-data-mono text-on-surface-variant/70 uppercase tracking-wider text-[10px]">
                  Expertise:
                </span>
                <p className="font-body-md font-medium text-on-surface line-clamp-2">
                  {profile.expertise}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
