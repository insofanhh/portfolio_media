import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { publishedProjects, siteSettings } from "@/lib/projects";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PhotoAccordion } from "@/components/photo-accordion";
import { FilmSlider } from "@/components/film-slider";

export const metadata: Metadata = { title: "Dự án", description: "Khám phá các bộ ảnh và phim sản phẩm, cùng câu chuyện và vai trò trong từng dự án.", alternates: { canonical: "/work" } };
export default async function WorkPage({ searchParams }: { searchParams: Promise<{ type?: string; page?: string }> }) {
  const [projects, settings, query] = await Promise.all([publishedProjects(), siteSettings(), searchParams]);
  const type = ["PHOTO", "VIDEO", "MIXED"].includes(query.type || "") ? query.type! : "ALL";
  const filtered = projects.filter(project => type === "ALL" || project.type === type);
  const pages = Math.max(1, Math.ceil(filtered.length / 12));
  const page = Math.max(1, Math.min(pages, Number(query.page) || 1));
  const selected = filtered.slice((page - 1) * 12, page * 12);
  const url = (next: number) => `/work?${type !== "ALL" ? `type=${type}&` : ""}page=${next}`;
  return <div className="site-shell"><SiteHeader brand={settings.brand} /><main id="main-content" className="work-page"><header className="page-heading"><p className="eyebrow">SELECTED WORK / PHOTO & MOTION</p><h1>Mỗi dự án,<br />một góc nhìn riêng<span>.</span></h1><p>Hình ảnh, chuyển động và những câu chuyện tôi đã góp phần tạo nên.</p></header><nav className="project-filters" aria-label="Lọc dự án">{[["ALL", "Tất cả"], ["VIDEO", "Video"], ["PHOTO", "Nhiếp ảnh"], ["MIXED", "Ảnh & video"]].map(([value, label]) => <Link key={value} href={value === "ALL" ? "/work" : `/work?type=${value}`} className={type === value ? "is-active" : ""} aria-current={type === value ? "page" : undefined}>{label}<span>{value === "ALL" ? projects.length : projects.filter(project => project.type === value).length}</span></Link>)}</nav>{!selected.length && <div className="empty-state"><h2>Những câu chuyện mới đang được chuẩn bị.</h2><p>Hãy quay lại sau hoặc chia sẻ ý tưởng của bạn với tôi.</p><Link href="/contact" className="button button-dark">Cùng hợp tác ↗</Link></div>}{["VIDEO", "PHOTO", "MIXED"].map(group => { const entries = selected.filter(project => project.type === group); return entries.length ? <section className="work-group" key={group}><div className="section-heading"><p className="eyebrow">{group === "VIDEO" ? "MOTION / VERTICAL FILMS" : group === "PHOTO" ? "STILLS / PHOTOGRAPHY" : "PHOTO & MOTION"}</p></div>{group === "VIDEO" ? <FilmSlider key={entries.map(project => project.id).join(":")} projects={entries.map(({ id, slug, title, role, client, year, tags, cover, main }) => ({ id, slug, title, role, client, year, tags, cover, video: main.find(media => media.kind === "video") || null }))} /> : <PhotoAccordion key={entries.map(project => project.id).join(":")} projects={entries.map(({ id, slug, title, role, type, cover, main }) => ({ id, slug, title, role, type, cover, photoCount: main.filter(media => media.kind === "image").length, mediaCount: main.length }))} />}</section> : null; })}{pages > 1 && <nav className="pagination" aria-label="Phân trang">{page > 1 && <Link href={url(page - 1)}><ArrowLeft size={16} /> Trang trước</Link>}<span>{page} / {pages}</span>{page < pages && <Link href={url(page + 1)}>Trang sau <ArrowRight size={16} /></Link>}</nav>}</main><SiteFooter settings={settings} /></div>;
}
