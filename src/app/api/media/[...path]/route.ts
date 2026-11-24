import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { get } from "@vercel/blob";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { isBlob, requiredEnv } from "@/lib/env";
import { storagePath } from "@/lib/storage";
import { parseRange } from "@/lib/range";

export const runtime = "nodejs";
type Context = { params: Promise<{ path: string[] }> };
async function serve(request: Request, context: Context, headOnly = false) {
  const [mediaId, ...parts] = (await context.params).path;
  if (!mediaId || !parts.length || parts.some(p => p === ".." || p === ".")) return new Response(null, { status: 404 });
  const variant = await db.mediaVariant.findUnique({ where: { mediaId_name: { mediaId, name: parts.join("/") } }, include: { media: { include: { _count: { select: { publicReferences: true } } } } } });
  if (!variant || variant.media.status !== "READY" || variant.kind === "MASTER") return new Response(null, { status: 404 });
  const published = variant.media._count.publicReferences > 0 && Boolean(variant.publicKey);
  if (!published && !await currentUser()) return new Response(null, { status: 404 });
  if (published && isBlob()) return Response.redirect(variant.publicKey!, 307);
  const bytes = isBlob() ? Number(variant.bytes) : (await stat(storagePath(variant.storageKey))).size;
  let range;
  try { range = parseRange(request.headers.get("range"), bytes); }
  catch { return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${bytes}` } }); }
  if (isBlob() && range) range.end = Math.min(range.end, range.start + 4 * 1024 ** 2 - 1);
  const headers = new Headers({ "Content-Type": variant.mime, "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes", "Cache-Control": published ? "public, max-age=31536000, immutable" : "private, no-store" });
  headers.set("Content-Length", String(range ? range.end - range.start + 1 : bytes));
  if (range) headers.set("Content-Range", `bytes ${range.start}-${range.end}/${bytes}`);
  if (headOnly) return new Response(null, { status: range ? 206 : 200, headers });
  if (isBlob()) {
    const result = await get(variant.storageKey, { access: "private", token: requiredEnv("BLOB_READ_WRITE_TOKEN"), ...(range ? { headers: { Range: `bytes=${range.start}-${range.end}` } } : {}) });
    if (!result?.stream) return new Response(null, { status: 404 });
    return new Response(result.stream, { status: range ? 206 : 200, headers });
  }
  return new Response(Readable.toWeb(createReadStream(storagePath(variant.storageKey), range ? { start: range.start, end: range.end } : undefined)) as ReadableStream<Uint8Array>, { status: range ? 206 : 200, headers });
}
export async function GET(request: Request, context: Context) {
  try { return await serve(request, context); } catch { return new Response(null, { status: 404 }); }
}
export async function HEAD(request: Request, context: Context) {
  try { return await serve(request, context, true); } catch { return new Response(null, { status: 404 }); }
}
