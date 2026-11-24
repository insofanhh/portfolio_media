import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import type { PublicProject } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { MediaImage } from "./media-image";

export function ProjectCard({ project, index = 0 }: { project: PublicProject; index?: number }) {
  const video = project.type === "VIDEO";
  return <Link className={`project-card ${video ? "card-film" : "card-photo"}`} href={`/work/${project.slug}`}><div className="project-card-art"><MediaImage media={project.cover} sizes={video ? "(max-width: 650px) 90vw, 33vw" : "(max-width: 650px) 90vw, 50vw"} /><span className="project-type-label">{project.tags[0] || (video ? "PRODUCT FILM" : "PHOTO SERIES")}</span>{video && <span className="card-play"><Play size={17} /></span>}<span className="card-editorial-title"><span>{project.title.split("—")[0].trim()}</span><small>{video ? "PHOTO & MOTION" : "STILL / FRAME"}</small></span><span className="card-index">{video ? formatDuration(project.cover.duration) || "9:16" : `${String(project.main.length).padStart(2, "0")} ảnh`} <span>/{String(index + 1).padStart(2, "0")}</span></span></div><div className="project-card-title"><h3>{project.title}</h3><ArrowUpRight size={18} /></div><p>{project.role}</p></Link>;
}
