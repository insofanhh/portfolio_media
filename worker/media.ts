import "dotenv/config";
import { createReadStream } from "node:fs";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import sharp from "sharp";
import { db } from "../src/lib/db";
import type { Prisma } from "@prisma/client";
import { downloadFile, storeFile } from "../src/lib/storage";

const execute = promisify(execFile);
const ffmpeg = () => process.env.FFMPEG_PATH || "ffmpeg";
export async function runFfmpeg(args: string[]) {
  await execute(ffmpeg(), ["-nostdin", "-hide_banner", "-loglevel", "error", "-y", ...args], { windowsHide: true, timeout: 45 * 60 * 1000, maxBuffer: 2 * 1024 * 1024 });
}
interface ProbeStream { codec_type: string; codec_name?: string; width?: number; height?: number; color_transfer?: string; tags?: { rotate?: string }; side_data_list?: { rotation?: number }[] }
export async function probeVideo(filename: string) {
  const { stdout } = await execute(process.env.FFPROBE_PATH || "ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", filename], { windowsHide: true, timeout: 120000, maxBuffer: 2 * 1024 * 1024 });
  const result = JSON.parse(stdout) as { streams: ProbeStream[]; format: { duration?: string } };
  const stream = result.streams.find(s => s.codec_type === "video");
  if (!stream?.width || !stream.height) throw new Error("Tệp không có luồng video hợp lệ.");
  const duration = Number(result.format.duration);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 3600) throw new Error("Video phải có thời lượng từ 1 giây đến 60 phút.");
  const rotation = Math.abs(Number(stream.side_data_list?.find(s => s.rotation !== undefined)?.rotation || stream.tags?.rotate || 0));
  const rotated = rotation % 180 === 90;
  return { width: rotated ? stream.height : stream.width, height: rotated ? stream.width : stream.height, duration, hdr: ["smpte2084", "arib-std-b67"].includes(stream.color_transfer || "") };
}
export function fittedVideo(width: number, height: number, shortSide = 1080) {
  const scale = Math.min(1, shortSide / Math.min(width, height), (shortSide * 16 / 9) / Math.max(width, height));
  return { width: Math.max(2, Math.floor(width * scale / 2) * 2), height: Math.max(2, Math.floor(height * scale / 2) * 2) };
}
interface Output { name: string; filename: string; kind: string; mime: string; width?: number; height?: number }
async function imageOutputs(input: string, directory: string, prefix = "images"): Promise<Output[]> {
  const meta = await sharp(input, { limitInputPixels: 80_000_000 }).metadata();
  if (!["jpeg", "png", "webp", "heif"].includes(meta.format || "")) throw new Error("Nội dung ảnh không thuộc định dạng được hỗ trợ.");
  await mkdir(path.join(directory, prefix), { recursive: true });
  const outputs: Output[] = [];
  const seen = new Set<string>();
  for (const size of [480, 960, 1600, 2560, 3200]) {
    const filename = path.join(directory, prefix, `${size}.webp`);
    const info = await sharp(input, { limitInputPixels: 80_000_000 }).rotate().toColourspace("srgb").resize({ width: size, height: size, fit: "inside", withoutEnlargement: true }).webp({ quality: size >= 1600 ? 90 : 85, effort: 5 }).toFile(filename);
    const key = `${info.width}x${info.height}`;
    if (seen.has(key)) continue;
    seen.add(key);
    outputs.push({ name: `${prefix}/${size}.webp`, filename, kind: prefix === "poster" ? "POSTER" : size === 480 ? "THUMBNAIL" : "IMAGE", mime: "image/webp", width: info.width, height: info.height });
  }
  return outputs;
}
async function walk(directory: string): Promise<string[]> {
  const results: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...await walk(full)); else results.push(full);
  }
  return results;
}
export async function processMedia(mediaId: string, version: number, workDirectory: string) {
  const media = await db.media.findUniqueOrThrow({ where: { id: mediaId } });
  if (media.version !== version || media.status === "DELETING") return;
  await db.media.update({ where: { id: mediaId }, data: { status: "PROCESSING", error: null } });
  await mkdir(workDirectory, { recursive: true });
  const input = path.join(workDirectory, "source" + path.extname(media.originalName));
  await downloadFile(media.sourceKey, input);
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(input)) hash.update(chunk);
  let width = 0, height = 0;
  let duration: number | null = null;
  let outputs: Output[];
  if (media.mime.startsWith("image/")) {
    outputs = await imageOutputs(input, workDirectory);
    const largest = outputs[outputs.length - 1];
    width = largest.width!; height = largest.height!;
  } else {
    const meta = await probeVideo(input);
    const dimensions = fittedVideo(meta.width, meta.height);
    width = dimensions.width; height = dimensions.height; duration = meta.duration;
    const toneMap = meta.hdr ? "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv," : "";
    const video = path.join(workDirectory, "video.mp4");
    await runFfmpeg(["-i", input, "-map", "0:v:0", "-map", "0:a:0?", "-sn", "-dn", "-vf", `${toneMap}scale=${width}:${height}:flags=lanczos`, "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-map_metadata", "-1", "-movflags", "+faststart", video]);
    const poster = path.join(workDirectory, "poster.jpg");
    await runFfmpeg(["-ss", String(Math.min(1, duration / 3)), "-i", video, "-frames:v", "1", "-q:v", "2", poster]);
    outputs = await imageOutputs(poster, workDirectory, "poster");
    outputs.push({ name: "video.mp4", filename: video, kind: "VIDEO", mime: "video/mp4", width, height });
    if (duration > 60 || (await stat(video)).size > 40 * 1024 ** 2) {
      const hlsDir = path.join(workDirectory, "hls");
      await mkdir(hlsDir, { recursive: true });
      const levels = [480, 720, 1080].filter(level => level <= Math.min(meta.width, meta.height));
      if (!levels.length) levels.push(Math.min(meta.width, meta.height));
      let master = "#EXTM3U\n#EXT-X-VERSION:3\n";
      for (const level of levels) {
        const size = fittedVideo(meta.width, meta.height, level);
        const levelDirectory = path.join(hlsDir, String(level));
        await mkdir(levelDirectory, { recursive: true });
        await runFfmpeg(["-i", input, "-map", "0:v:0", "-map", "0:a:0?", "-sn", "-dn", "-vf", `${toneMap}scale=${size.width}:${size.height}:flags=lanczos`, "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-map_metadata", "-1", "-f", "hls", "-hls_time", "4", "-hls_playlist_type", "vod", "-hls_segment_filename", path.join(levelDirectory, "segment-%05d.ts"), path.join(levelDirectory, "index.m3u8")]);
        master += `#EXT-X-STREAM-INF:BANDWIDTH=${Math.round(level * level * 5)},RESOLUTION=${size.width}x${size.height}\n${level}/index.m3u8\n`;
      }
      await writeFile(path.join(hlsDir, "master.m3u8"), master);
      for (const filename of await walk(hlsDir)) {
        const name = path.relative(workDirectory, filename).split(path.sep).join("/");
        outputs.push({ name, filename, kind: name === "hls/master.m3u8" ? "HLS" : "HLS_ASSET", mime: name.endsWith(".ts") ? "video/mp2t" : "application/vnd.apple.mpegurl" });
      }
    }
  }
  const variants: Prisma.MediaVariantCreateManyInput[] = [];
  for (const output of outputs) {
    const key = `processed/${media.id}/v${version}/${output.name}`;
    const storageKey = await storeFile(key, output.filename, output.mime);
    variants.push({ mediaId, name: output.name, kind: output.kind, storageKey, mime: output.mime, bytes: BigInt((await stat(output.filename)).size), width: output.width, height: output.height });
  }
  await db.$transaction(async tx => {
    const current = await tx.media.findUniqueOrThrow({ where: { id: mediaId } });
    if (current.version !== version || current.status === "DELETING") throw new Error("Media version changed during processing.");
    await tx.mediaVariant.deleteMany({ where: { mediaId } });
    await tx.mediaVariant.createMany({ data: variants });
    await tx.media.update({ where: { id: mediaId }, data: { width, height, duration, checksum: hash.digest("hex"), status: "READY", error: null } });
  });
}
