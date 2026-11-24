import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminMutation, HttpError, rateLimit, routeError } from "@/lib/http";
import { reserveUpload } from "@/lib/uploads";
import { isBlob } from "@/lib/env";
import { workerConfigured } from "@/lib/worker-dispatch";

export async function POST(request: Request) {
  try {
    const user = await adminMutation(request);
    await rateLimit(request, "upload", 100, 3600);
    if (!workerConfigured()) throw new HttpError(503, "Chưa cấu hình worker xử lý media.");
    const input = z.object({ name: z.string().min(1).max(220), mime: z.string(), size: z.number().int().positive(), projectId: z.string().optional(), placement: z.enum(["MAIN", "BEHIND_THE_SCENES"]).default("MAIN") }).parse(await request.json());
    if (input.projectId && !await db.project.count({ where: { id: input.projectId } })) throw new HttpError(404, "Không tìm thấy dự án.");
    const media = await reserveUpload(user.id, input.name, input.mime, input.size);
    if (input.projectId) await db.$transaction(async tx => {
      await tx.projectMedia.create({ data: { projectId: input.projectId!, mediaId: media.id, placement: input.placement, sortOrder: await tx.projectMedia.count({ where: { projectId: input.projectId } }) } });
      await tx.project.update({ where: { id: input.projectId }, data: { revision: { increment: 1 } } });
    });
    return NextResponse.json({ mediaId: media.id, sessionId: media.upload!.id, path: media.upload!.path, driver: isBlob() ? "blob" : "local" }, { status: 201 });
  } catch (error) { return routeError(error); }
}
