import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminMutation, HttpError, routeError } from "@/lib/http";
import { mediaEditSchema } from "@/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await adminMutation(request);
    const { id } = await params;
    const data = z.object({ items: z.array(mediaEditSchema.extend({ id: z.string(), placement: z.enum(["MAIN", "BEHIND_THE_SCENES"]) })).max(200) }).parse(await request.json());
    const existing = await db.projectMedia.findMany({ where: { projectId: id }, select: { id: true } });
    const ids = new Set(existing.map(row => row.id));
    if (data.items.some(item => !ids.has(item.id)) || new Set(data.items.map(item => item.id)).size !== data.items.length) throw new HttpError(400, "Danh sách media chưa hợp lệ.");
    await db.$transaction(async tx => {
      for (const [sortOrder, item] of data.items.entries()) {
        const { id: linkId, ...metadata } = item;
        await tx.projectMedia.update({ where: { id: linkId }, data: { ...metadata, sortOrder } });
      }
      await tx.project.update({ where: { id }, data: { revision: { increment: 1 } } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return routeError(error); }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await adminMutation(request);
    const { id } = await params;
    const data = z.object({ mediaId: z.string(), placement: z.enum(["MAIN", "BEHIND_THE_SCENES"]) }).parse(await request.json());
    const media = await db.media.findUnique({ where: { id: data.mediaId } });
    if (!media || media.status !== "READY") throw new HttpError(400, "Chỉ thêm media đã xử lý xong.");
    await db.$transaction(async tx => {
      await tx.projectMedia.create({ data: { projectId: id, ...data, sortOrder: await tx.projectMedia.count({ where: { projectId: id } }) } });
      await tx.project.update({ where: { id }, data: { revision: { increment: 1 } } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return routeError(error); }
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await adminMutation(request);
    const { id } = await params;
    const { linkId } = z.object({ linkId: z.string() }).parse(await request.json());
    const link = await db.projectMedia.findFirst({ where: { id: linkId, projectId: id } });
    if (!link) throw new HttpError(404, "Không tìm thấy media trong dự án.");
    await db.$transaction([
      db.projectMedia.delete({ where: { id: linkId } }),
      db.project.update({ where: { id }, data: { revision: { increment: 1 }, ...(link.mediaId ? {} : {}) } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) { return routeError(error); }
}
