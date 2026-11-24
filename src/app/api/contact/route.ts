import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertOrigin, rateLimit, routeError } from "@/lib/http";
import { inquirySchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertOrigin(request);
    await rateLimit(request, "contact", 5, 60 * 60);
    const input = inquirySchema.parse(await request.json());
    if (!input.website) await db.inquiry.create({ data: { name: input.name, email: input.email, projectType: input.projectType, brief: input.brief } });
    return NextResponse.json({ ok: true });
  } catch (error) { return routeError(error); }
}
