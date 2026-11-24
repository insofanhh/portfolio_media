import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminMutation, HttpError, routeError } from "@/lib/http";
import { dispatchWorker, workerConfigured } from "@/lib/worker-dispatch";
import { projectInclude } from "@/lib/projects";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await adminMutation(request);
    if (!workerConfigured()) throw new HttpError(503, "Cần cấu hình worker trước khi xuất bản.");
    const { id } = await params;
    const project = await db.project.findUnique({ where: { id }, include: projectInclude });
    if (!project) throw new HttpError(404, "Không tìm thấy dự án.");
    if (project.status === "ARCHIVED") throw new HttpError(409, "Khôi phục dự án thành bản nháp trước khi xuất bản.");
    if (["QUEUED", "PUBLISHING"].includes(project.publicationState)) throw new HttpError(409, "Dự án đang được xuất bản.");
    if (!project.media.some(row => row.placement === "MAIN")) throw new HttpError(400, "Hãy thêm tác phẩm chính trước.");
    if (project.media.some(row => row.media.status !== "READY")) throw new HttpError(400, "Chờ tất cả media xử lý xong rồi xuất bản.");
    if (project.media.some(row => row.media.mime.startsWith("image/") && !row.alt.trim())) throw new HttpError(400, "Hãy bổ sung văn bản thay thế cho các ảnh.");
    const job = await db.$transaction(async tx => {
      const locked = await tx.project.updateMany({ where: { id, publicationState: { in: ["IDLE", "FAILED"] }, revision: project.revision }, data: { publicationState: "QUEUED", publicationError: null } });
      if (!locked.count) throw new HttpError(409, "Dự án đã thay đổi hoặc đang được xuất bản.");
      return tx.processingJob.create({ data: { type: "PUBLISH_PROJECT", projectId: id, revision: project.revision } });
    });
    await db.auditLog.create({ data: { userId: user.id, action: "PROJECT_PUBLISH_QUEUED", targetId: id } });
    await dispatchWorker();
    return NextResponse.json({ ok: true, jobId: job.id }, { status: 202 });
  } catch (error) { return routeError(error); }
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await adminMutation(request);
    const { id } = await params;
    const project = await db.project.findUnique({ where: { id }, include: { publicReferences: true } });
    if (!project) throw new HttpError(404, "Không tìm thấy dự án.");
    const job = await db.$transaction(async tx => {
      const locked = await tx.project.updateMany({ where: { id, publicationState: { in: ["IDLE", "FAILED"] } }, data: { publicationState: "QUEUED", publicationError: null } });
      if (!locked.count) throw new HttpError(409, "Dự án đang xử lý. Vui lòng đợi.");
      return tx.processingJob.create({ data: { type: "UNPUBLISH_PROJECT", projectId: id, payload: { mediaIds: project.publicReferences.map(ref => ref.mediaId) } } });
    });
    await db.auditLog.create({ data: { userId: user.id, action: "PROJECT_UNPUBLISH_QUEUED", targetId: id } });
    await dispatchWorker();
    return NextResponse.json({ ok: true, jobId: job.id }, { status: 202 });
  } catch (error) { return routeError(error); }
}
