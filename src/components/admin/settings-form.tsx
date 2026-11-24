"use client";
import { useState, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";
import type { Settings } from "@/lib/types";
import { api } from "@/lib/client-api";

export function SettingsForm({ initial, projects }: { initial: Settings; projects: { id: string; title: string }[] }) {
  const [form, setForm] = useState(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function change(key: keyof Settings, value: string) { setForm(current => ({ ...current, [key]: value })); setMessage(""); }
  async function save(event: FormEvent) {
    event.preventDefault(); setPending(true); setError(""); setMessage("");
    try { await api("/api/admin/settings", { method: "PUT", body: JSON.stringify(form) }); setMessage("Đã cập nhật nội dung website."); }
    catch (error) { setError(error instanceof Error ? error.message : "Chưa lưu được cài đặt."); }
    finally { setPending(false); }
  }
  return <form className="settings-form" onSubmit={save}>{error && <p role="alert" className="form-error">{error}</p>}{message && <p role="status" className="form-success">{message}</p>}<div className="admin-panel"><div className="panel-title"><h2>Thương hiệu & giới thiệu</h2><span>Nội dung trang chủ</span></div><fieldset disabled={pending}><div className="form-pair"><label>Tên hiển thị<input value={form.name} minLength={2} maxLength={80} required onChange={event => change("name", event.target.value)} /></label><label>Tên thương hiệu<input value={form.brand} minLength={2} maxLength={40} required onChange={event => change("brand", event.target.value)} /></label></div><label>Chức danh<input value={form.profession} maxLength={100} required onChange={event => change("profession", event.target.value)} /></label><label>Giới thiệu ngắn<textarea value={form.bio} maxLength={1000} rows={3} onChange={event => change("bio", event.target.value)} /></label><label>Giới thiệu chi tiết<textarea value={form.about} maxLength={5000} rows={6} onChange={event => change("about", event.target.value)} /></label><label>Dự án nổi bật trong banner<select value={form.heroProjectId} onChange={event => change("heroProjectId", event.target.value)}><option value="">Tự chọn dự án nổi bật đầu tiên</option>{projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label><p className="help-text">Nền blur sử dụng cùng poster với khung tác phẩm trong banner.</p></fieldset></div><div className="admin-panel"><div className="panel-title"><h2>Thông tin liên hệ</h2><span>Hiển thị công khai</span></div><fieldset disabled={pending}><div className="form-pair"><label>Email<input type="email" value={form.email} onChange={event => change("email", event.target.value)} /></label><label>Điện thoại<input value={form.phone} maxLength={40} onChange={event => change("phone", event.target.value)} /></label></div><label>Khu vực làm việc<input value={form.location} maxLength={100} onChange={event => change("location", event.target.value)} /></label><label>Instagram<input type="url" value={form.instagram} placeholder="https://instagram.com/..." onChange={event => change("instagram", event.target.value)} /></label><label>TikTok<input type="url" value={form.tiktok} placeholder="https://tiktok.com/@..." onChange={event => change("tiktok", event.target.value)} /></label><label>YouTube<input type="url" value={form.youtube} placeholder="https://youtube.com/@..." onChange={event => change("youtube", event.target.value)} /></label></fieldset></div><button className="button button-dark" disabled={pending}>{pending ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}Lưu thay đổi</button></form>;
}
