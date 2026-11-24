import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { isBlob } from "@/lib/env";
import { adminMutation, HttpError, routeError } from "@/lib/http";
import { removeStored, writeSource } from "@/lib/storage";
import { finishUpload } from "@/lib/uploads";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (isBlob() || process.env.VERCEL) throw new HttpError(404, "Endpoint này chỉ dùng trong môi trường local.");
    const user = await adminMutation(request);
    const { id } = await params;
    const media = await db.media.findUnique({ where: { id }, include: { upload: true } });
    if (!media?.upload || media.upload.userId !== user.id || media.upload.completedAt || media.upload.expiresAt < new Date()) throw new HttpError(400, "Phiên upload không còn hiệu lực.");
    if (!request.body) throw new HttpError(400, "Không nhận được tệp.");
    const attemptKey = `${media.sourceKey}.${randomUUID()}`;
    try {
      const size = await writeSource(attemptKey, request.body, Number(media.upload.maxBytes));
      if (!await finishUpload(media.id, attemptKey, size)) await removeStored(attemptKey);
    } catch (error) {
      await removeStored(attemptKey);
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) { return routeError(error); }
}
