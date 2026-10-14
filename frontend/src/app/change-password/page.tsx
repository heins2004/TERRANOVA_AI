"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/layout/auth-provider";
import { TopBar } from "@/components/layout/TopBar";
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard";

function getRoleHome(role?: string): string {
  if (role === "Urban Planner") return "/planner";
  if (role === "Government Official") return "/gov";
  if (role === "Administrator") return "/admin";
  return "/";
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isReady, isAuthenticated, refreshUser } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    // If user does not require password change, go directly to their role home
    if (!user.must_change_password) {
      router.replace(getRoleHome(user.role));
    }
  }, [isAuthenticated, isReady, user, router]);

  async function handlePasswordChanged() {
    setIsRedirecting(true);
    await refreshUser();
    const dest = getRoleHome(user?.role);
    router.push(dest);
  }

  if (!isReady || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface">
      <TopBar />
      <main className="mx-auto max-w-[800px] px-[16px] py-[32px] sm:px-[24px] sm:py-[48px] flex flex-col gap-[24px]">
        {/* Header and Explanation */}
        <div className="rounded-2xl border border-white/10 bg-surface-container-lowest/80 p-[20px] sm:p-[28px] backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col gap-[12px]">
          <div className="flex items-center gap-[12px]">
            <div className="flex h-[40px] w-[40px] items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="material-symbols-outlined text-[24px]">lock_reset</span>
            </div>
            <div>
              <h1 className="font-display-md text-[20px] sm:text-[22px] font-bold text-on-surface">
                Password Change Required
              </h1>
              <p className="font-body-md text-[13px] text-on-surface-variant">
                First-time sign in security verification
              </p>
            </div>
          </div>

          <p className="font-body-md text-[13px] leading-relaxed text-on-surface/90">
            Your account was created by an administrator with a temporary password. For security compliance, you must choose a new permanent password before accessing your {user.role} portal.
          </p>

          <div className="flex flex-wrap items-center gap-[8px] pt-[4px] text-[12px] font-data-mono text-on-surface-variant">
            <span className="rounded bg-white/5 px-[8px] py-[3px] border border-white/10">
              User: <span className="text-on-surface font-semibold">{user.email}</span>
            </span>
            <span className="rounded bg-white/5 px-[8px] py-[3px] border border-white/10">
              Role: <span className="text-primary-container font-semibold">{user.role}</span>
            </span>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="relative">
          <ChangePasswordCard onSuccess={() => void handlePasswordChanged()} />
          {isRedirecting && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm">
              <div className="flex items-center gap-[10px] text-[14px] text-on-surface font-medium">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Redirecting to your dashboard...</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
