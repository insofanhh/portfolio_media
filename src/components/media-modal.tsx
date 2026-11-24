"use client";
import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PublicMedia } from "@/lib/types";
import { MediaImage } from "./media-image";
import { VideoPlayer } from "./video-player";

export function MediaModal({ items, index, onChange, onClose, projectTitle = "Hậu trường" }: { items: PublicMedia[]; index: number | null; onChange: (index: number) => void; onClose: () => void; projectTitle?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const open = index !== null;
  useEffect(() => {
    if (!open) return;
    document.querySelectorAll("video").forEach(video => { if (!ref.current?.contains(video)) video.pause(); });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [open]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) { returnFocus.current = document.activeElement as HTMLElement; dialog.showModal(); }
    else if (!open && dialog.open) dialog.close();
  }, [open]);
  const item = index !== null ? items[index] : null;
  function move(delta: number) { if (index !== null && items.length) onChange((index + delta + items.length) % items.length); }
  return <dialog ref={ref} className="media-modal" aria-labelledby="media-modal-title" onClose={() => { onClose(); returnFocus.current?.focus({ preventScroll: true }); }} onCancel={() => onClose()} onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); } }} onClick={event => { if (event.target !== event.currentTarget) return; const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); }}>
    <header className="modal-header"><div><p className="eyebrow">BEHIND THE SCENES / {item?.kind === "video" ? "VIDEO" : "PHOTO"}</p><h2 id="media-modal-title">{item?.caption || "Hậu trường dự án"}</h2></div><button className="circle-button" onClick={onClose} aria-label="Đóng trình xem"><X size={20} /></button></header>
    <div className="modal-stage">{item && <><MediaImage media={item} className="modal-blur" thumbnail /><div className="modal-media">{item.kind === "video" ? <VideoPlayer key={item.id} media={item} /> : <MediaImage media={item} fit="contain" priority sizes="(max-width: 700px) 90vw, 75vw" />}</div></>}{items.length > 1 && <><button className="circle-button modal-prev" onClick={() => move(-1)} aria-label="Media trước"><ChevronLeft size={20} /></button><button className="circle-button modal-next" onClick={() => move(1)} aria-label="Media tiếp theo"><ChevronRight size={20} /></button></>}</div>
    <footer className="modal-footer"><span>{projectTitle}</span><span aria-live="polite">{index !== null ? String(index + 1).padStart(2, "0") : "00"} / {String(items.length).padStart(2, "0")}</span></footer>
  </dialog>;
}
