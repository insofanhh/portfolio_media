import "dotenv/config";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { db } from "../src/lib/db";
import { processMedia } from "./media";
import { deleteMedia, publishProject, unpublishProject } from "./publication";

let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });

export async function drainOne() {
  const now = new Date();
  await db.processingJob.updateMany({ where: { status: "RUNNING", leaseUntil: { lt: now } }, data: { status: "PENDING", leaseUntil: null } });
  const job = await db.processingJob.findFirst({ where: { status: "PENDING", runAt: { lte: now } }, orderBy: { createdAt: "asc" } });
  if (!job) return false;
  const claimed = await db.processingJob.updateMany({ where: { id: job.id, status: "PENDING", attempts: job.attempts }, data: { status: "RUNNING", attempts: { increment: 1 }, leaseUntil: new Date(Date.now() + 120000) } });
  if (!claimed.count) return true;
  const beat = setInterval(() => { void db.processingJob.updateMany({ where: { id: job.id, status: "RUNNING" }, data: { leaseUntil: new Date(Date.now() + 120000) } }).catch(() => {}); }, 20000);
  const tempRoot = process.env.WORKER_TEMP_DIR || path.join(os.tmpdir(), "frame-worker");
  await mkdir(tempRoot, { recursive: true });
  const directory = await mkdtemp(path.join(tempRoot, "job-"));
  try {
    if (job.type === "PROCESS_MEDIA" && job.mediaId) await processMedia(job.mediaId, job.revision, directory);
    if (job.type === "PUBLISH_PROJECT" && job.projectId) await publishProject(job.projectId, job.revision);
    if (job.type === "UNPUBLISH_PROJECT" && job.projectId) {
      const payload = job.payload as { mediaIds?: string[] } | null;
      await unpublishProject(job.projectId, payload?.mediaIds || []);
    }
    if (job.type === "DELETE_MEDIA" && job.mediaId) await deleteMedia(job.mediaId);
    await db.processingJob.update({ where: { id: job.id }, data: { status: "SUCCEEDED", finishedAt: new Date(), leaseUntil: null, error: null } });
    console.log(`[worker] ${job.type} completed (${job.id})`);
  } catch (error) {
    const message = (error instanceof Error ? error.message : "Xử lý media thất bại.").slice(0, 1500);
    const exhausted = job.attempts + 1 >= job.maxAttempts;
    await db.processingJob.update({ where: { id: job.id }, data: { status: exhausted ? "FAILED" : "PENDING", leaseUntil: null, error: message, runAt: new Date(Date.now() + Math.min(120000, 10000 * 2 ** job.attempts)) } });
    if (job.mediaId && job.type === "PROCESS_MEDIA") await db.media.updateMany({ where: { id: job.mediaId, status: { not: "DELETING" } }, data: { status: exhausted ? "FAILED" : "QUEUED", error: message } });
    if (job.projectId) await db.project.update({ where: { id: job.projectId }, data: { publicationState: exhausted ? "FAILED" : "QUEUED", publicationError: message } });
    console.error(`[worker] ${job.type} failed: ${message}`);
  } finally {
    clearInterval(beat);
    const resolvedRoot = path.resolve(tempRoot);
    const resolvedDirectory = path.resolve(directory);
    if (!resolvedDirectory.startsWith(resolvedRoot + path.sep)) throw new Error("Unsafe worker cleanup path");
    await rm(resolvedDirectory, { recursive: true, force: true });
  }
  return true;
}
async function main() {
  const once = process.argv.includes("--once");
  console.log(`[worker] ready (${once ? "drain" : "poll"})`);
  while (!stopping) {
    try {
      const worked = await drainOne();
      if (!worked && once) break;
      if (!worked) await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("[worker]", error instanceof Error ? error.message : "Database unavailable");
      if (once) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  await db.$disconnect();
}
if (!process.env.WORKER_LIBRARY_ONLY) main().catch(error => { console.error(error instanceof Error ? error.message : "Worker stopped"); process.exitCode = 1; });
