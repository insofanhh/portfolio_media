"use client";

import { useEffect } from "react";

const surfaces = ".site-header,.hero-slider-controls,.hero-floating,.button,.circle-button,.hero-play,.card-play,.play-button,.project-filters a,.scroll-information,.quality-selector,.project-tabs,.admin-topbar";

/** One delegated light source; no React renders, media filters, or animation loop. */
export function LiquidGlassLighting() {
  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedEffects = window.matchMedia("(prefers-reduced-motion: reduce), (prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active)");
    let active: HTMLElement | null = null;
    let bounds: DOMRect | null = null;
    let frame = 0;
    let x = 0, y = 0;
    function clear() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      active?.style.removeProperty("--glass-x");
      active?.style.removeProperty("--glass-y");
      active = null; bounds = null;
    }
    function move(event: PointerEvent) {
      if (!finePointer.matches || reducedEffects.matches || event.pointerType !== "mouse") return;
      const surface = event.target instanceof Element ? event.target.closest<HTMLElement>(surfaces) : null;
      if (surface !== active) { clear(); active = surface; }
      if (!active) return;
      bounds ??= active.getBoundingClientRect();
      x = Math.max(0, Math.min(100, (event.clientX - bounds.left) / Math.max(1, bounds.width) * 100));
      y = Math.max(0, Math.min(100, (event.clientY - bounds.top) / Math.max(1, bounds.height) * 100));
      if (!frame) frame = requestAnimationFrame(() => {
        active?.style.setProperty("--glass-x", `${x.toFixed(1)}%`);
        active?.style.setProperty("--glass-y", `${y.toFixed(1)}%`);
        frame = 0;
      });
    }
    function invalidate() { bounds = null; }
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", clear);
    document.addEventListener("scroll", invalidate, { passive: true, capture: true });
    window.addEventListener("resize", invalidate, { passive: true });
    reducedEffects.addEventListener("change", clear);
    finePointer.addEventListener("change", clear);
    return () => {
      clear();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", clear);
      document.removeEventListener("scroll", invalidate, true);
      window.removeEventListener("resize", invalidate);
      reducedEffects.removeEventListener("change", clear);
      finePointer.removeEventListener("change", clear);
    };
  }, []);
  return null;
}
