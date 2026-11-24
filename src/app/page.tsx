import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { publishedProjects, siteSettings } from "@/lib/projects";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSlider } from "@/components/hero-slider";
import { FilmSlider } from "@/components/film-slider";
import { ProjectCard } from "@/components/project-card";
import { BackstageSection } from "@/components/backstage-section";

export default async function HomePage() {
  const [projects, settings] = await Promise.all([publishedProjects(), siteSettings()]);
  const films = projects.filter(p => p.type === "VIDEO");
  const photos = projects.filter(p => p.type !== "VIDEO").slice(0, 2);
  const hero = projects.find(p => p.id === settings.heroProjectId) || films[0] || projects[0];
  const heroProjects = (hero ? [hero, ...projects.filter(project => project.id !== hero.id)] : []).slice(0, 5).map(({ id, slug, title, type, cover }) => ({ id, slug, title, type, cover }));
  const backstage = [...new Map(projects.flatMap(project => project.backstage.map(media => ({ media, project: project.title }))).map(item => [item.media.id, item])).values()];
  return <div className="site-shell"><SiteHeader brand={settings.brand} /><main id="main-content"><HeroSlider key={heroProjects.map(project => project.id).join(":")} projects={heroProjects} settings={{ name: settings.name, profession: settings.profession, bio: settings.bio }} />
    {!!films.length && <section className="content-section panel-section" id="selected-work"><div className="section-heading"><div><p className="eyebrow">MOTION / SELECTED FILMS</p><h2>Câu chuyện theo chiều dọc<span>.</span></h2></div><Link href="/work?type=VIDEO" className="text-link">Tất cả video <ArrowUpRight size={15} /></Link></div><FilmSlider key={films.map(project => project.id).join(":")} projects={films.map(({ id, slug, title, role, client, year, tags, cover }) => ({ id, slug, title, role, client, year, tags, cover }))} /></section>}
    {!!photos.length && <section className="content-section photo-section"><div className="section-heading"><div><p className="eyebrow">STILLS / PHOTOGRAPHY</p><h2>Những khung hình ở lại<span>.</span></h2></div><Link href="/work?type=PHOTO" className="text-link">Tất cả bộ ảnh <ArrowUpRight size={15} /></Link></div><div className="photo-grid">{photos.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}</div></section>}
    <BackstageSection items={backstage} />
    <section className="content-section about-section"><div><p className="eyebrow">A LITTLE ABOUT ME</p><h2>Quan sát kỹ hơn.<br />Kể chuyện sâu hơn.</h2></div><div><p>{settings.about}</p><div className="service-list"><span>Nhiếp ảnh sản phẩm <ArrowUpRight size={15} /></span><span>Video sản phẩm dọc <ArrowUpRight size={15} /></span><span>Hậu kỳ & chỉnh màu <ArrowUpRight size={15} /></span></div><Link href="/about" className="text-link">Tìm hiểu thêm về tôi ↗</Link></div></section>
    <section className="content-section process-section"><p className="eyebrow">HOW WE CREATE</p><div className="process-grid">{[["01", "Lắng nghe", "Hiểu mục tiêu & brief"], ["02", "Lên ý tưởng", "Concept & moodboard"], ["03", "Sản xuất", "Chụp ảnh & quay phim"], ["04", "Hoàn thiện", "Hậu kỳ & bàn giao"]].map(([number, title, text]) => <div key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section>
    <section className="content-section contact-section"><div><p className="eyebrow">LET&apos;S CREATE TOGETHER</p><h2>Dự án tiếp theo,<br />có thể là của bạn.</h2></div><Link href="/contact" className="button button-dark">Chia sẻ ý tưởng <ArrowUpRight size={17} /></Link></section>
  </main><SiteFooter settings={settings} /></div>;
}
