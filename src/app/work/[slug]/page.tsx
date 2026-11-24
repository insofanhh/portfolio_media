import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publishedProject, publishedProjects } from "@/lib/projects";
import { posterUrl } from "@/components/media-image";
import { ProjectDetail } from "@/components/project-detail";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = await publishedProject((await params).slug);
  if (!project) return { title: "Không tìm thấy dự án" };
  const image = posterUrl(project.cover, 1600);
  return { title: project.seoTitle || project.title, description: project.seoDescription || project.summary, alternates: { canonical: `/work/${project.slug}` }, openGraph: { title: project.title, description: project.summary, images: image ? [{ url: image }] : [] } };
}
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const project = await publishedProject((await params).slug);
  if (!project) notFound();
  const projects = await publishedProjects();
  const next = projects.length > 1 ? projects[(projects.findIndex(item => item.id === project.id) + 1) % projects.length] : undefined;
  return <div id="main-content"><ProjectDetail key={project.id} project={project} next={next ? { slug: next.slug, title: next.title } : undefined} /></div>;
}
