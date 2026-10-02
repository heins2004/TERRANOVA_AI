"use client";

import React, { useEffect, useRef, useState } from "react";
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

    // Setting property directly as React does not reliably render muted attribute
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

  const showFinalFrameStill =
    state === "reduced-motion" ||
    state === "error" ||
    (state === "autoplay-blocked" && !hasClickedPlayIntro);

  return (
    <div
      data-testid="intro-landing-container"
      data-state={state}
      className="fixed inset-0 h-[100dvh] h-[100svh] w-screen overflow-hidden bg-[#0a0e17]"
    >
      {/* Video Layer (Compositor isolated, pointer-events disabled) */}
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
            alt="Terranova AI city development"
            className="h-full w-full object-cover object-center pointer-events-none"
          />
        )}
      </div>

      {/* Watermark Slot (aria-hidden, clean empty placeholder for later) */}
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

      {/* Autoplay-blocked Play Intro button */}
      {state === "autoplay-blocked" && !hasClickedPlayIntro && (
        <div className="absolute top-[54%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto">
          <button
            type="button"
            id="play-intro-btn"
            onClick={handlePlayIntroClick}
            className="inline-flex items-center gap-2 rounded-full border border-primary-container/80 bg-[#0a0e17]/85 px-[20px] py-[10px] font-label-caps text-[12px] tracking-widest text-primary uppercase shadow-[0_0_25px_rgba(34,211,238,0.3)] backdrop-blur-md transition-all hover:bg-primary-container/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <svg
              className="h-4 w-4 fill-current text-primary"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Play intro</span>
          </button>
        </div>
      )}
    </div>
  );
}
