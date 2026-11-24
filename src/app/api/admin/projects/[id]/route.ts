import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { adminMutation, HttpError, routeError } from "@/lib/http";
import { projectSchema, mediaEditSchema } from "@/lib/validation";
import { projectInclude } from "@/lib/projects";
import { jsonSafe } from "@/lib/utils";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    if (!await currentUser()) throw new HttpError(401, "Vui lòng đăng nhập.");
    const { id } = await context.params;
    const project = await db.project.findUnique({ where: { id }, include: projectInclude });
    if (!project) throw new HttpError(404, "Không tìm thấy dự án.");
    return NextResponse.json(jsonSafe(project), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return routeError(error); }
}
export async function PATCH(request: Request, context: Context) {
  try {
    const user = await adminMutation(request);
    const { id } = await context.params;
    const raw = await request.json();
    const data = projectSchema.parse(raw);
    const revision = z.number().int().nonnegative().parse(raw.revision);
    const current = await db.project.findUnique({ where: { id } });
    if (!current) throw new HttpError(404, "Không tìm thấy dự án.");
    if (current.status === "PUBLISHED" && data.slug !== current.slug) throw new HttpError(409, "Hãy gỡ xuất bản trước khi đổi đường dẫn dự án.");
    if (data.coverMediaId && !await db.projectMedia.count({ where: { projectId: id, mediaId: data.coverMediaId } })) throw new HttpError(400, "Ảnh cover phải thuộc dự án.");
    const items = z.array(mediaEditSchema.extend({ id: z.string(), placement: z.enum(["MAIN", "BEHIND_THE_SCENES"]) })).max(200).optional().parse(raw.mediaItems);
    await db.$transaction(async tx => {
      const result = await tx.project.updateMany({ where: { id, revision }, data: { ...data, revision: { increment: 1 } } });
      if (!result.count) throw new HttpError(409, "Dữ liệu đã thay đổi. Vui lòng tải lại trước khi lưu.");
      if (items) {
        const existing = await tx.projectMedia.findMany({ where: { projectId: id }, select: { id: true } });
        const ids = new Set(existing.map(row => row.id));
        if (items.length !== existing.length || new Set(items.map(item => item.id)).size !== items.length || items.some(item => !ids.has(item.id))) throw new HttpError(409, "Danh sách media đã thay đổi. Hãy tải lại dự án.");
        for (const [sortOrder, item] of items.entries()) { const { id: linkId, ...metadata } = item; await tx.projectMedia.update({ where: { id: linkId }, data: { ...metadata, sortOrder } }); }
      }
    });
    await db.auditLog.create({ data: { userId: user.id, action: "PROJECT_UPDATE", targetId: id } });
    return NextResponse.json({ ok: true, revision: revision + 1 });
  } catch (error) { return routeError(error); }
}
