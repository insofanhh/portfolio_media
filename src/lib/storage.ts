import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, stat, unlink, copyFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { del, get, head, put } from "@vercel/blob";
import { isBlob, requiredEnv } from "./env";

export function storagePath(key: string) {
  const base = path.resolve(process.env.LOCAL_STORAGE_DIR || ".local/storage");
  const resolved = path.resolve(base, key);
  if (!resolved.startsWith(base + path.sep)) throw new Error("Invalid storage path");
  return resolved;
}
export async function writeSource(key: string, body: ReadableStream<Uint8Array>, maximum: number) {
  if (isBlob()) throw new Error("Blob uploads must go directly from the browser.");
  const target = storagePath(key);
  await mkdir(path.dirname(target), { recursive: true });
  let size = 0;
  const reader = body.getReader();
  async function* chunks() {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maximum) throw new Error("Tệp vượt quá dung lượng được phép.");
      yield Buffer.from(chunk.value);
    }
  }
  try {
    await pipeline(Readable.from(chunks()), createWriteStream(target));
    return size;
  } catch (error) {
    await unlink(target).catch(() => {});
    throw error;
  } finally { reader.releaseLock(); }
}
export async function storeFile(key: string, filename: string, mime: string, publicAccess = false) {
  if (isBlob()) {
    const result = await put(key, createReadStream(filename), {
      access: publicAccess ? "public" : "private",
      token: requiredEnv(publicAccess ? "BLOB_PUBLIC_READ_WRITE_TOKEN" : "BLOB_READ_WRITE_TOKEN"),
      contentType: mime, addRandomSuffix: false, allowOverwrite: true, multipart: true,
      cacheControlMaxAge: 31536000,
    });
    return result.url;
  }
  const target = storagePath(key);
  await mkdir(path.dirname(target), { recursive: true });
  if (path.resolve(filename) !== target) await copyFile(filename, target);
  return key;
}
export async function downloadFile(key: string, filename: string) {
  await mkdir(path.dirname(filename), { recursive: true });
  if (!isBlob()) { await copyFile(storagePath(key), filename); return; }
  const result = await get(key, { access: "private", token: requiredEnv("BLOB_READ_WRITE_TOKEN") });
  if (!result || !result.stream) throw new Error("Không đọc được tệp nguồn.");
  await pipeline(Readable.fromWeb(result.stream as never), createWriteStream(filename));
}
export async function publicCopy(key: string, publicPath: string, mime: string) {
  if (!isBlob()) return key;
  const result = await get(key, { access: "private", token: requiredEnv("BLOB_READ_WRITE_TOKEN") });
  if (!result || !result.stream) throw new Error("Không đọc được bản hiển thị.");
  const output = await put(publicPath, result.stream, {
    access: "public", token: requiredEnv("BLOB_PUBLIC_READ_WRITE_TOKEN"),
    contentType: mime, addRandomSuffix: false, allowOverwrite: true, multipart: true, cacheControlMaxAge: 31536000,
  });
  return output.url;
}
export async function removeStored(key: string, publicAccess = false) {
  if (isBlob()) await del(key, { token: requiredEnv(publicAccess ? "BLOB_PUBLIC_READ_WRITE_TOKEN" : "BLOB_READ_WRITE_TOKEN") });
  else await unlink(storagePath(key)).catch(error => { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; });
}
export async function sourceSize(key: string) {
  return isBlob() ? (await head(key, { token: requiredEnv("BLOB_READ_WRITE_TOKEN") })).size : (await stat(storagePath(key))).size;
}
export async function readStored(key: string) {
  if (!isBlob()) return readFile(storagePath(key));
  const result = await get(key, { access: "private", token: requiredEnv("BLOB_READ_WRITE_TOKEN") });
  if (!result || !result.stream) throw new Error("Tệp không tồn tại.");
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}
