import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { parseRange } from "../src/lib/range";
import { storagePath, writeSource } from "../src/lib/storage";
import { fittedVideo } from "../worker/media";
import { validateUpload } from "../src/lib/uploads";
import { slugify } from "../src/lib/utils";

test("passwords use per-password salts and reject wrong or malformed hashes", () => {
  const first = hashPassword("a-long-test-password");
  assert.notEqual(first, hashPassword("a-long-test-password"));
  assert.equal(verifyPassword("a-long-test-password", first), true);
  assert.equal(verifyPassword("wrong-password", first), false);
  assert.equal(verifyPassword("anything", "scrypt:broken:nope"), false);
});
test("video range requests support seeking, open ends and suffix ranges", () => {
  assert.deepEqual(parseRange("bytes=8-15", 100), { start: 8, end: 15 });
  assert.deepEqual(parseRange("bytes=90-", 100), { start: 90, end: 99 });
  assert.deepEqual(parseRange("bytes=-12", 100), { start: 88, end: 99 });
  assert.deepEqual(parseRange("bytes=0-500", 100), { start: 0, end: 99 });
  assert.equal(parseRange(null, 100), null);
  for (const value of ["bytes=100-", "bytes=8-2", "bytes=-0", "bytes=", "bytes=1-3,6-8", "garbage"]) assert.throws(() => parseRange(value, 100));
});
test("renditions stay even, preserve orientation and never upscale a valid source", () => {
  assert.deepEqual(fittedVideo(2160, 3840), { width: 1080, height: 1920 });
  assert.deepEqual(fittedVideo(3840, 2160), { width: 1920, height: 1080 });
  assert.deepEqual(fittedVideo(360, 640), { width: 360, height: 640 });
  for (const [width, height] of [[1017, 1813], [3024, 4032], [640, 360], [480, 480]]) {
    const output = fittedVideo(width, height, 720);
    assert.equal(output.width % 2, 0); assert.equal(output.height % 2, 0);
    assert.ok(output.width <= width && output.height <= height);
    assert.ok(Math.abs(output.width / output.height - width / height) < .01);
  }
});
test("upload limits reject active content, empty files and oversized images", () => {
  assert.throws(() => validateUpload("image/svg+xml", 200));
  assert.throws(() => validateUpload("text/html", 200));
  assert.throws(() => validateUpload("image/jpeg", 0));
  assert.throws(() => validateUpload("image/jpeg", 60 * 1024 ** 2));
  assert.ok(validateUpload("video/mp4", 10 * 1024 ** 2));
});
test("local storage refuses traversal outside its dedicated root", () => {
  assert.throws(() => storagePath("../outside-secret"));
  assert.throws(() => storagePath("../../.env"));
  assert.ok(storagePath("sources/test/photo.jpg").includes("sources"));
});
test("streaming uploads handle backpressure and clean up oversized partial files", async () => {
  const key = `tests/${randomUUID()}.bin`;
  const payload = Buffer.alloc(512 * 1024, 42);
  const stream = new ReadableStream<Uint8Array>({ start(controller) { for (let offset = 0; offset < payload.length; offset += 16384) controller.enqueue(payload.subarray(offset, offset + 16384)); controller.close(); } });
  try {
    assert.equal(await writeSource(key, stream, payload.length), payload.length);
    assert.deepEqual(await readFile(storagePath(key)), payload);
  } finally { await unlink(storagePath(key)).catch(() => {}); }
  const failedKey = `tests/${randomUUID()}.bin`;
  await assert.rejects(writeSource(failedKey, new ReadableStream({ start(controller) { controller.enqueue(payload); controller.close(); } }), 16));
  await assert.rejects(readFile(storagePath(failedKey)));
});
test("Vietnamese titles produce stable, URL-safe slugs", () => {
  assert.equal(slugify("Hình & khoảng trống"), "hinh-khoang-trong");
  assert.equal(slugify("Đằng sau một khung hình."), "dang-sau-mot-khung-hinh");
});
