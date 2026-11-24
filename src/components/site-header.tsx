"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

export function Brand({ name = "FRAME" }: { name?: string }) {
  return <Link href="/" className="brand" aria-label={`${name}, về trang chủ`}><span className="logo">f.</span><span>{name}<small>PHOTO & FILM</small></span></Link>;
}
export function SiteHeader({ brand }: { brand: string }) {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><Brand name={brand} /><nav className={open ? "site-navigation is-open" : "site-navigation"} aria-label="Điều hướng chính"><Link href="/work" onClick={() => setOpen(false)}>Dự án</Link><Link href="/#behind-the-scenes" onClick={() => setOpen(false)}>Hậu trường</Link><Link href="/about" onClick={() => setOpen(false)}>Giới thiệu</Link><Link href="/contact" className="mobile-contact" onClick={() => setOpen(false)}>Liên hệ</Link></nav><Link href="/contact" className="header-contact">Cùng hợp tác <ArrowUpRight size={16} /></Link><button className="menu-toggle icon-button" aria-label={open ? "Đóng menu" : "Mở menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button></header>;
}
