import { Prisma } from "@prisma/client";
import { db } from "../src/lib/db";
import { appUrl, isBlob } from "../src/lib/env";
import { projectInclude, projectView } from "../src/lib/projects";
import { publicCopy, removeStored } from "../src/lib/storage";

async function notifyCache() {
  try {
    const response = await fetch(new URL("/api/internal/revalidate", appUrl()), { method: "POST", headers: { authorization: `Bearer ${process.env.WORKER_SECRET}` }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) console.warn("Cache notification deferred; public data expires after 60 seconds.");
  } catch { /* Public cache also has a bounded TTL when the web process is restarting. */ }
}
export async function publishProject(projectId: string, revision: number) {
  const project = await db.project.findUniqueOrThrow({ where: { id: projectId }, include: projectInclude });
  if (project.revision !== revision) throw new Error("Bản nháp đã thay đổi. Vui lòng xuất bản lại.");
  if (!project.media.some(m => m.placement === "MAIN")) throw new Error("Hãy thêm tác phẩm chính trước khi xuất bản.");
  if (project.media.some(m => m.media.status !== "READY")) throw new Error("Vẫn còn media chưa xử lý xong.");
  const main = project.media.filter(m => m.placement === "MAIN");
  if (project.type === "PHOTO" && main.some(m => !m.media.mime.startsWith("image/"))) throw new Error("Bộ ảnh chỉ nhận ảnh trong tác phẩm chính. Video hậu trường đặt ở tab Hậu trường.");
  if (project.type === "VIDEO" && !main.some(m => m.media.mime.startsWith("video/"))) throw new Error("Dự án video cần ít nhất một video chính.");
  await db.project.update({ where: { id: projectId }, data: { publicationState: "PUBLISHING", publicationError: null } });
  const unique = [...new Map(project.media.map(row => [row.media.id, row.media])).values()];
  for (const media of unique) {
    for (const variant of media.variants) {
      if (variant.kind === "MASTER" || variant.publicKey) continue;
      const key = await publicCopy(variant.storageKey, `published/${media.id}/v${media.version}/${variant.name}`, variant.mime);
      await db.mediaVariant.update({ where: { id: variant.id }, data: { publicKey: key } });
    }
  }
  const ready = await db.project.findUniqueOrThrow({ where: { id: projectId }, include: projectInclude });
  const snapshot = projectView(ready, true);
  await db.$transaction(async tx => {
    const updated = await tx.project.updateMany({ where: { id: projectId, revision }, data: { status: "PUBLISHED", publishedAt: new Date(), publishedRevision: revision, publicSnapshot: snapshot as unknown as Prisma.InputJsonValue, publicationState: "IDLE", publicationError: null } });
    if (!updated.count) throw new Error("Bản nháp đã thay đổi trong lúc xuất bản. Vui lòng thử lại.");
    await tx.publicMediaReference.deleteMany({ where: { projectId } });
    await tx.publicMediaReference.createMany({ data: unique.map(media => ({ projectId, mediaId: media.id })) });
  });
  await notifyCache();
}
export async function unpublishProject(projectId: string, mediaIds: string[]) {
  await db.$transaction([
    db.publicMediaReference.deleteMany({ where: { projectId } }),
    db.project.update({ where: { id: projectId }, data: { status: "DRAFT", publicSnapshot: Prisma.DbNull, publishedRevision: null, publicationState: "IDLE", publicationError: null } }),
  ]);
  await notifyCache();
  for (const mediaId of mediaIds) {
    if (await db.publicMediaReference.count({ where: { mediaId } })) continue;
    // Another project can be publishing the shared media concurrently.
    if (await db.projectMedia.count({ where: { mediaId, project: { publicationState: { in: ["QUEUED", "PUBLISHING"] } } } })) continue;
    const variants = await db.mediaVariant.findMany({ where: { mediaId, publicKey: { not: null } } });
    for (const variant of variants) {
      if (isBlob()) await removeStored(variant.publicKey!, true);
      await db.mediaVariant.update({ where: { id: variant.id }, data: { publicKey: null } });
    }
  }
}
export async function deleteMedia(mediaId: string) {
  const media = await db.media.findUnique({ where: { id: mediaId }, include: { variants: true, _count: { select: { projects: true, publicReferences: true } } } });
  if (!media || media.status !== "DELETING") return;
  if (!media.deleteAfter || media.deleteAfter > new Date()) throw new Error("Media vẫn trong thời gian khôi phục.");
  if (media._count.projects || media._count.publicReferences) throw new Error("Media vẫn đang được sử dụng.");
  for (const variant of media.variants) {
    if (variant.publicKey && isBlob()) await removeStored(variant.publicKey, true);
    await removeStored(variant.storageKey);
  }
  await removeStored(media.sourceKey);
  await db.media.delete({ where: { id: mediaId } });
}
