import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBlob, requiredEnv } from "@/lib/env";
import { adminMutation, HttpError, routeError } from "@/lib/http";
import { sourceSize } from "@/lib/storage";
import { finishUpload } from "@/lib/uploads";
import { dispatchWorker } from "@/lib/worker-dispatch";

export async function POST(request: Request) {
  try {
    if (!isBlob()) throw new HttpError(404, "Blob chưa được bật ở môi trường này.");
    const body = await request.json() as HandleUploadBody;
    const response = await handleUpload({
      request, body, token: requiredEnv("BLOB_READ_WRITE_TOKEN"),
      onBeforeGenerateToken: async (pathname, payload) => {
        const user = await adminMutation(request);
        const upload = await db.uploadSession.findUnique({ where: { id: payload || "" }, include: { media: true } });
        if (!upload || upload.userId !== user.id || upload.path !== pathname || upload.expiresAt < new Date() || upload.completedAt) throw new Error("Phiên upload không hợp lệ.");
        return { allowedContentTypes: [upload.media.mime], maximumSizeInBytes: Number(upload.maxBytes), validUntil: upload.expiresAt.getTime(), addRandomSuffix: false, allowOverwrite: false, tokenPayload: upload.id };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const upload = await db.uploadSession.findUnique({ where: { id: tokenPayload || "" } });
        if (!upload || blob.pathname !== upload.path) throw new Error("Upload callback không khớp.");
        await finishUpload(upload.mediaId, blob.url, await sourceSize(blob.url));
        await dispatchWorker();
      },
    });
    return NextResponse.json(response);
  } catch (error) { return routeError(error); }
}
