import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireUser } from "@/lib/auth";
export default async function AdminProjects() {
  await requireUser();
  const projects = await db.project.findMany({ orderBy: { updatedAt: "desc" }, include: { _count: { select: { media: true } } } });
  return <><div className="admin-page-heading"><div><p className="eyebrow">YOUR SELECTED STORIES</p><h1>Dự án</h1><p>Chọn một dự án để chỉnh sửa hoặc bắt đầu câu chuyện mới.</p></div><Link href="/admin/projects/new" className="button button-dark">Thêm dự án +</Link></div><section className="admin-panel"><div className="admin-project-table">{projects.map(project => <Link href={`/admin/projects/${project.id}`} key={project.id}><div><strong>{project.title}</strong><small>{project.type === "PHOTO" ? "Bộ ảnh" : project.type === "VIDEO" ? "Video" : "Ảnh & video"} · {project._count.media} media · {project.year}</small></div><div className="project-table-status"><StatusBadge status={project.publicationState === "IDLE" ? project.status : project.publicationState} />{project.publishedRevision !== null && project.revision > project.publishedRevision && <small>Có bản nháp mới</small>}</div><ArrowUpRight size={19} /></Link>)}</div>{!projects.length && <div className="admin-empty"><p>Chưa có dự án. Hãy tạo bản nháp đầu tiên.</p></div>}</section></>;
}
