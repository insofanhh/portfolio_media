import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { adminMutation, HttpError, routeError } from "@/lib/http";
import { jsonSafe } from "@/lib/utils";
import { dispatchWorker } from "@/lib/worker-dispatch";

export async function GET(request: Request) {
  try {
    if (!await currentUser()) throw new HttpError(401, "Vui lòng đăng nhập.");
    const query = new URL(request.url).searchParams;
    const cursor = query.get("cursor");
    const search = (query.get("q") || "").trim().slice(0, 200);
    const media = await db.media.findMany({ where: search ? { originalName: { contains: search } } : {}, take: 60, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), orderBy: { createdAt: "desc" }, include: { variants: true, projects: { include: { project: { select: { id: true, title: true } } } }, _count: { select: { publicReferences: true } } } });
    return NextResponse.json({ items: jsonSafe(media), nextCursor: media.length === 60 ? media[59].id : null });
  } catch (error) { return routeError(error); }
}
export async function POST(request: Request) {
  try {
    const user = await adminMutation(request);
    const { mediaId, action } = z.object({ mediaId: z.string(), action: z.enum(["retry", "delete", "restore"]) }).parse(await request.json());
    const media = await db.media.findUnique({ where: { id: mediaId }, include: { variants: true, _count: { select: { projects: true, publicReferences: true } } } });
    if (!media) throw new HttpError(404, "Không tìm thấy media.");
    if (action === "retry") {
      if (media.status !== "FAILED") throw new HttpError(400, "Chỉ thử lại media đã xử lý lỗi.");
      await db.$transaction([
        db.media.update({ where: { id: mediaId }, data: { status: "QUEUED", error: null } }),
        db.processingJob.create({ data: { mediaId, type: "PROCESS_MEDIA", revision: media.version } }),
      ]);
      await dispatchWorker();
    }
    if (action === "delete") {
      if (media._count.projects || media._count.publicReferences) throw new HttpError(409, "Gỡ media khỏi các dự án trước khi xóa.");
      if (["UPLOADING", "QUEUED", "PROCESSING"].includes(media.status)) throw new HttpError(409, "Chờ upload/xử lý hoàn tất trước khi xóa.");
      const deleteAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.$transaction([
        db.media.update({ where: { id: mediaId }, data: { status: "DELETING", deleteAfter } }),
        db.processingJob.create({ data: { mediaId, type: "DELETE_MEDIA", runAt: deleteAfter } }),
      ]);
    }
    if (action === "restore") {
      if (media.status !== "DELETING") throw new HttpError(400, "Media chưa được đưa vào thùng rác.");
      await db.media.update({ where: { id: mediaId }, data: { status: media.variants.length ? "READY" : "FAILED", deleteAfter: null } });
    }
    await db.auditLog.create({ data: { userId: user.id, action: `MEDIA_${action.toUpperCase()}`, targetId: mediaId } });
    return NextResponse.json({ ok: true });
  } catch (error) { return routeError(error); }
}
