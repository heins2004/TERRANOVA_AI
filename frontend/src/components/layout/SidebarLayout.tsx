"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";

export type SidebarItem = {
  key: string;
  label: string;
  icon?: string;
  href?: string;
};

type SidebarLayoutProps = {
  items: SidebarItem[];
  activeKey: string;
  children: React.ReactNode;
  basePath?: string;
};

export function SidebarLayout({
  items,
  activeKey,
  children,
  basePath = "/admin",
}: SidebarLayoutProps) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLAnchorElement | null>(null);

  // Scroll active tab into view in horizontal strip on mobile
  useEffect(() => {
    const strip = stripRef.current;
    const tab = activeTabRef.current;
    if (!strip || !tab) return;

    const stripRect = strip.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();

    if (tabRect.right > stripRect.right) {
      strip.scrollLeft += tabRect.right - stripRect.right + 12;
    } else if (tabRect.left < stripRect.left) {
      strip.scrollLeft += tabRect.left - stripRect.left - 12;
    }
  }, [activeKey]);

  return (
    <div className="w-full max-w-full">
      {/* Mobile Horizontal Tab Strip (< 768px / md) */}
      <div className="block md:hidden mb-6">
        <div
          ref={stripRef}
          id="admin-tab-strip"
          className="flex items-center gap-[8px] overflow-x-auto whitespace-nowrap scrollbar-none pb-[8px] border-b border-white/10"
        >
          {items.map((item) => {
            const isActive = item.key === activeKey;
            const href = item.href ?? `${basePath}?section=${item.key}`;
            return (
              <Link
                key={item.key}
                ref={isActive ? activeTabRef : undefined}
                href={href}
                id={`admin-tab-${item.key}`}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-[8px] px-[14px] py-[8px] rounded-full text-[13px] font-data-mono font-medium shrink-0 transition-all ${
                  isActive
                    ? "border border-primary-container/80 bg-primary-container/20 text-primary-container shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                    : "border border-white/10 bg-white/5 text-on-surface-variant hover:text-on-surface hover:border-white/20"
                }`}
              >
                {item.icon && (
                  <span className="material-symbols-outlined text-[16px]">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop Layout (>= 768px / md): Sticky Left Sidebar + Content */}
      <div className="flex flex-col md:flex-row md:items-start gap-8">
        <aside
          id="admin-sidebar"
          className="hidden md:block w-60 lg:w-64 shrink-0 sticky top-[88px] self-start"
        >
          <div className="glass-card rounded-[20px] p-[16px] border border-white/10 bg-surface-container-lowest/80 backdrop-blur-[20px]">
            <p className="px-[12px] pt-[4px] pb-[12px] font-data-mono text-[10px] font-semibold tracking-widest text-primary uppercase border-b border-white/5">
              Navigation
            </p>
            <nav className="mt-[12px] flex flex-col gap-[4px]">
              {items.map((item) => {
                const isActive = item.key === activeKey;
                const href = item.href ?? `${basePath}?section=${item.key}`;
                return (
                  <Link
                    key={item.key}
                    href={href}
                    id={`admin-nav-${item.key}`}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-[12px] px-[14px] py-[10px] rounded-[10px] text-[13px] font-body-md transition-all cursor-pointer ${
                      isActive
                        ? "border border-primary-container/60 bg-primary-container/15 text-primary-container font-semibold shadow-[0_0_16px_rgba(34,211,238,0.2)]"
                        : "border border-transparent text-on-surface-variant hover:text-on-surface hover:bg-white/5"
                    }`}
                  >
                    {item.icon && (
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          isActive
                            ? "text-primary-container"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Section Content Area */}
        <section className="flex-1 min-w-0">{children}</section>
      </div>
    </div>
  );
}
