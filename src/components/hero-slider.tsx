"use client";

import { memo, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Aperture, ArrowLeft, ArrowRight, ArrowUpRight, Play } from "lucide-react";
import type { PublicProject, Settings } from "@/lib/types";
import { MediaImage } from "./media-image";

type HeroProject = Pick<PublicProject, "id" | "slug" | "title" | "type" | "cover">;
type HeroSettings = Pick<Settings, "name" | "profession" | "bio">;

// The introduction has no slide state. Keep its text subtree stable while the media changes.
const HeroIntroduction = memo(function HeroIntroduction({ name, profession, bio }: HeroSettings) {
  return <div className="hero-introduction"><p className="eyebrow">XIN CHÀO, TÔI LÀ</p><h1>{name}</h1><h2>{profession}</h2><p className="hero-intro">{bio}</p></div>;
});
const HeroDisciplines = memo(function HeroDisciplines() {
  return <p className="hero-disciplines">Photography <span>·</span> Product films <span>·</span> Visual storytelling</p>;
});
const INTERVAL = 3000;
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(listener: () => void) {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

export function HeroSlider({ projects, settings }: { projects: HeroProject[]; settings: HeroSettings }) {
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(true);
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia(reducedMotionQuery).matches, () => false);
  const section = useRef<HTMLElement>(null);
  const transition = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = useRef(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const cancelClick = useRef(false);
  const multiple = projects.length > 1;
  const current = projects[active];

  const select = useCallback((requested: number) => {
    if (!projects.length || locked.current) return;
    const next = (requested + projects.length) % projects.length;
    if (next === active) return;
    if (transition.current) clearTimeout(transition.current);
    locked.current = true;
    setLeaving(reducedMotion ? null : active);
    setActive(next);
    // The outgoing card clears the front before it returns behind the stack.
    transition.current = setTimeout(() => {
      setLeaving(null);
      transition.current = setTimeout(() => { locked.current = false; }, reducedMotion ? 0 : 600);
    }, reducedMotion ? 0 : 200);
  }, [active, projects.length, reducedMotion]);

  useEffect(() => {
    const node = section.current;
    if (!node) return;
    let inView = true;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); }, { threshold: 0.15 });
    observer.observe(node);
    document.addEventListener("visibilitychange", update);
    update();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);

  useEffect(() => {
    if (!multiple || !playing || hovered || !visible || reducedMotion) return;
    // Retry on the next tick if background throttling delays the transition unlock.
    const timer = setInterval(() => select(active + 1), INTERVAL);
    return () => clearInterval(timer);
  }, [active, multiple, playing, hovered, visible, reducedMotion, select]);
  useEffect(() => () => { if (transition.current) clearTimeout(transition.current); }, []);

  function manualSelect(next: number) { setPlaying(false); select(next); }

  return <section ref={section} className="hero hero-with-slider" onFocusCapture={() => setPlaying(false)}>
    <div className="hero-backdrop" aria-hidden="true">{projects.map((project, index) => <div key={project.id} className={`hero-backdrop-slide ${index === active ? "is-current" : ""}`}><MediaImage media={project.cover} thumbnail eager /></div>)}</div>
    <div className="hero-wash" />
    <div className="hero-copy"><HeroIntroduction {...settings} /><div className="hero-actions"><Link href="/work" className="button button-dark">Xem dự án <ArrowUpRight size={17} /></Link>{current && <Link href={`/work/${current.slug}`} className="button button-light">Xem {current.type === "VIDEO" ? "phim nổi bật" : "bộ ảnh"} <Play size={15} /></Link>}</div><HeroDisciplines /></div>
    <div className="hero-media" onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); manualSelect(active + (event.key === "ArrowLeft" ? -1 : 1)); } }} onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }} onPointerLeave={() => setHovered(false)}>
      <div className="hero-orbit" />
      <div className="hero-stack" role="region" aria-roledescription="carousel" aria-label="Dự án nổi bật" onPointerDown={event => { if (event.pointerType === "touch" || event.pointerType === "pen") swipe.current = { x: event.clientX, y: event.clientY }; }} onPointerCancel={() => { swipe.current = null; }} onPointerUp={event => {
        const start = swipe.current; swipe.current = null;
        if (!start) return;
        const dx = event.clientX - start.x, dy = event.clientY - start.y;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) { event.preventDefault(); cancelClick.current = true; manualSelect(active + (dx < 0 ? 1 : -1)); }
      }}>
        {projects.map((project, index) => {
          const position = (index - active + projects.length) % projects.length;
          const outgoing = index === leaving;
          return <div key={project.id} className={`hero-stack-card hero-position-${Math.min(position, 3)} ${outgoing ? "is-leaving" : ""}`} aria-hidden={position !== 0 || outgoing} inert={position !== 0 || outgoing} role="group" aria-roledescription="slide" aria-label={`${index + 1} / ${projects.length}: ${project.title}`}>
            <Link href={`/work/${project.slug}`} className="hero-frame" aria-label={`Xem ${project.title}`} draggable={false} onPointerDown={() => { cancelClick.current = false; }} onClick={event => { if (cancelClick.current) { event.preventDefault(); cancelClick.current = false; } }}>
              <MediaImage media={project.cover} priority={index === 0} eager sizes="(max-width: 380px) 205px, (max-width: 650px) 230px, (max-width: 800px) 215px, (max-width: 1050px) 240px, 270px" />
              <span className="hero-frame-top">SELECTED / {project.type === "VIDEO" ? "PRODUCT FILM" : project.type === "MIXED" ? "PHOTO & MOTION" : "PHOTO SERIES"}</span>{project.type === "VIDEO" && <span className="hero-play"><Play size={25} /></span>}<span className="hero-frame-title"><span className="hero-project-title">{project.title.split("—")[0].trim()}</span><small>{project.type === "VIDEO" ? "Light becomes a story." : "A moment, a different perspective."}</small></span><span className="hero-frame-arrow"><ArrowUpRight size={20} /></span>
            </Link>
          </div>;
        })}
        {!current && <div className="hero-frame hero-empty"><Aperture size={70} strokeWidth={.7} /><span>Khung hình tiếp theo<br />đang chờ được kể.</span></div>}
      </div>
      {multiple && <div className="hero-slider-controls"><button type="button" className="hero-slider-arrow" onClick={() => manualSelect(active - 1)} aria-label="Dự án nổi bật trước"><ArrowLeft size={15} /></button><div className="hero-slider-dots" role="group" aria-label="Chọn dự án nổi bật">{projects.map((project, index) => <button key={project.id} type="button" className={active === index ? "is-active" : ""} aria-label={`Chọn dự án ${index + 1}: ${project.title}`} aria-pressed={active === index} onClick={() => manualSelect(index)}><span /></button>)}</div><button type="button" className="hero-slider-arrow" onClick={() => manualSelect(active + 1)} aria-label="Dự án nổi bật tiếp theo"><ArrowRight size={15} /></button></div>}
      <div className="hero-floating"><Aperture size={22} /><span>From a moment<br /><strong>to a story.</strong></span></div><span className="hero-side">PHOTO & MOTION / SELECTED WORK</span>
      <p className="sr-only" aria-live={playing && !reducedMotion ? "off" : "polite"} aria-atomic="true">{current ? `Dự án ${active + 1} / ${projects.length}: ${current.title}` : "Chưa có dự án nổi bật."}</p>
    </div>
  </section>;
}
