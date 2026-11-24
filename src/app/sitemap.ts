import type { MetadataRoute } from "next";
import { publishedProjects } from "@/lib/projects";
import { appUrl } from "@/lib/env";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  return [...["", "/work", "/about", "/contact", "/privacy"].map(path => ({ url: base + path, changeFrequency: "weekly" as const, priority: path ? .7 : 1 })), ...(await publishedProjects()).map(project => ({ url: `${base}/work/${project.slug}`, lastModified: project.publishedAt, changeFrequency: "monthly" as const, priority: .8 }))];
}
