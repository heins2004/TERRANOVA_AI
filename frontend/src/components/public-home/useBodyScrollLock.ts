"use client";

import { useEffect, RefObject } from "react";

export function useBodyScrollLock(
  dialogRef: RefObject<HTMLDivElement | null>,
  isClosing: boolean
) {
  useEffect(() => {
    if (isClosing) return;

    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlScrollbarGutter = html.style.scrollbarGutter;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;

    // Page behind must not show its own scrollbar and not shift: scrollbar-gutter stable + overflow hidden
    html.style.overflow = "hidden";
    html.style.scrollbarGutter = "stable";
    body.style.overflow = "hidden";

    const handleNativeWheel = (e: WheelEvent) => {
      let el = e.target as HTMLElement | null;
      let canScroll = false;
      while (el && el !== dialogRef.current) {
        const style = window.getComputedStyle(el);
        if (
          (style.overflowY === "auto" || style.overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight
        ) {
          const canScrollDown =
            e.deltaY > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1;
          const canScrollUp = e.deltaY < 0 && el.scrollTop > 1;
          if (canScrollDown || canScrollUp) {
            canScroll = true;
            break;
          }
        }
        el = el.parentElement;
      }
      if (!canScroll) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", handleNativeWheel, { passive: false });

    return () => {
      html.style.overflow = prevHtmlOverflow;
      html.style.scrollbarGutter = prevHtmlScrollbarGutter;
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPaddingRight;
      window.removeEventListener("wheel", handleNativeWheel);
    };
  }, [dialogRef, isClosing]);
}

