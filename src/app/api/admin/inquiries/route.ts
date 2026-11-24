import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminMutation, routeError } from "@/lib/http";
export async function PATCH(request: Request) {
  try {
    await adminMutation(request);
    const { id, status } = z.object({ id: z.string(), status: z.enum(["NEW", "READ", "DONE"]) }).parse(await request.json());
    await db.inquiry.update({ where: { id }, data: { status } });
    return NextResponse.json({ ok: true });
  } catch (error) { return routeError(error); }
}
