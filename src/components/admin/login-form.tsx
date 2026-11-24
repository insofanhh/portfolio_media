"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { api } from "@/lib/client-api";
export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try { await api("/api/auth/login", { method: "POST", body: JSON.stringify(values) }); router.replace("/admin"); router.refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : "Không đăng nhập được."); setPending(false); }
  }
  return <form onSubmit={submit} className="login-form"><label>Email<input name="email" type="email" autoComplete="username" required placeholder="Email quản trị" /></label><label>Mật khẩu<div className="password-field"><input name="password" type={visible ? "text" : "password"} autoComplete="current-password" required maxLength={256} placeholder="Mật khẩu của bạn" /><button type="button" className="icon-button" aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark" disabled={pending}>{pending ? <><LoaderCircle size={16} className="spin" />Đang đăng nhập...</> : <>Vào workspace <ArrowRight size={16} /></>}</button></form>;
}
