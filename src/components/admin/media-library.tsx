"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Film, ImageIcon, RotateCcw, Trash2 } from "lucide-react";
import type { AdminMedia } from "@/lib/admin-types";
import { api } from "@/lib/client-api";
import { adminMediaView } from "@/lib/admin-media-view";
import { formatBytes, formatDuration } from "@/lib/utils";
import { MediaImage } from "../media-image";
import { MediaModal } from "../media-modal";
import { UploadPanel } from "./upload-panel";
import { StatusBadge } from "./status-badge";

export function MediaLibrary({ initial, initialCursor }: { initial: AdminMedia[]; initialCursor: string | null }) {
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async (append = false, after?: string) => {
    const result = await api<{ items: AdminMedia[]; nextCursor: string | null }>(`/api/admin/media?q=${encodeURIComponent(query)}${after ? `&cursor=${after}` : ""}`);
    setItems(current => append ? [...current, ...result.items] : result.items); setCursor(result.nextCursor);
  }, [query]);
  const processing = items.some(media => ["UPLOADING", "QUEUED", "PROCESSING"].includes(media.status));
  useEffect(() => { if (!processing) return; const timer = setInterval(() => { void refresh().catch(() => {}); }, 3000); return () => clearInterval(timer); }, [processing, refresh]);
  async function action(mediaId: string, kind: "retry" | "delete" | "restore") {
    setError(""); setBusy(true);
    try { await api("/api/admin/media", { method: "POST", body: JSON.stringify({ mediaId, action: kind }) }); await refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : "Chưa cập nhật được media."); }
    finally { setBusy(false); }
  }
  const filtered = items.filter(media => filter === "ALL" ? media.status !== "DELETING" : filter === "WORKING" ? ["UPLOADING", "QUEUED", "PROCESSING"].includes(media.status) : media.status === filter);
  const ready = items.filter(media => media.status === "READY").map(adminMediaView);
  const modalIndex = selectedId ? ready.findIndex(media => media.id === selectedId) : -1;
  return <><UploadPanel onChange={() => { void refresh(); }} />{error && <p className="form-error" role="alert">{error}</p>}<div className="library-toolbar"><div className="media-placement-tabs" role="group" aria-label="Lọc trạng thái media">{[["ALL", "Tất cả"], ["READY", "Sẵn sàng"], ["WORKING", "Đang xử lý"], ["FAILED", "Cần kiểm tra"], ["DELETING", "Thùng rác"]].map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div><form className="library-search" onSubmit={event => { event.preventDefault(); void refresh(); }}><input value={query} onChange={event => setQuery(event.target.value)} aria-label="Tìm media" placeholder="Tìm theo tên tệp..." /><button className="button button-light">Tìm</button></form></div><div className="library-grid">{filtered.map(media => <article className="library-card" key={media.id}><button className="library-card-image" disabled={media.status !== "READY"} onClick={() => setSelectedId(media.id)} aria-label={`Xem ${media.originalName}`}>{media.status === "READY" ? <MediaImage media={adminMediaView(media)} thumbnail /> : media.mime.startsWith("video/") ? <Film size={35} strokeWidth={1} /> : <ImageIcon size={35} strokeWidth={1} />}<span className="library-card-kind">{media.mime.startsWith("video/") ? "VIDEO" : "ẢNH"}</span></button><div className="library-card-body"><StatusBadge status={media.status} /><h3>{media.originalName}</h3><p>{formatBytes(media.bytes)}{media.width ? ` · ${media.width} × ${media.height}` : ""}{media.duration ? ` · ${formatDuration(media.duration)}` : ""}</p>{media.error && <p className="media-processing-error">{media.error}</p>}<div className="media-usage">{media.projects.length ? [...new Map(media.projects.map(link => [link.project.id, link.project])).values()].map(project => <Link key={project.id} href={`/admin/projects/${project.id}`}>{project.title} ↗</Link>) : <span>Chưa dùng trong dự án</span>}</div><div className="library-card-actions">{media.status === "FAILED" && <button className="text-link" disabled={busy} onClick={() => void action(media.id, "retry")}><RotateCcw size={13} />Thử xử lý lại</button>}{media.status === "DELETING" ? <><button className="text-link" disabled={busy} onClick={() => void action(media.id, "restore")}><RotateCcw size={13} />Khôi phục</button><small>Xóa sau {media.deleteAfter ? new Date(media.deleteAfter).toLocaleDateString("vi-VN") : "7 ngày"}</small></> : <button className="icon-button danger-text" disabled={busy || media.projects.length > 0 || ["QUEUED", "UPLOADING", "PROCESSING"].includes(media.status)} aria-label={`Đưa ${media.originalName} vào thùng rác`} onClick={() => void action(media.id, "delete")}><Trash2 size={15} /></button>}</div></div></article>)}</div>{!filtered.length && <div className="admin-panel admin-empty"><ImageIcon size={30} strokeWidth={1} /><p>Chưa có media phù hợp.</p></div>}{cursor && <div className="load-more"><button className="button button-light" onClick={() => void refresh(true, cursor)}>Xem thêm media</button></div>}<MediaModal items={ready} index={modalIndex >= 0 ? modalIndex : null} onChange={index => setSelectedId(ready[index].id)} onClose={() => setSelectedId(null)} projectTitle="Thư viện media" /></>;
}
