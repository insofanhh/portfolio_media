import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { internalRequest, routeError } from "@/lib/http";
import { dispatchWorker } from "@/lib/worker-dispatch";
export async function POST(request: Request) {
  try {
    internalRequest(request);
    const now = new Date();
    await db.$transaction([
      db.processingJob.updateMany({ where: { status: "RUNNING", leaseUntil: { lt: now } }, data: { status: "PENDING", leaseUntil: null } }),
      db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
      db.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } }),
      db.media.updateMany({ where: { status: "UPLOADING", upload: { expiresAt: { lt: now } } }, data: { status: "FAILED", error: "Upload chưa hoàn tất trước khi phiên hết hạn. Hãy tải tệp lên lại." } }),
    ]);
    if (await db.processingJob.count({ where: { status: "PENDING", runAt: { lte: now } } })) await dispatchWorker();
    return NextResponse.json({ ok: true });
  } catch (error) { return routeError(error); }
}
