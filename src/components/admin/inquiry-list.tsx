"use client";
import { useState } from "react";
import { Mail } from "lucide-react";
import { api } from "@/lib/client-api";
import { StatusBadge } from "./status-badge";
interface Inquiry { id: string; name: string; email: string; projectType: string; brief: string; status: string; createdAt: string }
export function InquiryList({ initial }: { initial: Inquiry[] }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");
  async function update(id: string, status: string) {
    setError("");
    try { await api("/api/admin/inquiries", { method: "PATCH", body: JSON.stringify({ id, status }) }); setItems(current => current.map(item => item.id === id ? { ...item, status } : item)); }
    catch (error) { setError(error instanceof Error ? error.message : "Chưa cập nhật được yêu cầu."); }
  }
  const selected = items.filter(item => filter === "ALL" || item.status === filter);
  return <><div className="media-placement-tabs" role="group" aria-label="Lọc yêu cầu">{[["ALL", "Tất cả"], ["NEW", "Mới"], ["READ", "Đã xem"], ["DONE", "Hoàn tất"]].map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>{error && <p className="form-error" role="alert">{error}</p>}<div className="inquiry-list">{selected.map(item => <article className="admin-panel inquiry-card" key={item.id}><header><div><h2>{item.name}</h2><a href={`mailto:${item.email}`}><Mail size={14} />{item.email}</a></div><StatusBadge status={item.status} /></header><div className="inquiry-meta"><span>{({ PHOTO: "Chụp ảnh", VIDEO: "Video sản phẩm", MIXED: "Ảnh & video", OTHER: "Ý tưởng khác" } as Record<string, string>)[item.projectType]}</span><time>{new Date(item.createdAt).toLocaleString("vi-VN")}</time></div><p className="inquiry-brief">{item.brief}</p><footer><a className="text-link" href={`mailto:${item.email}?subject=${encodeURIComponent(`Trao đổi về dự án của ${item.name}`)}`}>Phản hồi qua email ↗</a><select value={item.status} aria-label={`Trạng thái yêu cầu của ${item.name}`} onChange={event => void update(item.id, event.target.value)}><option value="NEW">Mới</option><option value="READ">Đã xem</option><option value="DONE">Hoàn tất</option></select></footer></article>)}</div>{!selected.length && <div className="admin-panel admin-empty"><Mail size={30} strokeWidth={1} /><p>Chưa có yêu cầu trong mục này.</p></div>}</>;
}
