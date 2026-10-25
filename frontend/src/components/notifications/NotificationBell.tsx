"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/layout/auth-provider";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
} from "@/services/notifications";

function formatRelativeTime(dateString: string): string {
  try {
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000));
    if (diffSec < 60) return "just now";
    const min = Math.floor(diffSec / 60);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return "";
  }
}

export function NotificationBell({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const bellButtonRef = useRef<HTMLButtonElement | null>(null);
  const inFlightAbortRef = useRef<AbortController | null>(null);
  const isActionInFlightRef = useRef(false);

  const fetchLatestNotifications = useCallback(() => {
    if (!isAuthenticated || !user || user.must_change_password) return;
    if (inFlightAbortRef.current) inFlightAbortRef.current.abort();
    const ac = new AbortController();
    inFlightAbortRef.current = ac;

    getMyNotifications(20, 0, ac.signal)
      .then((data) => {
        setItems(data.items);
        setUnreadCount(data.unread_count);
      })
      .catch(() => {});
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isReady || !isAuthenticated || !user || user.must_change_password) {
      if (inFlightAbortRef.current) inFlightAbortRef.current.abort();
      queueMicrotask(() => {
        setItems([]);
        setUnreadCount(0);
        setIsOpen(false);
      });
      return;
    }

    fetchLatestNotifications();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchLatestNotifications();
    }, 60_000);

    const onVisible = () => {
      if (document.visibilityState === "visible") fetchLatestNotifications();
    };
    const onFocus = () => fetchLatestNotifications();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      if (inFlightAbortRef.current) inFlightAbortRef.current.abort();
    };
  }, [isReady, isAuthenticated, user, fetchLatestNotifications]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && bellButtonRef.current && !bellButtonRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { setIsOpen(false); bellButtonRef.current?.focus(); }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isReady || !isAuthenticated || !user) return null;

  const toggleDropdown = () => {
    if (!isOpen && bellButtonRef.current) {
      const rect = bellButtonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }
    setIsOpen((prev) => !prev);
  };

  async function handleItemClick(item: NotificationItem) {
    if (isActionInFlightRef.current) return;
    isActionInFlightRef.current = true;

    try {
      if (!item.is_read) {
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
        await markNotificationRead(item.id).catch(() => {});
      }
      setIsOpen(false);
      if (item.kind === "chat" && item.project_id) {
        router.push(`/chat?project=${item.project_id}`);
      } else if (!item.project_id) {
        router.push("/planner");
      } else if (item.project_link_kind === "gov") {
        router.push(`/gov/${item.project_id}`);
      } else if (item.project_link_kind === "planner") {
        router.push(`/planner/${item.project_id}`);
      } else {
        router.push(`/?project=${item.project_id}`);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("deep-link-project", { detail: item.project_id }));
        }
      }
    } finally {
      isActionInFlightRef.current = false;
    }
  }

  async function handleMarkAllRead() {
    if (isActionInFlightRef.current || unreadCount === 0) return;
    isActionInFlightRef.current = true;
    setIsMarkingAll(true);

    try {
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      await markAllNotificationsRead().catch(() => {});
    } finally {
      setIsMarkingAll(false);
      isActionInFlightRef.current = false;
    }
  }

  if (!isAuthenticated || !user || user.must_change_password) {
    return null;
  }

  const badgeText = unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={bellButtonRef}
        type="button"
        id="notification-bell-btn"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={toggleDropdown}
        className="relative flex h-[36px] w-[36px] items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-on-surface-variant transition-all hover:border-primary-container/60 hover:bg-white/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
      >
        <span className="material-symbols-outlined text-[19px]" aria-hidden="true">
          notifications
        </span>
        {badgeText && (
          <span
            id="notification-badge"
            className="absolute -top-[4px] -right-[4px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-[4px] font-data-mono text-[10px] font-bold text-surface-container-lowest shadow-[0_0_8px_rgba(34,211,238,0.5)]"
          >
            {badgeText}
          </span>
        )}
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          id="notification-dropdown"
          role="dialog"
          aria-label="Notifications panel"
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            right: `${coords.right}px`,
            zIndex: 9999,
          }}
          className="w-[320px] sm:w-[380px] rounded-[12px] border border-white/10 bg-surface-container-lowest p-[12px] shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-[8px] flex items-center justify-between border-b border-white/10 pb-[8px]">
            <div className="flex items-center gap-[6px]">
              <span className="font-display-md text-[13px] font-semibold text-on-surface uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-[6px] py-[1px] font-data-mono text-[10px] font-bold text-primary">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                id="notification-mark-all-btn"
                disabled={isMarkingAll}
                onClick={() => void handleMarkAllRead()}
                className="font-data-mono text-[11px] font-semibold text-primary transition-opacity hover:opacity-80 disabled:opacity-40 cursor-pointer"
              >
                {isMarkingAll ? "Marking..." : "Mark all read"}
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto space-y-[4px] pr-[2px]">
            {items.length === 0 ? (
              <div className="py-[32px] text-center">
                <span className="material-symbols-outlined text-[28px] text-on-surface-variant/40" aria-hidden="true">
                  notifications_paused
                </span>
                <p className="mt-[8px] font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                  No notifications yet
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => void handleItemClick(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      void handleItemClick(item);
                    }
                  }}
                  className={`group flex items-start gap-[10px] rounded-[8px] p-[10px] text-left transition-colors cursor-pointer ${
                    item.is_read
                      ? "bg-transparent hover:bg-white/[0.04]"
                      : "bg-white/[0.03] hover:bg-white/[0.06] border-l-2 border-primary"
                  }`}
                >
                  <div className="pt-[4px]">
                    {!item.is_read ? (
                      <span className="block h-[7px] w-[7px] rounded-full bg-primary shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                    ) : (
                      <span className="block h-[7px] w-[7px] rounded-full bg-white/10" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] leading-snug font-body-md ${item.is_read ? "text-on-surface-variant" : "text-on-surface font-medium"}`}>
                      {item.message}
                    </p>
                    <div className="mt-[4px] flex items-center justify-between">
                      <span className="font-data-mono text-[10px] text-on-surface-variant/70">
                        {formatRelativeTime(item.created_at)}
                      </span>
                      <span className="font-data-mono text-[9px] uppercase tracking-widest text-primary/80 opacity-0 transition-opacity group-hover:opacity-100">
                        View project →
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
