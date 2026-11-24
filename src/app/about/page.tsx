import Link from "next/link";
import type { Metadata } from "next";
import { Aperture, ArrowUpRight, Clapperboard, Palette } from "lucide-react";
import { siteSettings, publishedProjects } from "@/lib/projects";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MediaImage } from "@/components/media-image";
export const metadata: Metadata = { title: "Giới thiệu", alternates: { canonical: "/about" } };
export default async function AboutPage() {
  const [settings, projects] = await Promise.all([siteSettings(), publishedProjects()]);
  return <div className="site-shell"><SiteHeader brand={settings.brand} /><main id="main-content" className="editorial-page"><div className="about-intro"><div><p className="eyebrow">BEHIND THE LENS / ABOUT ME</p><h1>{settings.name}<span>{settings.profession}</span></h1><p>{settings.bio}</p><p>{settings.about}</p><Link href="/contact" className="button button-dark">Cùng tạo nên câu chuyện mới <ArrowUpRight size={17} /></Link></div>{projects[0] && <div className="about-visual"><MediaImage media={projects[0].backstage[0] || projects[0].cover} /><span>A closer look at the process.</span></div>}</div><section className="about-services"><p className="eyebrow">WHAT I DO</p><h2>Từ ý tưởng đến khung hình.</h2><div>{[[Aperture, "Nhiếp ảnh sản phẩm", "Hình ảnh chỉn chu, tập trung vào ánh sáng, chất liệu và cảm xúc."], [Clapperboard, "Video sản phẩm", "Những câu chuyện theo chiều dọc, phù hợp với nhịp xem trên điện thoại."], [Palette, "Hậu kỳ & chỉnh màu", "Hoàn thiện một ngôn ngữ thị giác nhất quán cho mỗi dự án."]].map(([Icon, title, description]) => { const ServiceIcon = Icon as typeof Aperture; return <article key={String(title)}><ServiceIcon size={25} /><h3>{String(title)}</h3><p>{String(description)}</p></article>; })}</div></section></main><SiteFooter settings={settings} /></div>;
}
