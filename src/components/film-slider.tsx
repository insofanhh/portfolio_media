"use client";

import { useEffect, useReducer, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicMedia, PublicProject } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { MediaImage } from "./media-image";
import { FilmCardVideo } from "./film-card-video";

type FilmSlide = Pick<PublicProject, "id" | "slug" | "title" | "role" | "client" | "year" | "tags" | "cover"> & { video: PublicMedia | null };
type SliderState = { active: number; previous: number | null };
type Action = { type: "step"; delta: number } | { type: "select" | "project"; index: number } | { type: "settled"; previous: number };
const largeScreenQuery = "(min-width: 1200px)";
function subscribeScreen(listener: () => void) {
  const query = window.matchMedia(largeScreenQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

export function FilmSlider({ projects }: { projects: FilmSlide[] }) {
  const count = projects.length;
  // Reuse real projects around the ring when fewer than five films are available.
  const frameCount = count > 1 && count < 5 ? count * 3 : count;
  const largeScreen = useSyncExternalStore(subscribeScreen, () => window.matchMedia(largeScreenQuery).matches, () => false);
  const [state, dispatch] = useReducer((current: SliderState, action: Action): SliderState => {
    if (action.type === "settled") return current.previous === action.previous ? { ...current, previous: null } : current;
    if (!count) return current;
    let target: number;
    if (action.type === "step") target = current.active + action.delta;
    else if (action.type === "project") {
      const distance = (action.index - current.active % count + count) % count;
      target = current.active + (distance > count / 2 ? distance - count : distance);
    } else target = action.index;
    const next = (target % frameCount + frameCount) % frameCount;
    return next === current.active ? current : { active: next, previous: current.active };
  }, { active: 0, previous: null });
  const gesture = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const cancelClick = useRef(false);
  const pagination = useRef<HTMLDivElement>(null);
  const activeProject = count ? state.active % count : 0;
  const current = projects[activeProject];
  useEffect(() => {
    if (state.previous === null) return;
    const previous = state.previous;
    const timer = setTimeout(() => dispatch({ type: "settled", previous }), 750);
    return () => clearTimeout(timer);
  }, [state.active, state.previous]);
  useEffect(() => {
    const node = pagination.current;
    const selected = node?.children[activeProject] as HTMLElement | undefined;
    if (!node || !selected) return;
    node.scrollTo({ left: Math.max(0, selected.offsetLeft - (node.clientWidth - selected.offsetWidth) / 2), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [activeProject]);

  if (!current) return null;
  function step(delta: number) { dispatch({ type: "step", delta }); }

  return <section className={`film-grid film-slider ${count === 1 ? "film-slider-single" : ""}`} role="region" aria-roledescription="carousel" aria-label="Slider dự án video" onKeyDown={event => {
    if (!event.altKey && !event.ctrlKey && !event.metaKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); step(event.key === "ArrowLeft" ? -1 : 1); }
  }} onPointerDown={event => {
    cancelClick.current = false;
    if (event.pointerType !== "mouse") gesture.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
  }} onPointerCancel={() => { gesture.current = null; }} onPointerUp={event => {
    const start = gesture.current; gesture.current = null;
    if (!start || start.pointerId !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25) { cancelClick.current = true; event.preventDefault(); step(dx < 0 ? 1 : -1); }
  }} onClickCapture={event => { if (cancelClick.current) { event.preventDefault(); event.stopPropagation(); cancelClick.current = false; } }}>
    <div className="film-slider-backdrop" aria-hidden="true">
      {state.previous !== null && <MediaImage media={projects[state.previous % count].cover} className="film-backdrop-previous" thumbnail />}
      <MediaImage key={current.id} media={current.cover} className="film-backdrop-current" thumbnail />
    </div>
    <div className="film-slider-cards">
      {Array.from({ length: frameCount }, (_, index) => {
        const projectIndex = index % count;
        const project = projects[projectIndex];
        const distance = (index - state.active + frameCount) % frameCount;
        const offset = distance > frameCount / 2 ? distance - frameCount : distance;
        const position = offset === 0 ? "active" : offset === -1 ? "previous" : offset === 1 ? "next" : offset === -2 ? "previous-far" : offset === 2 ? "next-far" : offset < 0 ? "hidden-before" : "hidden-after";
        const selected = position === "active";
        const visible = Math.abs(offset) <= (largeScreen ? 2 : 1);
        return <article key={`${project.id}-${index}`} className="film-slider-card" data-position={position} role="group" aria-roledescription="slide" aria-label={`${projectIndex + 1} / ${count}: ${project.title}`} aria-hidden={!visible} inert={!visible}>
          <div className="film-card-poster">{visible && <MediaImage media={project.cover} sizes="(max-width: 650px) 56vw, 300px" />}<div className="film-card-shade" /></div>
          {selected && project.video && <FilmCardVideo key={project.video.id} media={project.video} title={project.title} />}
          {selected ? <Link className="film-card-link" href={`/work/${project.slug}`} aria-label={`Xem phim ${project.title}`} draggable={false}>
            <span className="film-card-category">{project.tags[0] || "PRODUCT FILM"}</span>
            <div className="film-card-caption" key={project.id}><h3>{project.title.split("—")[0].trim()}</h3><p className="film-card-subtitle">— {project.client || "PRODUCT FILM"} / {project.year}</p><span className="film-card-rule" /><p className="film-card-role">{project.role}</p><span className="film-card-cta">Xem dự án <ArrowUpRight size={14} /></span></div>
            <span className="film-card-duration">{formatDuration(project.video?.duration || project.cover.duration) || "9:16"}</span>
          </Link> : visible ? <button className="film-card-select" type="button" onClick={() => dispatch({ type: "select", index })} aria-label={`Đưa ${project.title} vào giữa${offset === -2 ? " (trái ngoài)" : offset === 2 ? " (phải ngoài)" : ""}`} tabIndex={0} /> : null}
        </article>;
      })}
    </div>
    {count > 1 && <><button className="circle-button film-slider-prev" type="button" onClick={() => step(-1)} aria-label="Video trước"><ChevronLeft size={22} /></button><button className="circle-button film-slider-next" type="button" onClick={() => step(1)} aria-label="Video tiếp theo"><ChevronRight size={22} /></button></>}
    <div className="film-slider-footer"><span className="film-slider-counter" aria-live="polite" aria-atomic="true">{String(activeProject + 1).padStart(2, "0")} <span>/ {String(count).padStart(2, "0")}</span><span className="sr-only"> · {current.title}</span></span>{count > 1 && <div className="film-slider-pagination" ref={pagination} role="group" aria-label="Chọn video">{projects.map((project, index) => <button key={project.id} type="button" aria-label={`Chọn video ${index + 1}: ${project.title}`} aria-pressed={index === activeProject} onClick={() => dispatch({ type: "project", index })}><span /></button>)}</div>}<span className="film-slider-hint">VERTICAL FILMS / 9:16</span></div>
  </section>;
}
