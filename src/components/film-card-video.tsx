"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import type HlsType from "hls.js";
import type { PublicMedia } from "@/lib/types";

type Connection = EventTarget & { saveData?: boolean };

/** Mounted only for the selected film. Sources stay unloaded until playback is needed. */
export function FilmCardVideo({ media, title }: { media: PublicMedia; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const controls = useRef<{ toggle: () => void } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [error, setError] = useState("");
  const hlsUrl = media.variants.find(variant => variant.kind === "HLS")?.url;
  const mp4Url = media.variants.find(variant => variant.kind === "VIDEO")?.url;

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    let engine: HlsType | null = null;
    let loading: Promise<void> | null = null;
    let alive = true;
    let visible = false;
    let enoughVisible = false;
    let userPaused = false;
    let manual = false;
    let failed = false;
    let usingMp4 = false;
    let attempt = 0;

    function allowed() {
      return alive && visible && !userPaused && !document.hidden && !document.querySelector("dialog[open]") &&
        (manual || (enoughVisible && !motion.matches && !connection?.saveData));
    }
    function pause() {
      attempt++;
      video!.pause();
    }
    function fail() {
      failed = true;
      pause();
      if (alive) setError("Chưa phát được video. Bấm Play để thử lại.");
    }
    function fallback() {
      if (!alive) return;
      if (!mp4Url || usingMp4) { fail(); return; }
      engine?.destroy(); engine = null;
      usingMp4 = true;
      video!.src = mp4Url;
      if (allowed()) void video!.play().catch(() => {});
    }
    async function load() {
      if (hlsUrl && video!.canPlayType("application/vnd.apple.mpegurl")) {
        video!.src = hlsUrl;
      } else if (hlsUrl) {
        const { default: Hls } = await import("hls.js");
        if (!alive) return;
        if (Hls.isSupported()) {
          engine = new Hls({ autoStartLoad: false, capLevelToPlayerSize: true, startLevel: 0, maxBufferLength: 6, maxMaxBufferLength: 10, backBufferLength: 0 });
          engine.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) fallback(); });
          engine.loadSource(hlsUrl);
          engine.attachMedia(video!);
        } else if (mp4Url) {
          usingMp4 = true;
          video!.src = mp4Url;
        } else throw new Error("Unsupported video");
      } else if (mp4Url) {
        usingMp4 = true;
        video!.src = mp4Url;
      } else throw new Error("Missing video source");
    }
    async function play() {
      if (!allowed() || failed) return;
      const request = ++attempt;
      try {
        loading ??= load();
        await loading;
        if (request !== attempt || !allowed()) return;
        engine?.startLoad();
        await video!.play();
        if (!allowed()) pause();
      } catch (reason) {
        // Autoplay denial keeps the Play button available for a real user gesture.
        if (!alive || request !== attempt) return;
        if (reason instanceof DOMException && (reason.name === "NotAllowedError" || reason.name === "AbortError")) return;
        fail();
      }
    }
    function sync() {
      if (allowed()) void play();
      else { pause(); engine?.stopLoad(); }
    }
    controls.current = { toggle() {
      if (!video.paused) { userPaused = true; sync(); return; }
      userPaused = false;
      manual = true;
      if (failed) {
        failed = false;
        engine?.destroy(); engine = null;
        loading = null;
        usingMp4 = false;
        video.removeAttribute("src");
        video.load();
      }
      setError("");
      void play();
    } };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio > 0;
      enoughVisible = entry.intersectionRatio >= .5;
      sync();
    }, { threshold: [0, .01, .5] });
    observer.observe(video);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    connection?.addEventListener("change", sync);
    // A modal also pauses this preview; closing it may resume eligible playback.
    const dialogs = new MutationObserver(sync);
    document.querySelectorAll("dialog").forEach(dialog => dialogs.observe(dialog, { attributes: true, attributeFilter: ["open"] }));
    video.addEventListener("error", fallback);
    return () => {
      alive = false;
      controls.current = null;
      observer.disconnect(); dialogs.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      connection?.removeEventListener("change", sync);
      video.removeEventListener("error", fallback);
      pause(); engine?.destroy();
      video.removeAttribute("src"); video.load();
    };
  }, [media.id, hlsUrl, mp4Url]);

  return <>
    <div className="film-card-preview" data-ready={ready} aria-hidden="true">
      <video ref={ref} muted={muted} playsInline loop preload="none" tabIndex={-1}
        style={{ objectPosition: `${media.focalX * 100}% ${media.focalY * 100}%` }}
        onPlaying={() => { setPlaying(true); setReady(true); setError(""); }} onPause={() => setPlaying(false)}
        onVolumeChange={event => setMuted(event.currentTarget.muted)} />
      <div className="film-card-shade" />
    </div>
    <button className="film-card-play" type="button" onClick={() => controls.current?.toggle()}
      aria-label={`${playing ? "Tạm dừng" : "Phát"} video ${title}`}>
      {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
    </button>
    {ready && <button className="film-card-play film-card-audio" type="button"
      onClick={() => { if (ref.current) ref.current.muted = !ref.current.muted; }}
      aria-label={`${muted ? "Bật" : "Tắt"} âm thanh video ${title}`}>
      {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
    </button>}
    {error && <p className="film-preview-error" role="status">{error}</p>}
  </>;
}
