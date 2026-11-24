import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminMutation, HttpError, routeError } from "@/lib/http";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await adminMutation(request);
    const { id } = await params;
    const { archived, revision } = z.object({ archived: z.boolean(), revision: z.number().int().nonnegative() }).parse(await request.json());
    const changed = await db.project.updateMany({ where: { id, revision, status: archived ? "DRAFT" : "ARCHIVED", publicationState: { in: ["IDLE", "FAILED"] } }, data: { status: archived ? "ARCHIVED" : "DRAFT", revision: { increment: 1 } } });
    if (!changed.count) throw new HttpError(409, "Gỡ xuất bản trước khi lưu trữ, hoặc tải lại nếu dự án đã thay đổi.");
    await db.auditLog.create({ data: { userId: user.id, action: archived ? "PROJECT_ARCHIVE" : "PROJECT_RESTORE", targetId: id } });
    return NextResponse.json({ ok: true });
  } catch (error) { return routeError(error); }
}
