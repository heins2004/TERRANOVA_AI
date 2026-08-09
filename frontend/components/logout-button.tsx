"use client";

import { useAuth } from "@/components/auth-provider";

export function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      className="rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
      onClick={logout}
      type="button"
    >
      Logout
    </button>
  );
}
