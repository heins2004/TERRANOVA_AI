"use client";

import React, { useEffect, useRef, useState } from "react";
import { AuthUser } from "@/lib/auth";
import {
  FINAL_FRAME_SRC,
  INTRO_PLAY_MODE,
  INTRO_SRC_DESKTOP,
  INTRO_SRC_MOBILE,
  POSTER_SRC,
  REVEAL_AT_SECONDS,
  WATERMARK_SRC,
} from "@/components/landing/intro-config";
import { HomeView } from "./HomeView";

type IntroState =
  | "loading"
  | "playing"
  | "revealed"
  | "autoplay-blocked"
  | "reduced-motion"
  | "error"
  | "already-seen";

type IntroStageProps = {
  user: AuthUser | null;
};

export function IntroStage({ user }: IntroStageProps) {
  const [state, setState] = useState<IntroState>("loading");
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [hasClickedPlayIntro, setHasClickedPlayIntro] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const revealedRef = useRef(false);
  const hasEndedRef = useRef(false);

  // 1. Check session storage, reduced motion, and select video source on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check session play mode
    if (INTRO_PLAY_MODE === "session") {
      const alreadySeen = sessionStorage.getItem("terranova_intro_seen");
      if (alreadySeen === "true") {
        revealedRef.current = true;
        setState("already-seen");
        return;
      }
    }

    // Check prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotionQuery.matches) {
      revealedRef.current = true;
      setState("reduced-motion");
      return;
    }

    // Responsive video source selection
    const mobileQuery = window.matchMedia("(max-width: 768px), (orientation: portrait)");
    const selectedSrc = mobileQuery.matches ? INTRO_SRC_MOBILE : INTRO_SRC_DESKTOP;
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
          revealedRef.current = true;
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
        try {
          sessionStorage.setItem("terranova_intro_seen", "true");
        } catch {}
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
      try {
        sessionStorage.setItem("terranova_intro_seen", "true");
      } catch {}
    }
  };

  const handleError = () => {
    revealedRef.current = true;
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

  // State derivations
  const isIntroSkippedOrSeen =
    state === "already-seen" || state === "reduced-motion";

  const isAutoplayBlockedInitial =
    state === "autoplay-blocked" && !hasClickedPlayIntro;

  const isRevealed =
    state === "revealed" ||
    isAutoplayBlockedInitial ||
    state === "reduced-motion" ||
    state === "already-seen" ||
    state === "error";

  const isInstant =
    state === "already-seen" ||
    state === "reduced-motion" ||
    isAutoplayBlockedInitial ||
    state === "error";

  const showFinalFrameStill =
    state === "error" ||
    (state === "autoplay-blocked" && !hasClickedPlayIntro);

  // Play intro button is shown ONLY for guests while autoplay is blocked
  const showPlayIntro = isAutoplayBlockedInitial && !user;

  // Stagger transition helper
  const getStaggerStyle = (delayMs: number, durationMs: number = 450): React.CSSProperties => {
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
      data-testid="intro-home-container"
      data-state={state}
      className="relative min-h-screen w-full bg-[#0a0e17] overflow-x-hidden"
    >
      {/* 1. Background Video / Still Layer (Only rendered when intro plays or still frame needed) */}
      {!isIntroSkippedOrSeen && (
        <div className="fixed inset-0 h-full w-full pointer-events-none z-0 [transform:translateZ(0)]">
          {videoSrc && (
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
              className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none z-10"
            />
          )}

          {/* Watermark slot */}
          {WATERMARK_SRC && (
            <div
              data-slot="video-watermark"
              aria-hidden="true"
              className="pointer-events-none absolute top-[24px] left-[24px] z-10"
            >
              <img src={WATERMARK_SRC} alt="" className="h-8 w-auto opacity-70" />
            </div>
          )}
        </div>
      )}

      {/* 2. Unified HomeView content (with navy scrim over video when intro played, or HUD background) */}
      <div
        className={`relative z-10 w-full transition-opacity duration-500 ${
          isRevealed ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <HomeView
          user={user}
          isRevealed={isRevealed}
          isInstant={isInstant}
          getStaggerStyle={getStaggerStyle}
          showPlayIntro={showPlayIntro}
          onPlayIntro={handlePlayIntroClick}
          hasIntroPlayed={!isIntroSkippedOrSeen}
        />
      </div>
    </div>
  );
}
