import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Aperture } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";
export default async function LoginPage() {
  if (await currentUser()) redirect("/admin");
  return <main className="login-page" id="main-content"><Link href="/" className="login-back"><ArrowLeft size={16} />Trở về portfolio</Link><div className="login-visual"><div className="login-orbit" /><Aperture size={100} strokeWidth={.6} /><p>A space for<br /><span>your next story.</span></p><span className="eyebrow">FRAME / CREATIVE WORKSPACE</span></div><div className="login-panel"><span className="logo">f.</span><p className="eyebrow">WELCOME BACK</p><h1>Không gian sáng tạo<br />của bạn.</h1><p>Đăng nhập để quản lý dự án, hình ảnh và những câu chuyện tiếp theo.</p><LoginForm /></div></main>;
}
