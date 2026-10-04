"use client";

import React, { useEffect, useRef } from "react";

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const STAR_COUNT = 240;
    const MAX_DEPTH = 1000;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrameId: number;

    type Star = { x: number; y: number; z: number };

    function createStar(initialSpread = false): Star {
      return {
        x: (Math.random() - 0.5) * 2 * width,
        y: (Math.random() - 0.5) * 2 * height,
        z: initialSpread ? Math.random() * MAX_DEPTH : MAX_DEPTH,
      };
    }

    let stars: Star[] = Array.from({ length: STAR_COUNT }, () =>
      createStar(true)
    );

    function resizeCanvas() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const previousZ = star.z;

        if (!prefersReducedMotion) {
          star.z -= 1.1;
        }

        if (star.z <= 1) {
          stars[i] = createStar(false);
          continue;
        }

        const scale = 500 / star.z;
        const x = width / 2 + star.x * scale * 0.5;
        const y = height / 2 + star.y * scale * 0.5;

        const previousScale = 500 / previousZ;
        const alpha = Math.min(1, (1 - star.z / MAX_DEPTH) * 1.4 + 0.1);

        if (x < -20 || x > width + 20 || y < -20 || y > height + 20) {
          stars[i] = createStar(false);
          continue;
        }

        // Streak line
        ctx.strokeStyle = `rgba(186, 230, 253, ${alpha * 0.45})`;
        ctx.beginPath();
        ctx.moveTo(
          width / 2 + star.x * previousScale * 0.5,
          height / 2 + star.y * previousScale * 0.5
        );
        ctx.lineTo(x, y);
        ctx.stroke();

        // Star dot
        ctx.fillStyle = `rgba(224, 242, 254, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.4, (1 - star.z / MAX_DEPTH) * 2), 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReducedMotion && document.visibilityState !== "hidden") {
        animationFrameId = requestAnimationFrame(draw);
      }
    }

    draw();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        if (!prefersReducedMotion) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = requestAnimationFrame(draw);
        }
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* Cyan & Blue background atmospheric ambient glows (no violet, no hero-end, no secondary) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-[28vmax] -left-[18vmax] h-[60vmax] w-[60vmax] rounded-full opacity-40 blur-[100px]"
          style={{ background: "rgba(59, 130, 246, 0.45)" }}
        />
        <div
          className="absolute -right-[22vmax] -bottom-[34vmax] h-[60vmax] w-[60vmax] rounded-full opacity-40 blur-[100px]"
          style={{ background: "rgba(34, 211, 238, 0.45)" }}
        />
      </div>

      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
        aria-hidden="true"
      />
    </>
  );
}
