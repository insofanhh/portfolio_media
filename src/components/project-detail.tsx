"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, ChevronsUp, Play, X } from "lucide-react";
import type { PublicProject } from "@/lib/types";
import { MediaImage } from "./media-image";
import { VideoPlayer } from "./video-player";
import { MediaModal } from "./media-modal";

export function ProjectDetail({ project, next, preview = false }: { project: PublicProject; next?: { slug: string; title: string }; preview?: boolean }) {
  const [index, setIndex] = useState(0);
  const [tab, setTab] = useState<"story" | "bts">("story");
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const info = useRef<HTMLElement>(null);
  const previousIndex = useRef(0);
  const scrollTarget = useRef<number | null>(null);
  const item = project.main[index] || project.main[0];
  const album = project.main.length > 1 || project.type === "PHOTO";
  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      scrollTarget.current = previousIndex.current;
      node.scrollTo({ left: node.clientWidth * previousIndex.current, behavior: "instant" });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  function selectPhoto(nextIndex: number) {
    const selected = (nextIndex + project.main.length) % project.main.length;
    previousIndex.current = selected;
    scrollTarget.current = selected;
    setIndex(selected);
    track.current?.scrollTo({ left: track.current.clientWidth * selected, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  function updateSlide(node: HTMLDivElement) {
    if (scrollTarget.current !== null && Math.abs(node.scrollLeft - scrollTarget.current * node.clientWidth) > 2) return;
    scrollTarget.current = null;
    const selected = Math.round(node.scrollLeft / node.clientWidth);
    if (selected >= 0 && selected < project.main.length) {
      previousIndex.current = selected;
      setIndex(selected);
    }
  }
  return <main className={`project-detail ${album ? "is-album" : "is-film"}`}>
    {preview && <div className="preview-banner">Aperçu privé · Bản nháp <Link href={`/admin/projects/${project.id}`}>Trở về chỉnh sửa ↗</Link></div>}
    <section className="project-stage" aria-label={album ? "Bộ ảnh của dự án" : "Video của dự án"} onKeyDown={event => { if (album && ["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); selectPhoto(index + (event.key === "ArrowLeft" ? -1 : 1)); } }}>
      <MediaImage media={item} className="stage-backdrop" thumbnail /><div className="stage-shade" />
      <Link href={preview ? `/admin/projects/${project.id}` : "/work"} className="circle-button stage-back" aria-label="Trở về danh sách dự án"><ArrowLeft size={19} /></Link><span className="stage-label">FRAME / {album ? "PHOTO SERIES" : "PRODUCT FILM"}</span>
      {album ? <><div className="photo-track" ref={track} onScroll={event => updateSlide(event.currentTarget)} onPointerDown={() => { scrollTarget.current = null; }} onWheel={() => { scrollTarget.current = null; }} role="region" aria-roledescription="carousel" aria-label="Các tác phẩm trong dự án">{project.main.map((media, mediaIndex) => <div className="photo-slide" key={media.id} role="group" aria-roledescription="slide" aria-label={`Tác phẩm ${mediaIndex + 1} trong ${project.main.length}`} aria-hidden={index !== mediaIndex} inert={index !== mediaIndex}><div className="photo-fit">{Math.abs(mediaIndex - index) <= 1 && (media.kind === "video" ? <VideoPlayer key={media.id} media={media} /> : <MediaImage media={media} fit="contain" priority={mediaIndex === index} sizes="(max-width: 800px) 90vw, 45vw" />)}</div></div>)}</div>{project.main.length > 1 && <><button className="circle-button gallery-prev" aria-label="Ảnh trước" onClick={() => selectPhoto(index - 1)}><ChevronLeft size={21} /></button><button className="circle-button gallery-next" aria-label="Ảnh tiếp theo" onClick={() => selectPhoto(index + 1)}><ChevronRight size={21} /></button></>}<div className="album-bottom"><p aria-live="polite">{String(index + 1).padStart(2, "0")} / {String(project.main.length).padStart(2, "0")} <span>· {item.caption || item.alt}</span></p><div className="album-thumbs" role="group" aria-label="Chọn tác phẩm">{project.main.map((media, mediaIndex) => <button key={media.id} className={index === mediaIndex ? "is-active" : ""} onClick={() => selectPhoto(mediaIndex)} aria-label={`Xem ${media.kind === "video" ? "video" : "ảnh"} ${mediaIndex + 1}`} aria-pressed={index === mediaIndex}><MediaImage media={media} thumbnail />{media.kind === "video" && <Play size={12} />}</button>)}</div><small>Trượt trái / phải để xem ảnh</small></div></> : <div className="main-film"><VideoPlayer key={item.id} media={item} priority /></div>}
      <button className="scroll-information" onClick={() => info.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>Vuốt lên để xem thông tin <ChevronsUp size={16} /></button>
    </section>
    <article className="project-information" ref={info}><div className="project-info-brand"><Link href="/" className="tiny-brand">f.</Link><span>FRAME / SELECTED PROJECT</span><Link href="/work" aria-label="Đóng dự án"><X size={19} /></Link></div><p className="eyebrow">{project.type === "PHOTO" ? "PRODUCT PHOTOGRAPHY / PHOTO SERIES" : project.type === "MIXED" ? "PHOTO & MOTION / MIXED MEDIA" : "PRODUCT FILM / VERTICAL"}</p><h1>{project.title}</h1><p className="project-summary">{project.summary}</p>{project.isDemo && <span className="sample-label">Tác phẩm minh họa</span>}<dl className="project-facts"><div><dt>VAI TRÒ</dt><dd>{project.role}</dd></div><div><dt>KHÁCH HÀNG / NĂM</dt><dd>{project.client ? `${project.client} / ` : ""}{project.year}</dd></div></dl><div className="project-tabs" role="group" aria-label="Nội dung dự án"><button onClick={() => setTab("story")} aria-pressed={tab === "story"}>Câu chuyện</button><button onClick={() => setTab("bts")} aria-pressed={tab === "bts"}>Hậu trường <span>{project.backstage.length}</span></button></div>
      {tab === "story" ? <div className="project-story"><h2>Ý tưởng & cách thực hiện</h2><p>{project.concept}</p><h2>Phạm vi tham gia</h2><p>{project.scope}</p>{!!project.tags.length && <div className="tag-list">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}<div className="project-credits"><span>CREDITS</span><p>{project.credits || "Thông tin đội ngũ sẽ được cập nhật."}</p></div></div> : <div className="project-backstage"><div className="backstage-heading"><span>PHOTO & VIDEO DIARY</span><span>{project.backstage.length} media</span></div>{project.backstage.length ? <><div className="backstage-grid">{project.backstage.map((media, mediaIndex) => <button key={media.id} onClick={() => setModalIndex(mediaIndex)} aria-label={`Mở ${media.kind === "video" ? "video" : "ảnh"} hậu trường: ${media.caption || media.alt}`}><MediaImage media={media} thumbnail /><span className="media-kind">{media.kind === "video" ? "VIDEO · 9:16" : "ẢNH"}</span>{media.kind === "video" && <span className="mini-play"><Play size={19} /></span>}<span className="backstage-caption">{media.caption || "Hậu trường"}<ArrowUpRight size={13} /></span></button>)}</div><p className="help-text">Chọn một ảnh hoặc video để xem hậu trường.</p></> : <p className="empty-message">Hậu trường của dự án sẽ được bổ sung sau.</p>}</div>}
      <div className="project-info-bottom"><Link href={`/contact?project=${encodeURIComponent(project.title)}`} className="button button-dark">Trao đổi dự án tương tự <ArrowUpRight size={15} /></Link>{next && <Link href={`/work/${next.slug}`} className="text-link" aria-label={`Dự án tiếp theo: ${next.title}`}>Dự án tiếp theo ↗</Link>}</div>
    </article><MediaModal items={project.backstage} index={modalIndex} onChange={setModalIndex} onClose={() => setModalIndex(null)} projectTitle={project.title} />
  </main>;
}
