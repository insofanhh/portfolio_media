import path from "node:path";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { limits } from "./env";
import { HttpError } from "./http";

export const allowedMimes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
export function validateUpload(mime: string, size: number) {
  if (!allowedMimes.includes(mime)) throw new HttpError(400, "Dùng JPEG, PNG, WebP, MP4, MOV hoặc WebM. Chuyển HEIC sang JPEG trước khi upload.");
  const maximum = mime.startsWith("image/") ? limits.image : limits.video;
  if (!Number.isSafeInteger(size) || size <= 0 || size > maximum) throw new HttpError(400, "Tệp vượt quá giới hạn dung lượng.");
  return maximum;
}
export async function reserveUpload(userId: string, name: string, mime: string, size: number) {
  const maximum = validateUpload(mime, size);
  const total = await db.media.aggregate({ _sum: { bytes: true } });
  if (Number(total._sum.bytes || 0) + size > limits.storage) throw new HttpError(400, "Kho media đã đạt giới hạn dung lượng.");
  const extension = path.extname(name).replace(/[^.a-zA-Z0-9]/g, "").slice(0, 10) || ".bin";
  const key = `sources/${randomUUID()}/original${extension}`;
  return db.media.create({ data: {
    originalName: name.slice(0, 220), sourceKey: key, mime, bytes: BigInt(size),
    upload: { create: { userId, path: key, maxBytes: BigInt(maximum), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } },
  }, include: { upload: true } });
}
export async function finishUpload(mediaId: string, sourceKey: string, size: number) {
  return db.$transaction(async tx => {
    const media = await tx.media.findUnique({ where: { id: mediaId }, include: { upload: true } });
    if (!media || !media.upload) throw new HttpError(404, "Không tìm thấy phiên upload.");
    if (media.upload.completedAt) return false;
    if (media.upload.expiresAt < new Date() || size > Number(media.upload.maxBytes)) throw new HttpError(400, "Phiên upload đã hết hạn hoặc tệp vượt giới hạn.");
    if (size !== Number(media.bytes)) throw new HttpError(400, "Dung lượng tệp không khớp với phiên upload.");
    const completed = await tx.uploadSession.updateMany({ where: { id: media.upload.id, completedAt: null }, data: { completedAt: new Date() } });
    if (!completed.count) return false;
    await tx.media.update({ where: { id: mediaId }, data: { sourceKey, status: "QUEUED" } });
    await tx.processingJob.create({ data: { type: "PROCESS_MEDIA", mediaId, revision: media.version } });
    return true;
  });
}
