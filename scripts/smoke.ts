import "dotenv/config";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "../src/lib/db";
import { appUrl } from "../src/lib/env";
import { removeStored } from "../src/lib/storage";
import { runFfmpeg } from "../worker/media";
import type { AdminProject } from "../src/lib/admin-types";

const base = appUrl();
const marker = `qa-${randomBytes(5).toString("hex")}`;
const mediaIds: string[] = [];
const files: string[] = [];
const resetRateKeys: string[] = [];
let projectId = "";
let cookie = "";
async function call(url: string, method = "GET", data?: unknown, authenticated = true) {
  return fetch(new URL(url, base), { method, headers: { Origin: base, ...(authenticated && cookie ? { Cookie: cookie } : {}), ...(data !== undefined ? { "Content-Type": "application/json" } : {}) }, ...(data !== undefined ? { body: JSON.stringify(data) } : {}), redirect: "manual" });
}
async function expect(response: Response, status: number) {
  const text = await response.text();
  assert.equal(response.status, status, `Expected ${status}, got ${response.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}
async function project() { return await (await call(`/api/admin/projects/${projectId}`)).json() as AdminProject; }
async function waitFor(predicate: () => Promise<boolean>, message: string) {
  const started = Date.now();
  while (Date.now() - started < 100000) { if (await predicate()) return; await new Promise(resolve => setTimeout(resolve, 900)); }
  throw new Error(message);
}
async function upload(filename: string, mime: string, placement = "MAIN") {
  const body = await readFile(filename);
  const reservation = await expect(await call("/api/admin/uploads", "POST", { name: path.basename(filename), mime, size: body.length, projectId, placement }), 201);
  mediaIds.push(reservation.mediaId);
  const response = await fetch(new URL(`/api/admin/uploads/local/${reservation.mediaId}`, base), { method: "PUT", headers: { Origin: base, Cookie: cookie, "Content-Type": mime }, body });
  await expect(response, 200);
  return reservation.mediaId as string;
}
async function main() {
  assert.notEqual(process.env.STORAGE_DRIVER, "blob", "Smoke fixtures are local-only.");
  assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname), "Smoke fixtures require a loopback APP_URL.");
  if (process.argv.includes("--reset-local-rate-limits")) {
    const keys = [["login", 900], ["contact", 3600], ["upload", 3600]].map(([purpose, seconds]) => createHash("sha256").update(`${purpose}:local:${Math.floor(Date.now() / (Number(seconds) * 1000))}`).digest("hex"));
    resetRateKeys.push(...keys);
    await db.rateLimit.deleteMany({ where: { key: { in: keys } } });
    console.log("Reset only loopback QA rate-limit buckets; server limits remain enabled.");
  }
  assert.equal((await call("/", "GET", undefined, false)).status, 200);
  await expect(await call("/api/admin/projects", "POST", {}, false), 401);
  await expect(await call("/api/auth/login", "POST", { email: process.env.ADMIN_EMAIL, password: "intentionally-wrong-password" }, false), 401);
  const login = await call("/api/auth/login", "POST", { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }, false);
  assert.equal(login.status, 200);
  const session = login.headers.getSetCookie().find(value => value.startsWith("frame_session="));
  assert.ok(session); assert.match(session, /HttpOnly/i); assert.match(session, /SameSite=lax/i);
  cookie = session.split(";")[0];
  console.log("PASS: protected admin, password login, secure session flags");
  const draft = { title: `Kiểm thử ${marker}`, slug: marker, type: "PHOTO", summary: "Bản đã xuất bản ban đầu.", concept: "Kiểm tra pipeline ảnh và video hậu trường.", scope: "Tác vụ QA tự động, sẽ được dọn sau kiểm tra.", role: "QA", client: "Local test", year: 2026, credits: "Automated QA", tags: ["test"], featuredOrder: 9999, coverMediaId: null, seoTitle: "", seoDescription: "", isDemo: true };
  projectId = (await expect(await call("/api/admin/projects", "POST", draft), 201)).id;
  await expect(await call(`/api/admin/projects/${projectId}`, "PATCH", { ...draft, revision: 0 }), 200);
  await expect(await call(`/api/admin/projects/${projectId}`, "PATCH", { ...draft, title: "Stale edit", revision: 0 }), 409);
  assert.equal((await call(`/work/${marker}`, "GET", undefined, false)).status, 404);
  console.log("PASS: create draft, reject stale writes, hide private project");
  await expect(await call("/api/admin/uploads", "POST", { name: "unsafe.html", mime: "text/html", size: 100 }), 400);
  await expect(await call("/api/admin/uploads", "POST", { name: "huge.jpg", mime: "image/jpeg", size: 80 * 1024 ** 2 }), 400);
  const directory = path.resolve(".local/qa");
  await mkdir(directory, { recursive: true });
  const image = path.join(directory, `${marker}.jpg`);
  const video = path.join(directory, `${marker}.mp4`);
  files.push(image, video);
  await sharp({ create: { width: 480, height: 720, channels: 3, background: "#b69acb" } }).jpeg({ quality: 95 }).toFile(image);
  await runFfmpeg(["-f", "lavfi", "-i", "color=c=0x9781ad:s=180x320:d=61:r=12", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", video]);
  const imageId = await upload(image, "image/jpeg");
  const videoId = await upload(video, "video/mp4", "BEHIND_THE_SCENES");
  await waitFor(async () => (await project()).media.every(row => row.media.status === "READY"), "Worker did not finish media within the test window.");
  let current = await project();
  const privateVariant = current.media.find(row => row.mediaId === imageId)!.media.variants.find(v => v.mime === "image/webp")!;
  const privateUrl = `/api/media/${imageId}/${privateVariant.name}`;
  assert.equal((await call(privateUrl, "GET", undefined, false)).status, 404);
  assert.equal((await call(privateUrl)).status, 200);
  console.log("PASS: reject invalid uploads, stream files, process image/video, protect draft media");
  await expect(await call(`/api/admin/projects/${projectId}`, "PATCH", { ...draft, coverMediaId: imageId, revision: current.revision, mediaItems: current.media.map(row => ({ id: row.id, placement: row.placement, alt: "Tác phẩm kiểm thử pipeline local", caption: "Local QA fixture", focalX: .5, focalY: .5 })) }), 200);
  await expect(await call(`/api/admin/projects/${projectId}/publish`, "POST"), 202);
  await waitFor(async () => { const data = await project(); return data.status === "PUBLISHED" && data.publicationState === "IDLE"; }, "Project did not publish.");
  assert.equal((await call(`/work/${marker}`, "GET", undefined, false)).status, 200);
  assert.equal((await call(privateUrl, "GET", undefined, false)).status, 200);
  current = await project();
  await expect(await call(`/api/admin/projects/${projectId}`, "PATCH", { ...draft, coverMediaId: imageId, summary: "BẢN NHÁP CHƯA CÔNG BỐ 12345", revision: current.revision }), 200);
  const publicHtml = await (await call(`/work/${marker}`, "GET", undefined, false)).text();
  assert.ok(!publicHtml.includes("BẢN NHÁP CHƯA CÔNG BỐ 12345"));
  const videoVariant = current.media.find(row => row.mediaId === videoId)!.media.variants.find(v => v.kind === "VIDEO")!;
  const hls = current.media.find(row => row.mediaId === videoId)!.media.variants.find(v => v.kind === "HLS");
  assert.ok(hls, "Long video must generate HLS.");
  const hlsUrl = new URL(`/api/media/${videoId}/${hls.name}`, base);
  const master = await (await fetch(hlsUrl)).text();
  assert.ok(master.startsWith("#EXTM3U"));
  const levelUrl = new URL(master.split("\n").find(line => line && !line.startsWith("#"))!, hlsUrl);
  const level = await (await fetch(levelUrl)).text();
  const segmentUrl = new URL(level.split("\n").find(line => line && !line.startsWith("#"))!, levelUrl);
  assert.equal((await fetch(segmentUrl)).status, 200);
  const ranged = await fetch(new URL(`/api/media/${videoId}/${videoVariant.name}`, base), { headers: { Range: "bytes=8-31" } });
  assert.equal(ranged.status, 206); assert.equal((await ranged.arrayBuffer()).byteLength, 24);
  const invalidRange = await fetch(new URL(`/api/media/${videoId}/${videoVariant.name}`, base), { headers: { Range: "bytes=999999999-" } });
  assert.equal(invalidRange.status, 416);
  console.log("PASS: publish snapshot, keep later edits private, serve seekable video ranges");
  await expect(await call("/api/admin/media", "POST", { mediaId: imageId, action: "delete" }), 409);
  await expect(await call(`/api/admin/projects/${projectId}/publish`, "DELETE"), 202);
  await waitFor(async () => { const data = await project(); return data.status === "DRAFT" && data.publicationState === "IDLE"; }, "Project did not unpublish.");
  assert.equal((await call(`/work/${marker}`, "GET", undefined, false)).status, 404);
  assert.equal((await call(privateUrl, "GET", undefined, false)).status, 404);
  current = await project();
  for (const row of current.media) await expect(await call(`/api/admin/projects/${projectId}/media`, "DELETE", { linkId: row.id }), 200);
  await expect(await call("/api/admin/media", "POST", { mediaId: imageId, action: "delete" }), 200);
  assert.equal((await db.media.findUniqueOrThrow({ where: { id: imageId } })).status, "DELETING");
  await expect(await call("/api/admin/media", "POST", { mediaId: imageId, action: "restore" }), 200);
  console.log("PASS: guard referenced assets, unpublish media, soft delete and restore");
  current = await project();
  await expect(await call(`/api/admin/projects/${projectId}/archive`, "POST", { archived: true, revision: current.revision }), 200);
  assert.equal((await project()).status, "ARCHIVED");
  await expect(await call(`/api/admin/projects/${projectId}/publish`, "POST"), 409);
  current = await project();
  await expect(await call(`/api/admin/projects/${projectId}/archive`, "POST", { archived: false, revision: current.revision }), 200);
  assert.equal((await project()).status, "DRAFT");
  console.log("PASS: archive/restore project, long-video HLS manifest and segments");
  const contact = { name: "Local QA", email: `${marker}@example.invalid`, projectType: "PHOTO", brief: "Yêu cầu kiểm thử cục bộ, sẽ tự động dọn sau kiểm tra.", website: "" };
  await expect(await call("/api/contact", "POST", contact, false), 200);
  assert.equal(await db.inquiry.count({ where: { email: contact.email } }), 1);
  await expect(await call("/api/contact", "POST", { ...contact, website: "https://spam.invalid" }, false), 200);
  assert.equal(await db.inquiry.count({ where: { email: contact.email } }), 1);
  const csrf = await fetch(new URL("/api/contact", base), { method: "POST", headers: { Origin: "https://other.invalid", "Content-Type": "application/json" }, body: JSON.stringify(contact) });
  assert.equal(csrf.status, 403);
  for (let attempt = 0; attempt < 3; attempt++) await expect(await call("/api/contact", "POST", { ...contact, website: "https://spam.invalid" }, false), 200);
  await expect(await call("/api/contact", "POST", contact, false), 429);
  assert.equal(await db.inquiry.count({ where: { email: contact.email } }), 1);
  console.log("PASS: contact persistence, honeypot, same-origin mutation guard");
  await expect(await call("/api/auth/logout", "POST"), 200);
  await expect(await call("/api/admin/projects"), 401);
  console.log("PASS: logout revokes the session. Integration workflow passed.");
}
async function cleanup() {
  if (projectId) {
    const row = await db.project.findUnique({ where: { id: projectId } });
    if (row?.slug !== marker) throw new Error("Refusing to remove an unexpected QA project.");
    await db.publicMediaReference.deleteMany({ where: { projectId } });
    await db.processingJob.deleteMany({ where: { projectId } });
    await db.project.deleteMany({ where: { id: projectId, slug: marker } });
  }
  for (const id of mediaIds) {
    const media = await db.media.findUnique({ where: { id }, include: { variants: true, _count: { select: { projects: true, publicReferences: true } } } });
    if (!media || media._count.projects || media._count.publicReferences) continue;
    for (const variant of media.variants) await removeStored(variant.storageKey);
    await removeStored(media.sourceKey).catch(() => {});
    await db.processingJob.deleteMany({ where: { mediaId: id } });
    await db.media.delete({ where: { id } });
  }
  await db.inquiry.deleteMany({ where: { email: `${marker}@example.invalid` } });
  for (const filename of files) await unlink(filename).catch(() => {});
  if (resetRateKeys.length) await db.rateLimit.deleteMany({ where: { key: { in: resetRateKeys } } });
  await db.$disconnect();
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Integration test failed"); process.exitCode = 1; }).finally(cleanup);
