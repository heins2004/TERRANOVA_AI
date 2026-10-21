"use client";

import { useEffect, RefObject } from "react";

export function useBodyScrollLock(dialogRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflowY = document.documentElement.style.overflowY;

    document.documentElement.style.overflowY = "scroll";
    document.body.style.overflow = "hidden";

    const handleNativeWheel = (e: WheelEvent) => {
      let el = e.target as HTMLElement | null;
      let canScroll = false;
      while (el && el !== dialogRef.current) {
        const style = window.getComputedStyle(el);
        if ((style.overflowY === "auto" || style.overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
          const canScrollDown = e.deltaY > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1;
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
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflowY = prevHtmlOverflowY;
      window.removeEventListener("wheel", handleNativeWheel);
    };
  }, [dialogRef]);
}
