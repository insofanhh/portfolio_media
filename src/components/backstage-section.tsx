"use client";
import { useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import type { PublicMedia } from "@/lib/types";
import { MediaImage } from "./media-image";
import { MediaModal } from "./media-modal";

export function BackstageSection({ items }: { items: { media: PublicMedia; project: string }[] }) {
  const [index, setIndex] = useState<number | null>(null);
  if (!items.length) return null;
  const videoIndex = items.findIndex(entry => entry.media.kind === "video");
  const mainIndex = videoIndex >= 0 ? videoIndex : 0;
  const photos = items.map((entry, itemIndex) => ({ ...entry, itemIndex })).filter(entry => entry.itemIndex !== mainIndex && entry.media.kind === "image").slice(0, 2);
  return <section className="content-section backstage-section" id="behind-the-scenes"><div className="section-heading"><div><p className="eyebrow">BEHIND THE SCENES</p><h2>Đằng sau một khung hình<span>.</span></h2></div><p className="section-note">Những điều diễn ra trước khi bấm máy</p></div><div className="backstage-home-grid"><button className="backstage-feature" onClick={() => setIndex(mainIndex)} aria-label="Xem hậu trường trên trường quay"><MediaImage media={items[mainIndex].media} /><span className="project-type-label">{items[mainIndex].media.kind === "video" ? "BTS VIDEO / 9:16" : "BTS PHOTO"}</span>{items[mainIndex].media.kind === "video" && <span className="card-play"><Play size={17} /></span>}<span className="backstage-feature-title">On set.<small>Ánh sáng, máy quay & một ý tưởng</small></span></button><div className="backstage-stills">{photos.map(entry => <button key={entry.media.id} onClick={() => setIndex(entry.itemIndex)} aria-label={`Xem ${entry.media.caption || "ảnh hậu trường"}`}><MediaImage media={entry.media} thumbnail /><span>{entry.media.caption || "Hậu trường"}<ArrowUpRight size={13} /></span></button>)}</div><div className="backstage-copy"><p className="eyebrow">THE MAKING OF</p><h3>Tác phẩm đẹp<br />bắt đầu từ<br />một quá trình.</h3><p>Một góc nhìn gần hơn về cách tôi xây dựng ánh sáng, sắp đặt bối cảnh và làm việc cùng đội ngũ.</p><button className="button button-light" onClick={() => setIndex(mainIndex)}>Khám phá hậu trường <ArrowUpRight size={15} /></button></div></div><MediaModal items={items.map(item => item.media)} index={index} onChange={setIndex} onClose={() => setIndex(null)} projectTitle={index !== null ? items[index].project : "Hậu trường"} /></section>;
}
