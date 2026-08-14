"use client";

import { useState } from "react";

import { useAuth } from "@/components/layout/auth-provider";

export function LogoutButton() {
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
      className="rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70"
      disabled={isSubmitting}
      onClick={() => void handleLogout()}
      type="button"
    >
      {isSubmitting ? "Logging out..." : "Logout"}
    </button>
  );
}
