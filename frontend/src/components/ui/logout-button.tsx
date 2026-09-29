"use client";

import { useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";

export function LogoutButton({ className = "" }: { className?: string }) {
  const { logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    try {
      await logout();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      id="logout-button"
      className={`inline-flex items-center justify-center gap-2 rounded border border-danger/40 bg-danger/5 px-[14px] py-[8px] font-label-caps text-[11px] tracking-widest uppercase text-danger transition-all hover:bg-danger/15 hover:border-danger/80 hover:shadow-[0_0_15px_rgba(248,113,113,0.25)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={isSubmitting}
      onClick={() => void handleLogout()}
      type="button"
      title="Terminate Session / Disconnect Node"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
        <line x1="12" y1="2" x2="12" y2="12" />
      </svg>
      <span>{isSubmitting ? "DISCONNECTING..." : "DISCONNECT"}</span>
    </button>
  );
}
