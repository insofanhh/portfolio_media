"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, FolderOpen, Images, LayoutDashboard, LogOut, Menu, MessageSquareText, Settings2, X } from "lucide-react";
import { api } from "@/lib/client-api";

const navigation = [
  { href: "/admin", label: "Tổng quan", Icon: LayoutDashboard },
  { href: "/admin/projects", label: "Dự án", Icon: FolderOpen },
  { href: "/admin/media", label: "Thư viện media", Icon: Images },
  { href: "/admin/inquiries", label: "Yêu cầu liên hệ", Icon: MessageSquareText },
  { href: "/admin/settings", label: "Cài đặt website", Icon: Settings2 },
];
export function AdminShell({ children, email }: { children: React.ReactNode; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    try { await api("/api/auth/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); }
    catch { setError("Chưa đăng xuất được. Vui lòng thử lại."); }
  }
  return <div className="admin-layout"><aside className={`admin-sidebar ${open ? "is-open" : ""}`}><Link href="/admin" className="brand"><span className="logo">f.</span><span>FRAME<small>CREATIVE WORKSPACE</small></span></Link><button className="admin-sidebar-close icon-button" aria-label="Đóng menu quản trị" onClick={() => setOpen(false)}><X size={21} /></button><p className="eyebrow">WORKSPACE</p><nav aria-label="Quản trị">{navigation.map(({ href, label, Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={pathname === href || href !== "/admin" && pathname.startsWith(href) ? "is-active" : ""}><Icon size={18} />{label}</Link>)}</nav><div className="admin-sidebar-bottom"><Link href="/" target="_blank">Xem website <ArrowUpRight size={16} /></Link><span>{email}</span><button onClick={logout}><LogOut size={16} />Đăng xuất</button>{error && <p role="alert">{error}</p>}</div></aside><div className="admin-main"><header className="admin-topbar"><button className="admin-menu-button icon-button" onClick={() => setOpen(true)} aria-label="Mở menu quản trị"><Menu size={20} /></button><span>YOUR CREATIVE SPACE</span><Link href="/admin/projects/new" className="button button-dark">Thêm dự án <span aria-hidden="true">+</span></Link></header><main id="main-content" className="admin-content">{children}</main></div></div>;
}
