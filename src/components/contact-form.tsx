"use client";
import { useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, LoaderCircle } from "lucide-react";

export function ContactForm({ project = "" }: { project?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setSent(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Không gửi được lời nhắn. Vui lòng thử lại."); }
    finally { setPending(false); }
  }
  if (sent) return <div className="contact-success" role="status"><CheckCircle2 size={36} /><h2>Đã nhận được lời nhắn.</h2><p>Cảm ơn bạn đã chia sẻ ý tưởng. Tôi sẽ phản hồi qua email bạn đã cung cấp.</p><button className="text-link" onClick={() => setSent(false)}>Gửi một lời nhắn khác ↗</button></div>;
  return <form className="contact-form" onSubmit={submit}><div className="form-pair"><label>Họ tên<input name="name" autoComplete="name" placeholder="Tên của bạn" minLength={2} maxLength={100} required /></label><label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={200} required /></label></div><label>Bạn đang cần hỗ trợ về<select name="projectType" defaultValue="VIDEO"><option value="VIDEO">Video sản phẩm</option><option value="PHOTO">Chụp ảnh</option><option value="MIXED">Chụp ảnh & video</option><option value="OTHER">Một ý tưởng khác</option></select></label><label>Chia sẻ về dự án<textarea name="brief" defaultValue={project ? `Tôi muốn trao đổi về dự án tương tự “${project}”.\n` : ""} rows={6} minLength={15} maxLength={5000} placeholder="Ý tưởng, mục tiêu, thời gian dự kiến..." required /></label><div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div><p className="form-privacy">Thông tin được dùng để phản hồi yêu cầu hợp tác của bạn.</p>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark" disabled={pending}>{pending ? <><LoaderCircle size={16} className="spin" />Đang gửi...</> : <>Gửi lời nhắn <ArrowUpRight size={16} /></>}</button></form>;
}
