"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Images, Layers3 } from "lucide-react";
import type { PublicProject } from "@/lib/types";
import { MediaImage } from "./media-image";

type PhotoProject = Pick<PublicProject, "id" | "slug" | "title" | "role" | "type" | "cover"> & { photoCount: number; mediaCount: number };

export function PhotoAccordion({ projects }: { projects: PhotoProject[] }) {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  useEffect(() => {
    const node = track.current;
    if (!node) return;
    // Follow the expanding panel within this gallery only, without scrolling the page.
    const observer = new ResizeObserver(() => {
      const panel = node.children[active] as HTMLElement | undefined;
      if (!panel || node.scrollWidth <= node.clientWidth + 1) return;
      const panelBox = panel.getBoundingClientRect(), box = node.getBoundingClientRect();
      const left = node.scrollLeft + panelBox.left - box.left - (node.clientWidth - panelBox.width) / 2;
      node.scrollTo({ left: Math.max(0, left), behavior: "instant" });
    });
    observer.observe(node);
    Array.from(node.children).forEach(panel => observer.observe(panel));
    return () => observer.disconnect();
  }, [active]);

  if (!projects.length) return null;
  function keyboardSelect(next: number) {
    const index = (next + projects.length) % projects.length;
    setActive(index);
    buttons.current[index]?.focus({ preventScroll: true });
  }
  return <section className={`photo-grid photo-accordion ${projects.length === 1 ? "photo-accordion-single" : ""}`} aria-label="Bộ sưu tập dự án ảnh" onKeyDown={event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); keyboardSelect(active + (event.key === "ArrowLeft" ? -1 : 1)); }
    if (event.key === "Home" || event.key === "End") { event.preventDefault(); keyboardSelect(event.key === "Home" ? 0 : projects.length - 1); }
  }}>
    <div className="photo-accordion-track" ref={track}>
      {projects.map((project, index) => {
        const selected = index === active;
        const detailId = `${id}-${index}-details`;
        return <article className={`photo-accordion-panel ${selected ? "is-active" : ""}`} key={project.id}>
          <div className="photo-panel-backdrop" aria-hidden="true">{selected && <MediaImage media={project.cover} thumbnail />}</div>
          <MediaImage media={project.cover} className="photo-panel-image" fit={selected ? "contain" : "cover"} sizes={selected ? "(max-width: 650px) 80vw, (max-width: 1100px) 75vw, 1000px" : "100px"} />
          <div className="photo-panel-shade" />
          <button type="button" className="photo-panel-trigger" ref={node => { buttons.current[index] = node; }} onClick={() => setActive(index)} aria-expanded={selected} aria-controls={detailId} aria-label={`Mở rộng ${project.type === "PHOTO" ? "bộ ảnh" : "dự án"} ${project.title}`}>
            <span className="photo-panel-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="photo-panel-badge">{project.type === "MIXED" ? <Layers3 size={18} /> : <Images size={18} />}</span>
          </button>
          <div className="photo-panel-details" id={detailId} hidden={!selected}>
            <div className="photo-panel-copy"><p className="photo-panel-kind">{project.type === "MIXED" ? "PHOTO & MOTION" : "PHOTO SERIES"} <span>·</span> {project.type === "MIXED" ? `${project.mediaCount} media` : `${project.photoCount} ảnh`}</p><h3>{project.title}</h3><p className="photo-panel-role">{project.role}</p></div>
            <Link href={`/work/${project.slug}`} className="button button-light photo-project-link">Xem {project.type === "MIXED" ? "dự án" : "bộ ảnh"} <ArrowUpRight size={15} /></Link>
          </div>
        </article>;
      })}
    </div>
    <div className="photo-accordion-footer"><span aria-live="polite" aria-atomic="true">{String(active + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}<span className="sr-only"> · {projects[active].title}</span></span>{projects.length > 1 && <p>Chọn một dải ảnh để mở rộng <span className="photo-swipe-hint">· Vuốt ngang để xem thêm</span></p>}</div>
  </section>;
}
