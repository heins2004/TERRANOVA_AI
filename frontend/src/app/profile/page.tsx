"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { RoleSummaryCard } from "@/components/profile/RoleSummaryCard";
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard";
import { FollowingSection } from "@/components/profile/FollowingSection";
import { CitizenCommentsSection } from "@/components/profile/CitizenCommentsSection";
import { PlannerCredentialsSection } from "@/components/profile/PlannerCredentialsSection";
import { UserProfile, getProfile } from "@/services/profile";

type TabKey = "overview" | "following" | "comments";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

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

  function handleCommentCountChanged(newCount: number) {
    setProfile((prev) => {
      if (!prev) return prev;
      if (prev.role === "Citizen" && prev.counts && "comments" in prev.counts) {
        return {
          ...prev,
          counts: {
            ...prev.counts,
            comments: newCount,
          },
        };
      }
      return prev;
    });
  }

  const isCitizen = profile?.role === "Citizen";

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface">
      <TopBar />

      <main className="mx-auto max-w-[1100px] px-[16px] py-[32px] sm:px-[24px]">
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
        ) : (
          <div className="flex flex-col gap-[24px]">
            {/* Header info */}
            <ProfileHeader profile={profile} />

            {/* Navigation Tabs */}
            <nav
              aria-label="Profile Sections"
              className="flex items-center gap-[8px] border-b border-white/10 pb-[2px]"
            >
              <button
                type="button"
                id="tab-overview"
                role="tab"
                aria-selected={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
                className={`relative flex items-center gap-[6px] px-[16px] py-[10px] font-body-md text-[13px] font-semibold transition-all ${
                  activeTab === "overview"
                    ? "text-primary border-b-2 border-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  badge
                </span>
                <span>Overview</span>
              </button>

              <button
                type="button"
                id="tab-following"
                role="tab"
                aria-selected={activeTab === "following"}
                onClick={() => setActiveTab("following")}
                className={`relative flex items-center gap-[6px] px-[16px] py-[10px] font-body-md text-[13px] font-semibold transition-all ${
                  activeTab === "following"
                    ? "text-primary border-b-2 border-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  bookmark
                </span>
                <span>
                  Following{" "}
                  {profile.role === "Citizen" &&
                  profile.counts &&
                  "follows" in profile.counts
                    ? `(${profile.counts.follows})`
                    : ""}
                </span>
              </button>

              {isCitizen && (
                <button
                  type="button"
                  id="tab-comments"
                  role="tab"
                  aria-selected={activeTab === "comments"}
                  onClick={() => setActiveTab("comments")}
                  className={`relative flex items-center gap-[6px] px-[16px] py-[10px] font-body-md text-[13px] font-semibold transition-all ${
                    activeTab === "comments"
                      ? "text-primary border-b-2 border-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chat
                  </span>
                  <span>
                    My comments{" "}
                    {profile.counts && "comments" in profile.counts
                      ? `(${profile.counts.comments})`
                      : ""}
                  </span>
                </button>
              )}
            </nav>

            {/* Tab Panels */}
            {activeTab === "overview" && (
              <div className="flex flex-col gap-[24px]">
                <RoleSummaryCard profile={profile} />
                {profile.role === "Urban Planner" && <PlannerCredentialsSection />}
                <ProfileEditForm
                  profile={profile}
                  onProfileUpdated={handleProfileUpdated}
                />
                <ChangePasswordCard />
              </div>
            )}

            {activeTab === "following" && (
              <FollowingSection
                onFollowCountChanged={handleFollowCountChanged}
              />
            )}

            {activeTab === "comments" && isCitizen && (
              <CitizenCommentsSection
                onCommentCountChanged={handleCommentCountChanged}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
