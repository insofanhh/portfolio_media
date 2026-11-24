import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectInclude, projectView } from "@/lib/projects";
import { ProjectDetail } from "@/components/project-detail";
export const metadata = { title: "Xem trước bản nháp", robots: { index: false, follow: false } };
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const project = await db.project.findUnique({ where: { id: (await params).id }, include: projectInclude });
  if (!project) notFound();
  if (!project.media.some(row => row.placement === "MAIN" && row.media.status === "READY")) return <div className="full-state"><h1>Media chưa sẵn sàng.</h1><p>Thêm tác phẩm chính và chờ xử lý hoàn tất để xem trước.</p><a className="button button-dark" href={`/admin/projects/${project.id}`}>Trở về chỉnh sửa ↗</a></div>;
  return <div id="main-content"><ProjectDetail project={projectView(project)} preview /></div>;
}
