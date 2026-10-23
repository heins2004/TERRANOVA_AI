"use client";

import { useState, useCallback } from "react";

interface CopyButtonProps {
  text: string | number;
  label?: string;
  className?: string;
}

export function CopyButton({
  text,
  label = "Copy ID",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(String(text));
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = String(text);
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch {
        // Fallback or ignore clipboard rejection
      }
    },
    [text]
  );

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      title={copied ? "Copied" : label}
      className={`inline-flex items-center justify-center gap-1 rounded border px-1.5 py-0.5 font-data-mono text-[10px] uppercase tracking-wider transition-colors focus:outline-none ${
        copied
          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
          : "border-white/10 bg-white/5 text-on-surface-variant hover:border-white/30 hover:bg-white/10 hover:text-white"
      } ${className}`}
    >
      {copied ? (
        <>
          <svg
            className="h-3 w-3 text-emerald-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Copied</span>
        </>
      ) : (
        <>
          <svg
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
