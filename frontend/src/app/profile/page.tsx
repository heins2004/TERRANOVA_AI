"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import { SidebarLayout, SidebarItem } from "@/components/layout/SidebarLayout";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { RoleSummaryCard } from "@/components/profile/RoleSummaryCard";
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard";
import { FollowingSection } from "@/components/profile/FollowingSection";
import { UserProfile, getProfile } from "@/services/profile";

const PROFILE_NAV_ITEMS: SidebarItem[] = [
  { key: "overview", label: "Overview", icon: "badge" },
  { key: "following", label: "Following", icon: "bookmark" },
  { key: "edit-profile", label: "Edit profile", icon: "edit" },
  { key: "change-password", label: "Change password", icon: "lock" },
];

const VALID_SECTIONS = [
  "overview",
  "following",
  "edit-profile",
  "change-password",
] as const;

type ProfileSection = (typeof VALID_SECTIONS)[number];

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isReady } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rawSection = searchParams.get("section");
  const activeSection: ProfileSection = VALID_SECTIONS.includes(rawSection as ProfileSection)
    ? (rawSection as ProfileSection)
    : "overview";

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [isAuthenticated, isReady, router]);

  function handleProfileUpdated(updated: UserProfile) {
    setProfile(updated);
  }

  function handleFollowCountChanged(newCount: number) {
    setProfile((prev) => {
      if (!prev) return prev;
      if (prev.role === "Citizen" && prev.counts && "follows" in prev.counts) {
        return {
          ...prev,
          counts: {
            ...prev.counts,
            follows: newCount,
          },
        };
      }
      return prev;
    });
  }

  if (!isReady || (!isAuthenticated && isReady)) {
    return (
      <div className="min-h-screen bg-surface-container-lowest text-on-surface">
        <TopBar />
        <main className="flex-1 px-[24px] py-[32px] flex items-center justify-center">
          <p className="font-data-mono text-sm text-on-surface-variant">AUTHENTICATING...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface">
      <TopBar />

      <main className="flex-1 w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-[100px]">
            <span
              className="h-[36px] w-[36px] animate-spin rounded-full border-2 border-primary border-t-transparent"
              aria-hidden="true"
            />
            <p className="mt-[16px] font-data-mono text-[13px] text-on-surface-variant uppercase tracking-wider">
              Loading profile data...
            </p>
          </div>
        ) : error || !profile ? (
          <div className="mx-auto max-w-4xl px-[24px] py-[32px]">
            <div className="rounded-xl border border-danger/40 bg-danger/10 p-[24px] text-center text-danger">
              <span className="material-symbols-outlined text-[32px]">error</span>
              <p className="mt-[8px] font-body-md text-[14px]">
                {error || "Profile could not be retrieved."}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-[14px] inline-flex items-center gap-[6px] rounded-lg border border-danger/60 px-[16px] py-[8px] font-body-md text-[13px]"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <SidebarLayout
            items={PROFILE_NAV_ITEMS}
            activeKey={activeSection}
            basePath="/profile"
            navTitle="Profile Menu"
            idPrefix="profile"
          >
            <div className="space-y-[24px]">
              <ProfileHeader profile={profile} />

              {activeSection === "overview" && (
                <div className="space-y-[24px]">
                  <RoleSummaryCard profile={profile} />
                </div>
              )}

              {activeSection === "following" && (
                <FollowingSection
                  onFollowCountChanged={handleFollowCountChanged}
                />
              )}

              {activeSection === "edit-profile" && (
                <ProfileEditForm
                  profile={profile}
                  onProfileUpdated={handleProfileUpdated}
                />
              )}

              {activeSection === "change-password" && (
                <ChangePasswordCard />
              )}
            </div>
          </SidebarLayout>
        )}
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-container-lowest text-on-surface">
          <TopBar />
          <main className="flex-1 px-[24px] py-[32px] flex items-center justify-center">
            <p className="font-data-mono text-sm text-on-surface-variant">LOADING PROFILE...</p>
          </main>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
