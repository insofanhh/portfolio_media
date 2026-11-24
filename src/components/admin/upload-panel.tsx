"use client";
import { useRef, useState, type DragEvent } from "react";
import { CloudUpload, RotateCcw, X, Check, LoaderCircle } from "lucide-react";
import { api } from "@/lib/client-api";
import { formatBytes } from "@/lib/utils";
import type { Placement } from "@/lib/types";

interface Reservation { mediaId: string; sessionId: string; path: string; driver: "local" | "blob" }
interface UploadItem { id: string; file: File; percent: number; state: "waiting" | "uploading" | "done" | "error" | "cancelled"; error?: string; reservation?: Reservation }
export function UploadPanel({ projectId, placement = "MAIN", onChange }: { projectId?: string; placement?: Placement; onChange?: () => void }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [target, setTarget] = useState<Placement>(placement);
  const aborters = useRef(new Map<string, () => void>());
  function update(id: string, patch: Partial<UploadItem>) { setItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item)); }
  async function send(item: UploadItem) {
    update(item.id, { state: "uploading", percent: 0, error: undefined });
    try {
      const reservation = item.reservation || await api<Reservation>("/api/admin/uploads", { method: "POST", body: JSON.stringify({ name: item.file.name, mime: item.file.type || (item.file.name.toLowerCase().endsWith(".mov") ? "video/quicktime" : "application/octet-stream"), size: item.file.size, projectId, placement: target }) });
      item.reservation = reservation;
      update(item.id, { reservation });
      if (reservation.driver === "blob") {
        const { upload } = await import("@vercel/blob/client");
        const controller = new AbortController();
        aborters.current.set(item.id, () => controller.abort());
        await upload(reservation.path, item.file, { access: "private", handleUploadUrl: "/api/admin/uploads/blob", clientPayload: reservation.sessionId, multipart: item.file.size > 5 * 1024 ** 2, abortSignal: controller.signal, onUploadProgress: event => update(item.id, { percent: Math.round(event.percentage) }) });
      } else {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          aborters.current.set(item.id, () => xhr.abort());
          xhr.open("PUT", `/api/admin/uploads/local/${reservation.mediaId}`);
          xhr.setRequestHeader("Content-Type", item.file.type || "application/octet-stream");
          xhr.upload.onprogress = event => { if (event.lengthComputable) update(item.id, { percent: Math.round(event.loaded / event.total * 100) }); };
          xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(); else { let message = "Upload chưa thành công."; try { message = JSON.parse(xhr.responseText).error || message; } catch {} reject(new Error(message)); } };
          xhr.onerror = () => reject(new Error("Mất kết nối. Bạn có thể thử lại."));
          xhr.onabort = () => reject(new DOMException("Đã hủy upload", "AbortError"));
          xhr.send(item.file);
        });
      }
      update(item.id, { state: "done", percent: 100 });
      onChange?.();
    } catch (error) { update(item.id, { state: error instanceof DOMException && error.name === "AbortError" ? "cancelled" : "error", error: error instanceof Error ? error.message : "Không tải lên được tệp." }); }
    finally { aborters.current.delete(item.id); }
  }
  function choose(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files).map(file => ({ id: crypto.randomUUID(), file, state: "waiting" as const, percent: 0 }));
    setItems(current => [...current, ...selected]);
    // Limit concurrent browser uploads; processing happens independently in the worker.
    void (async () => { for (let i = 0; i < selected.length; i += 2) await Promise.all(selected.slice(i, i + 2).map(send)); })();
  }
  function drop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files); }
  return <section className="upload-panel">{projectId && <div className="upload-placement" role="group" aria-label="Vị trí media"><button type="button" aria-pressed={target === "MAIN"} onClick={() => setTarget("MAIN")}>Tác phẩm chính</button><button type="button" aria-pressed={target === "BEHIND_THE_SCENES"} onClick={() => setTarget("BEHIND_THE_SCENES")}>Hậu trường</button></div>}<div className={`upload-dropzone ${dragging ? "is-dragging" : ""}`} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}><CloudUpload size={31} strokeWidth={1.5} /><h3>Thêm ảnh hoặc video</h3><p>Kéo thả vào đây hoặc chọn tệp từ thiết bị.</p><label className="button button-dark file-picker">Chọn tệp<input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" onChange={event => { choose(event.target.files); event.target.value = ""; }} /></label><small>Bản gốc được giữ riêng tư · Chỉ bản đã xử lý mới được xuất bản.</small></div>{!!items.length && <ul className="upload-list" aria-live="polite">{items.map(item => <li key={item.id}><div className="upload-file-title"><span>{item.file.name}<small>{formatBytes(item.file.size)}</small></span>{item.state === "done" ? <Check size={18} /> : item.state === "uploading" ? <button type="button" className="icon-button" aria-label={`Hủy ${item.file.name}`} onClick={() => aborters.current.get(item.id)?.()}><X size={16} /></button> : ["error", "cancelled"].includes(item.state) ? <button type="button" className="icon-button" aria-label={`Thử tải lại ${item.file.name}`} onClick={() => void send(item)}><RotateCcw size={16} /></button> : <LoaderCircle className="spin" size={16} />}</div><div className="upload-progress"><span style={{ width: `${item.percent}%` }} /></div><p className={item.state === "error" ? "upload-error" : ""}>{item.state === "done" ? "Đã tải lên · Đang chờ xử lý" : item.state === "uploading" ? `${item.percent}%` : item.state === "waiting" ? "Đang chờ upload" : item.error}</p></li>)}</ul>}</section>;
}
