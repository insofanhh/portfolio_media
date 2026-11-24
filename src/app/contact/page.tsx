import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { siteSettings } from "@/lib/projects";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ContactForm } from "@/components/contact-form";
export const metadata: Metadata = { title: "Liên hệ", description: "Chia sẻ brief chụp ảnh hoặc video để cùng tạo nên câu chuyện tiếp theo.", alternates: { canonical: "/contact" } };
export default async function ContactPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const [settings, query] = await Promise.all([siteSettings(), searchParams]);
  return <div className="site-shell"><SiteHeader brand={settings.brand} /><main id="main-content" className="contact-page"><div><p className="eyebrow">LET&apos;S MAKE SOMETHING MEANINGFUL</p><h1>Câu chuyện tiếp theo,<br />có thể là của bạn<span>.</span></h1><p>Một ý tưởng vừa nảy ra, một sản phẩm sắp ra mắt hay một câu chuyện đang chờ được kể — tôi luôn sẵn sàng lắng nghe.</p><div className="contact-details">{settings.email && <a href={`mailto:${settings.email}`}><Mail size={18} />{settings.email}</a>}{settings.phone && <a href={`tel:${settings.phone.replace(/[^+0-9]/g, "")}`}><Phone size={18} />{settings.phone}</a>}{settings.location && <span><MapPin size={18} />{settings.location}</span>}</div></div><ContactForm project={query.project?.slice(0, 150)} /></main><SiteFooter settings={settings} /></div>;
}
