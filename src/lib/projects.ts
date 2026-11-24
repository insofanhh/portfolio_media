import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { db } from "./db";
import { defaultSettings, type Settings, type PublicMedia, type PublicProject } from "./types";
import { isBlob } from "./env";

export const projectInclude = { media: { include: { media: { include: { variants: true } } }, orderBy: { sortOrder: "asc" as const } } } satisfies Prisma.ProjectInclude;
export type ProjectRecord = Prisma.ProjectGetPayload<{ include: typeof projectInclude }>;
export function mediaView(row: ProjectRecord["media"][number], published = false): PublicMedia {
  const media = row.media;
  return {
    id: media.id, kind: media.mime.startsWith("video/") ? "video" : "image", name: media.originalName,
    alt: row.alt || row.caption || media.originalName, caption: row.caption,
    width: media.width || 1080, height: media.height || 1920, duration: media.duration,
    focalX: row.focalX, focalY: row.focalY,
    variants: media.variants.filter(v => v.kind !== "HLS_ASSET" && (published ? Boolean(v.publicKey) && v.kind !== "MASTER" : v.kind !== "MASTER")).map(v => ({
      id: v.id, kind: v.kind, name: v.name, width: v.width, height: v.height, bytes: Number(v.bytes), mime: v.mime,
      url: published && isBlob() ? v.publicKey! : `/api/media/${media.id}/${v.name}?v=${media.version}`,
    })),
  };
}
export function projectView(project: ProjectRecord, published = false): PublicProject {
  const ready = project.media.filter(row => row.media.status === "READY");
  const main = ready.filter(row => row.placement === "MAIN").map(row => mediaView(row, published));
  const backstage = ready.filter(row => row.placement === "BEHIND_THE_SCENES").map(row => mediaView(row, published));
  const cover = [...main, ...backstage].find(m => m.id === project.coverMediaId) || main[0];
  if (!cover || !main.length) throw new Error("Dự án cần ít nhất một tác phẩm đã xử lý.");
  return {
    id: project.id, slug: project.slug, title: project.title, type: project.type, summary: project.summary,
    concept: project.concept, scope: project.scope, role: project.role, client: project.client, year: project.year,
    credits: project.credits, tags: Array.isArray(project.tags) ? project.tags.filter((t): t is string => typeof t === "string") : [],
    featuredOrder: project.featuredOrder, isDemo: project.isDemo, seoTitle: project.seoTitle, seoDescription: project.seoDescription,
    publishedAt: (project.publishedAt || new Date()).toISOString(), cover, main, backstage,
  };
}
export const publishedProjects = unstable_cache(async () => {
  const rows = await db.project.findMany({ where: { status: "PUBLISHED", publicSnapshot: { not: Prisma.DbNull } }, select: { publicSnapshot: true }, orderBy: { publishedAt: "desc" } });
  return rows.map(row => row.publicSnapshot as unknown as PublicProject).sort((a, b) => a.featuredOrder - b.featuredOrder);
}, ["published-projects"], { tags: ["published-projects"], revalidate: 60 });
export async function publishedProject(slug: string) { return (await publishedProjects()).find(project => project.slug === slug); }
export const siteSettings = unstable_cache(async (): Promise<Settings> => {
  const settings = await db.siteSettings.findUnique({ where: { id: "site" } });
  return { ...defaultSettings, ...(settings?.data as Partial<Settings> || {}) };
}, ["site-settings"], { tags: ["site-settings"], revalidate: 60 });
