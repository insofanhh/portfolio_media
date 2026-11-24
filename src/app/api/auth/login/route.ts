import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { assertOrigin, HttpError, rateLimit, routeError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    assertOrigin(request);
    await rateLimit(request, "login", 8, 15 * 60);
    const input = z.object({ email: z.email().max(200), password: z.string().min(1).max(256) }).parse(await request.json());
    const user = await db.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || !verifyPassword(input.password, user.passwordHash)) throw new HttpError(401, "Email hoặc mật khẩu chưa đúng.");
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return routeError(error); }
}
