import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { currentUser } from "./auth";
import { db } from "./db";
import { appUrl } from "./env";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function assertOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(appUrl()).origin;
  if (!origin || origin !== expected) throw new HttpError(403, "Yêu cầu không đúng nguồn website.");
}
export async function adminMutation(request: Request) {
  assertOrigin(request);
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Vui lòng đăng nhập lại.");
  return user;
}
export async function rateLimit(request: Request, purpose: string, maximum: number, seconds: number) {
  const forwarded = process.env.VERCEL ? request.headers.get("x-forwarded-for")?.split(",")[0] : "local";
  const period = Math.floor(Date.now() / (seconds * 1000));
  const key = createHash("sha256").update(`${purpose}:${forwarded || "unknown"}:${period}`).digest("hex");
  const row = await db.rateLimit.upsert({ where: { key }, create: { key, expiresAt: new Date((period + 1) * seconds * 1000) }, update: { count: { increment: 1 } } });
  if (row.count > maximum) throw new HttpError(429, "Bạn thao tác quá nhanh. Vui lòng thử lại sau.");
}
export function internalRequest(request: Request) {
  const expected = process.env.WORKER_SECRET;
  const actual = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || !actual || expected.length !== actual.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) throw new HttpError(401, "Không có quyền truy cập.");
}
export function routeError(error: unknown) {
  if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ error: "Thông tin chưa hợp lệ.", fields: error.flatten().fieldErrors }, { status: 400 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "Đường dẫn hoặc dữ liệu đã tồn tại." }, { status: 409 });
  console.error(error instanceof Error ? error.message : "Unexpected request error");
  return NextResponse.json({ error: "Không thể hoàn tất thao tác. Vui lòng thử lại." }, { status: 500 });
}
