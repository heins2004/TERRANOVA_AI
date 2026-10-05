"use client";

import React, { useEffect, useRef } from "react";

// Particle Cloak Specification Constants
const ALPHA_SCALE = 0.5;
const SPRING_K = 0.024;
const DAMPING = 0.86;
const REPULSION_STRENGTH = 3.4;
const HOME_FALLOFF = 70;
const BASE_ALPHA = 0.72;
const LERP_FACTOR = 0.16;
const RADIUS_R_FACTOR = 0.34;
const RADIUS_MIN = 1.0;
const RADIUS_MAX = 2.6;
const COLOR_RGB = "34,211,238";

interface Particle {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export function ParticleCloak() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;

    // Pointer state
    let hasPointerEntered = false;
    let targetX = -9999;
    let targetY = -9999;
    let easedX = -9999;
    let easedY = -9999;

    const isTouchDevice = () =>
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(pointer: coarse)").matches;

    const isReducedMotion = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const buildGrid = (w: number, h: number) => {
      width = w;
      height = h;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      let step = Math.max(9, Math.min(w, h) / 22);
      while (Math.ceil(w / step) * Math.ceil(h / step) > 4000) {
        step += 1;
      }

      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const offsetX = (w - (cols - 1) * step) / 2;
      const offsetY = (h - (rows - 1) * step) / 2;

      particles = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const homeX = offsetX + c * step;
          const homeY = offsetY + r * step;
          particles.push({
            homeX,
            homeY,
            x: homeX,
            y: homeY,
            vx: 0,
            vy: 0,
            radius: RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN),
          });
        }
      }

      (canvas as unknown as { __particleCount: number }).__particleCount =
        particles.length;

      // Initialize drift position if not yet entered
      if (!hasPointerEntered) {
        const t = performance.now() * 0.0008;
        targetX = w * (0.5 + 0.35 * Math.sin(t * 1.3 + 0.5));
        targetY = h * (0.5 + 0.35 * Math.sin(t * 1.7));
        easedX = targetX;
        easedY = targetY;
      }

      // If prefers-reduced-motion: reduce, draw once and stop
      if (isReducedMotion()) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const alpha = BASE_ALPHA * ALPHA_SCALE;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          ctx.beginPath();
          ctx.arc(p.homeX, p.homeY, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${COLOR_RGB},${alpha})`;
          ctx.fill();
        }
      }
    };

    const render = () => {
      animationFrameId = null;

      if (!ctx || isReducedMotion()) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Handle pointer target
      if (isTouchDevice() || !hasPointerEntered) {
        const t = performance.now() * 0.0008;
        targetX = width * (0.5 + 0.35 * Math.sin(t * 1.3 + 0.5));
        targetY = height * (0.5 + 0.35 * Math.sin(t * 1.7));
      }

      // Ease pointer with lerp 0.16
      easedX += (targetX - easedX) * LERP_FACTOR;
      easedY += (targetY - easedY) * LERP_FACTOR;

      const R = RADIUS_R_FACTOR * Math.min(width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Distance from eased pointer
        const dxP = p.x - easedX;
        const dyP = p.y - easedY;
        const d = Math.hypot(dxP, dyP);

        if (d < R) {
          const f = Math.pow(1 - d / R, 2) * REPULSION_STRENGTH;
          const dist = d || 1;
          p.vx += (dxP / dist) * f;
          p.vy += (dyP / dist) * f;
        }

        // Elastic return and damping: v += (home - pos) * 0.024; v *= 0.86; pos += v
        p.vx += (p.homeX - p.x) * SPRING_K;
        p.vx *= DAMPING;
        p.x += p.vx;

        p.vy += (p.homeY - p.y) * SPRING_K;
        p.vy *= DAMPING;
        p.y += p.vy;

        // Alpha calculation: max(0, 0.72 - distanceFromHome / 70) * ALPHA_SCALE
        const dxH = p.x - p.homeX;
        const dyH = p.y - p.homeY;
        const distanceFromHome = Math.hypot(dxH, dyH);
        const alpha =
          Math.max(0, BASE_ALPHA - distanceFromHome / HOME_FALLOFF) * ALPHA_SCALE;

        if (alpha > 0.001) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${COLOR_RGB},${alpha})`;
          ctx.fill();
        }
      }

      if (!document.hidden && !isReducedMotion()) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const startAnimation = () => {
      if (isReducedMotion()) return;
      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // Event listeners
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || isTouchDevice()) return;
      hasPointerEntered = true;
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const handlePointerLeave = () => {
      if (hasPointerEntered && !isTouchDevice()) {
        targetX = -9999;
        targetY = -9999;
      }
    };

    const handleBlur = () => {
      if (hasPointerEntered && !isTouchDevice()) {
        targetX = -9999;
        targetY = -9999;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      } else {
        startAnimation();
      }
    };

    // Initial build
    buildGrid(window.innerWidth, window.innerHeight);
    startAnimation();

    // Listeners on window & document
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Resize handling with ResizeObserver and window resize fallback
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect;
          if (w > 0 && h > 0 && (w !== width || h !== height)) {
            buildGrid(w, h);
          }
        }
      });
      resizeObserver.observe(document.documentElement);
    }

    const handleWindowResize = () => {
      if (window.innerWidth !== width || window.innerHeight !== height) {
        buildGrid(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener("resize", handleWindowResize);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleWindowResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
