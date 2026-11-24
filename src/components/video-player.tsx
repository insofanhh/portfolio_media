"use client";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { PublicMedia } from "@/lib/types";
import { posterUrl } from "./media-image";
import type HlsType from "hls.js";

export function VideoPlayer({ media, className = "", priority = false }: { media: PublicMedia; className?: string; priority?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const [levels, setLevels] = useState<{ label: string; index: number }[]>([]);
  const [quality, setQuality] = useState(-1);
  const hlsUrl = media.variants.find(v => v.kind === "HLS")?.url;
  const mp4Url = media.variants.find(v => v.kind === "VIDEO")?.url;
  useEffect(() => {
    if (!started || !ref.current) return;
    const video = ref.current;
    let cancelled = false;
    async function load() {
      if (!mp4Url && !hlsUrl) { setError("Video chưa sẵn sàng. Vui lòng thử lại sau."); return; }
      if (hlsUrl && !video.canPlayType("application/vnd.apple.mpegurl")) {
        const { default: Hls } = await import("hls.js");
        if (cancelled) return;
        if (Hls.isSupported()) {
          const engine = new Hls({ capLevelToPlayerSize: true, maxBufferLength: 20 });
          hlsRef.current = engine;
          engine.loadSource(hlsUrl);
          engine.attachMedia(video);
          engine.on(Hls.Events.MANIFEST_PARSED, () => {
            setLevels(engine.levels.map((level, index) => ({ label: `${Math.min(level.width, level.height)}p`, index })));
            void video.play().catch(() => {});
          });
          engine.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal && mp4Url) { engine.destroy(); hlsRef.current = null; video.src = mp4Url; void video.play().catch(() => {}); }
            else if (data.fatal) setError("Không phát được video. Vui lòng thử lại.");
          });
          return;
        }
      }
      video.src = hlsUrl && video.canPlayType("application/vnd.apple.mpegurl") ? hlsUrl : mp4Url || hlsUrl!;
      void video.play().catch(() => {});
    }
    void load().catch(() => setError("Không tải được video. Kiểm tra kết nối và thử lại."));
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) video.pause(); }, { threshold: 0.05 });
    observer.observe(video);
    return () => { cancelled = true; observer.disconnect(); hlsRef.current?.destroy(); hlsRef.current = null; video.pause(); video.removeAttribute("src"); video.load(); };
  }, [started, media.id, hlsUrl, mp4Url]);
  return <div className={`video-player ${className}`}>
    <video ref={ref} poster={posterUrl(media, priority ? 1600 : 960)} playsInline controls={started} preload="none" aria-label={media.alt || media.caption || "Video dự án"} onError={() => started && setError("Không đọc được video. Vui lòng thử lại.")} />
    {!started && <button className="play-button" onClick={() => { setStarted(true); setError(""); }} aria-label={`Phát ${media.caption || "video"}`}><Play size={28} fill="currentColor" /></button>}
    {!!levels.length && <label className="quality-selector">Chất lượng<select aria-label="Chất lượng video" value={quality} onChange={event => { const value = Number(event.target.value); setQuality(value); if (hlsRef.current) hlsRef.current.currentLevel = value; }}><option value={-1}>Tự động</option>{levels.map(level => <option value={level.index} key={level.index}>{level.label}</option>)}</select></label>}
    {error && <div className="player-error" role="alert"><p>{error}</p><button onClick={() => { setError(""); setStarted(false); }}>Thử lại</button></div>}
  </div>;
}
