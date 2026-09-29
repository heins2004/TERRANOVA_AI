"use client";

import Link from "next/link";
import React, { ElementType, ReactNode } from "react";

/**
 * Ambient background matching the login page's visual identity:
 * - Radial cyan/violet glow spots
 * - Subtle 26px white dot matrix grid
 * - Deep navy/black surface-container-lowest (#0a0e17)
 * - Top and bottom edge vignettes
 */
export function HudBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-surface-container-lowest">
      {/* Cyan & Violet ambient glow */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(34,211,238,0.12), transparent 55%), radial-gradient(circle at 75% 70%, rgba(139,124,246,0.10), transparent 50%)",
        }}
      />
      {/* 26px Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      {/* Edge gradient vignettes */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-surface-container-lowest to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface-container-lowest to-transparent" />
    </div>
  );
}

/**
 * Screen corner technical status readouts matching the login page
 */
export function HudCornerReadouts({
  topLeft = "SYS.INIT.SEQ // V.4.2.1",
  topRight = "NET_ID: TERRA-NOVA-99",
  bottomLeft = "SYSTEM STATUS: STABLE",
  bottomRight = "ENCRYPTION: AES-256",
}: {
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomLeft?: ReactNode;
  bottomRight?: ReactNode;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 hidden sm:block">
      {topLeft && (
        <div className="absolute top-[16px] left-[24px] font-data-mono text-[10px] uppercase tracking-widest text-primary-container opacity-80">
          {topLeft}
        </div>
      )}
      {topRight && (
        <div className="absolute top-[16px] right-[24px] font-data-mono text-[10px] uppercase tracking-widest text-secondary opacity-80">
          {topRight}
        </div>
      )}
      {bottomLeft && (
        <div className="absolute bottom-[16px] left-[24px] font-data-mono text-[10px] uppercase tracking-widest text-primary-container opacity-80">
          {bottomLeft}
        </div>
      )}
      {bottomRight && (
        <div className="absolute bottom-[16px] right-[24px] font-data-mono text-[10px] uppercase tracking-widest text-secondary opacity-80">
          {bottomRight}
        </div>
      )}
    </div>
  );
}

/**
 * Corner bracket decorations extracted from the login page
 */
export function HudCornerBrackets({
  variant = "diagonal",
}: {
  variant?: "diagonal" | "all";
}) {
  return (
    <>
      <div className="pointer-events-none absolute top-0 left-0 h-4 w-4 border-t border-l border-primary-container opacity-50" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-4 w-4 border-r border-b border-primary-container opacity-50" />
      {variant === "all" && (
        <>
          <div className="pointer-events-none absolute top-0 right-0 h-4 w-4 border-t border-r border-primary-container opacity-50" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b border-l border-primary-container opacity-50" />
        </>
      )}
    </>
  );
}

/**
 * Standard HUD Panel container with corner brackets, glass backdrop, and subtle border
 */
export function HudPanel({
  children,
  className = "",
  brackets = "diagonal",
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  brackets?: "diagonal" | "all" | "none";
  as?: ElementType;
}) {
  return (
    <Component
      className={`relative rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-[25px] ${className}`}
    >
      {brackets !== "none" && <HudCornerBrackets variant={brackets} />}
      {children}
    </Component>
  );
}

/**
 * Monospace HUD status line with technical label and value
 */
export function HudStatusLine({
  label,
  value,
  accent = false,
  statusDot = false,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
  statusDot?: boolean;
}) {
  return (
    <div className="flex items-center justify-between font-data-mono text-[11px] uppercase tracking-wider">
      <span className="text-on-surface-variant flex items-center gap-2">
        {statusDot && (
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary-container" />
        )}
        {label}
      </span>
      <span
        className={`font-semibold ${accent ? "text-primary" : "text-on-surface"}`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Interactive button or link matching the login page's "ACCESS SYSTEM" button style
 */
export function HudButton({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  fullWidth = false,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}) {
  const sizeStyles = {
    sm: "px-[16px] py-[8px] text-[10px]",
    md: "px-[24px] py-[12px] text-label-caps",
    lg: "px-[32px] py-[16px] text-[13px]",
  }[size];

  const variantStyles = {
    primary:
      "border-primary-container/60 text-primary hover:bg-primary-container/15 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]",
    secondary:
      "border-white/15 text-on-surface-variant hover:border-primary-container/60 hover:text-primary hover:bg-white/5",
    danger:
      "border-danger/60 text-danger hover:bg-danger/15 hover:shadow-[0_0_20px_rgba(248,113,113,0.3)]",
    ghost:
      "border-transparent text-on-surface-variant hover:text-primary hover:bg-white/5",
  }[variant];

  const baseStyles = `inline-flex items-center justify-center gap-2 rounded border font-label-caps tracking-widest uppercase transition-all disabled:cursor-not-allowed disabled:opacity-50 ${fullWidth ? "w-full" : ""} ${sizeStyles} ${variantStyles} ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseStyles}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseStyles}
    >
      {children}
    </button>
  );
}

/**
 * Metric card for the HUD dashboard
 */
export function HudMetricTile({
  label,
  value,
  subLabel,
  href,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  subLabel?: string;
  href?: string;
  accent?: boolean;
}) {
  const content = (
    <HudPanel
      brackets="diagonal"
      className={`p-[20px] transition-all duration-300 ${href ? "hover:border-primary-container/50 hover:bg-white/[0.08]" : ""}`}
    >
      <div className="flex items-center justify-between">
        <p className="font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        {accent && (
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary-container" />
        )}
      </div>
      <p
        className={`mt-[12px] font-display-md text-[32px] font-semibold tracking-tight ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
      {subLabel && (
        <p className="mt-[6px] font-data-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {subLabel}
        </p>
      )}
    </HudPanel>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full">
        {content}
      </Link>
    );
  }

  return content;
}
