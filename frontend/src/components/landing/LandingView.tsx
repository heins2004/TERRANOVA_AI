"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { HudCornerBrackets } from "@/components/hud/Hud";
import {
  FINAL_FRAME_SRC,
  INTRO_SRC_DESKTOP,
  INTRO_SRC_MOBILE,
  POSTER_SRC,
  REVEAL_AT_SECONDS,
  WATERMARK_SRC,
} from "./intro-config";

type IntroState =
  | "loading"
  | "playing"
  | "revealed"
  | "autoplay-blocked"
  | "reduced-motion"
  | "error";

interface OptionCard {
  id: string;
  title: string;
  description: string;
  status: "Live" | "Coming soon";
}

const OPTION_CARDS: OptionCard[] = [
  {
    id: "site-analysis",
    title: "Site analysis",
    description: "Score candidate sites against roads, hospitals and schools.",
    status: "Live",
  },
  {
    id: "zoning-studio",
    title: "Zoning studio",
    description: "Draw study areas and shape land use before anything is built.",
    status: "Coming soon",
  },
  {
    id: "growth-simulation",
    title: "Growth simulation",
    description: "Test traffic and population scenarios before you commit.",
    status: "Coming soon",
  },
  {
    id: "project-library",
    title: "Project library",
    description: "Every plan, document and consultation in one place.",
    status: "Live",
  },
];

export function LandingView() {
  const [state, setState] = useState<IntroState>("loading");
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [hasClickedPlayIntro, setHasClickedPlayIntro] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const revealedRef = useRef(false);
  const hasEndedRef = useRef(false);

  // 1. Media query source selection and reduced motion check (once on mount)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    if (reducedMotionQuery.matches) {
      setState("reduced-motion");
      return;
    }

    const mobileQuery = window.matchMedia(
      "(max-width: 768px), (orientation: portrait)"
    );
    const selectedSrc = mobileQuery.matches
      ? INTRO_SRC_MOBILE
      : INTRO_SRC_DESKTOP;
    setVideoSrc(selectedSrc);
  }, []);

  // 2. Autoplay attempt once videoSrc is assigned
  useEffect(() => {
    if (!videoSrc) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setState((prev) => (prev === "loading" ? "playing" : prev));
        })
        .catch((err) => {
          console.warn("Autoplay blocked or failed:", err);
          setState("autoplay-blocked");
        });
    }
  }, [videoSrc]);

  // 3. Time detection for reveal at REVEAL_AT_SECONDS (8s)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    let rVFCId: number | null = null;
    let isCancelled = false;

    const checkTime = (currentTime: number) => {
      if (!revealedRef.current && currentTime >= REVEAL_AT_SECONDS) {
        revealedRef.current = true;
        setState("revealed");
      }
    };

    const onFrame = () => {
      if (isCancelled || !videoRef.current) return;
      checkTime(videoRef.current.currentTime);
      if (
        "requestVideoFrameCallback" in HTMLVideoElement.prototype &&
        !hasEndedRef.current
      ) {
        rVFCId = (videoRef.current as any).requestVideoFrameCallback(onFrame);
      }
    };

    if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
      rVFCId = (videoRef.current as any).requestVideoFrameCallback(onFrame);
    }

    const handleTimeUpdate = () => {
      checkTime(video.currentTime);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      isCancelled = true;
      if (
        rVFCId !== null &&
        "cancelVideoFrameCallback" in HTMLVideoElement.prototype
      ) {
        (video as any).cancelVideoFrameCallback(rVFCId);
      }
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [videoSrc]);

  // 4. Resume playback on tab visibility change (never pause intentionally)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const video = videoRef.current;
      if (
        document.visibilityState === "visible" &&
        video &&
        !hasEndedRef.current &&
        !video.ended &&
        (state === "playing" || state === "revealed")
      ) {
        video.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state]);

  const handleEnded = () => {
    hasEndedRef.current = true;
    if (!revealedRef.current) {
      revealedRef.current = true;
      setState("revealed");
    }
  };

  const handleError = () => {
    setState("error");
  };

  const handlePause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (
      !hasEndedRef.current &&
      !video.ended &&
      (state === "playing" || state === "revealed")
    ) {
      video.play().catch(() => {});
    }
  };

  const handlePlayIntroClick = () => {
    setHasClickedPlayIntro(true);
    revealedRef.current = false;
    hasEndedRef.current = false;
    setState("playing");
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.muted = true;
      video.play().catch((err) => {
        console.error("Play error on user click:", err);
      });
    }
  };

  const isRevealed =
    state === "revealed" ||
    (state === "autoplay-blocked" && !hasClickedPlayIntro) ||
    state === "reduced-motion" ||
    state === "error";

  const isInstant =
    state === "reduced-motion" ||
    (state === "autoplay-blocked" && !hasClickedPlayIntro) ||
    state === "error";

  const showFinalFrameStill =
    state === "reduced-motion" ||
    state === "error" ||
    (state === "autoplay-blocked" && !hasClickedPlayIntro);

  // Stagger transition style generator
  const getStaggerStyle = (delayMs: number, durationMs: number = 450) => {
    if (isInstant) {
      return {
        opacity: isRevealed ? 1 : 0,
        transform: "none",
        transition: "none",
      };
    }
    return {
      opacity: isRevealed ? 1 : 0,
      transform: isRevealed ? "translateY(0)" : "translateY(14px)",
      transitionProperty: "opacity, transform",
      transitionDuration: `${durationMs}ms`,
      transitionDelay: isRevealed ? `${delayMs}ms` : "0ms",
      transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    };
  };

  return (
    <div
      data-testid="intro-landing-container"
      data-state={state}
      className="fixed inset-0 h-[100dvh] h-[100svh] w-screen overflow-hidden bg-[#0a0e17] font-sans text-white select-none"
    >
      {/* 1. Video Layer (Compositor isolated, pointer-events disabled) */}
      <div className="absolute inset-0 h-full w-full pointer-events-none [transform:translateZ(0)]">
        {videoSrc && !showFinalFrameStill && (
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            muted
            playsInline
            preload="auto"
            poster={POSTER_SRC}
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload noremoteplayback"
            className="h-full w-full object-cover object-center pointer-events-none"
            onEnded={handleEnded}
            onError={handleError}
            onPause={handlePause}
          />
        )}

        {showFinalFrameStill && (
          <img
            src={FINAL_FRAME_SRC}
            alt="Terranova AI city development aerial view"
            className="h-full w-full object-cover object-center pointer-events-none"
          />
        )}
      </div>

      {/* 2. Watermark Slot (aria-hidden, clean empty placeholder for later) */}
      <div
        data-slot="video-watermark"
        aria-hidden="true"
        className="pointer-events-none absolute top-[24px] left-[24px] z-20"
      >
        {/* WATERMARK_SRC = null; logo watermark can be added later */}
        {WATERMARK_SRC && (
          <img src={WATERMARK_SRC} alt="" className="h-8 w-auto opacity-70" />
        )}
      </div>

      {/* 3. Gradient Overlay Layer (navy #0a0e17 bottom, left, and top) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: `
            linear-gradient(to bottom, rgba(10, 14, 23, 0.70) 0%, transparent 16%),
            linear-gradient(to top, rgba(10, 14, 23, 0.85) 0%, rgba(10, 14, 23, 0.50) 25%, transparent 45%),
            linear-gradient(to right, rgba(10, 14, 23, 0.70) 0%, rgba(10, 14, 23, 0.35) 32%, transparent 55%)
          `,
          opacity: isRevealed ? 1 : 0,
          transition: isInstant
            ? "none"
            : "opacity 600ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      {/* 4. Autoplay-blocked Play Intro button */}
      {state === "autoplay-blocked" && !hasClickedPlayIntro && (
        <div className="absolute top-[54%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-auto">
          <button
            type="button"
            id="play-intro-btn"
            onClick={handlePlayIntroClick}
            className="inline-flex items-center gap-[8px] rounded-full border border-primary-container/80 bg-[#0a0e17]/85 px-[20px] py-[10px] font-label-caps text-[12px] tracking-widest text-primary-container uppercase shadow-[0_0_25px_rgba(34,211,238,0.3)] backdrop-blur-md transition-all hover:bg-primary-container/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <svg
              className="h-4 w-4 fill-current text-primary-container"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Play intro</span>
          </button>
        </div>
      )}

      {/* 5. Website Layer (in DOM from start, accessibility inert until revealed) */}
      <div
        inert={!isRevealed}
        className={`absolute inset-0 z-20 flex flex-col justify-between p-[16px] sm:p-[24px] lg:p-[40px] ${
          isRevealed ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Header */}
        <header
          style={getStaggerStyle(100, 500)}
          className="flex items-center justify-between border-b border-white/10 pb-[16px]"
        >
          {/* Brand mark + Name */}
          <div className="flex items-center gap-[12px]">
            <div className="flex h-9 w-9 items-center justify-center rounded border border-primary-container/40 bg-primary-container/10">
              <svg
                className="h-5 w-5 text-primary-container"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div>
              <p className="font-sans text-[17px] font-semibold tracking-tight text-white uppercase">
                TERRANOVA AI
              </p>
            </div>
          </div>

          {/* Nav Links: Platform, Projects, Access system (Single DOM copy) */}
          <nav className="flex items-center gap-[12px] sm:gap-[20px]">
            <a
              href="#platform"
              className="hidden sm:inline-flex font-label-caps text-[12px] tracking-widest text-on-surface-variant hover:text-white uppercase transition-colors"
            >
              Platform
            </a>
            <Link
              href="/projects"
              className="hidden sm:inline-flex font-label-caps text-[12px] tracking-widest text-on-surface-variant hover:text-white uppercase transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded border border-primary-container/60 bg-primary-container/10 px-[16px] py-[8px] font-label-caps text-[11px] tracking-widest text-primary-container hover:bg-primary-container/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] uppercase transition-all"
            >
              Access system
            </Link>
          </nav>
        </header>

        {/* Hero Panel (Desktop left/upper-middle, Mobile top) */}
        <section className="my-auto max-w-[480px] pt-[8px] pb-[16px] sm:pt-[16px]">
          <div
            style={getStaggerStyle(200, 500)}
            className="relative rounded-xl border border-white/10 bg-white/5 p-[24px] sm:p-[32px] shadow-2xl backdrop-blur-[25px]"
          >
            <HudCornerBrackets variant="all" />

            <h1
              style={getStaggerStyle(300, 450)}
              className="font-sans text-[28px] sm:text-[34px] lg:text-[38px] font-semibold leading-[1.14] tracking-tight text-white"
            >
              Plan the city before it exists.
            </h1>

            <p
              style={getStaggerStyle(400, 450)}
              className="mt-[14px] sm:mt-[16px] font-sans text-[13px] sm:text-[14px] leading-[1.6] text-muted-foreground"
            >
              TERRANOVA AI turns an empty plot into zoning, traffic and growth
              scenarios in minutes.
            </p>

            <div style={getStaggerStyle(500, 450)} className="mt-[20px] sm:mt-[24px]">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-[8px] rounded border border-primary-container/80 bg-primary-container/15 px-[24px] py-[12px] font-label-caps text-[12px] tracking-widest text-primary-container uppercase transition-all duration-300 hover:bg-primary-container/25 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)] active:scale-95"
              >
                <span>Start a plan</span>
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Four Option Cards Section (Non-clickable info tiles, no buttons/links) */}
        <div
          id="platform"
          className="w-full max-w-7xl mx-auto pt-[8px] pb-[calc(env(safe-area-inset-bottom)+4px)]"
        >
          {/* Mobile: 1 horizontally scrollable row; Desktop: compact 4-column row */}
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-[12px] overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory pb-[4px] scrollbar-none">
            {OPTION_CARDS.map((card, index) => {
              const cardDelay = 600 + index * 70;
              return (
                <div
                  key={card.id}
                  style={getStaggerStyle(cardDelay, 450)}
                  className="relative flex-shrink-0 w-[240px] sm:w-auto h-[96px] lg:h-[110px] snap-center rounded-lg border border-white/10 bg-white/5 p-[14px] backdrop-blur-[25px] flex flex-col justify-between"
                >
                  <HudCornerBrackets variant="diagonal" />

                  <div className="flex items-center justify-between gap-[8px]">
                    <p className="font-sans text-[13px] lg:text-[14px] font-semibold text-white tracking-tight">
                      {card.title}
                    </p>
                    <span
                      className={`font-data-mono text-[9px] uppercase tracking-wider px-[6px] py-[2px] rounded border ${
                        card.status === "Live"
                          ? "border-primary-container/50 bg-primary-container/10 text-primary-container"
                          : "border-white/15 bg-white/5 text-muted-foreground"
                      }`}
                    >
                      {card.status}
                    </span>
                  </div>

                  <p className="font-sans text-[11px] lg:text-[12px] leading-[1.35] text-muted-foreground line-clamp-2">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
