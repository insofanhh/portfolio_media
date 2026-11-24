import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { internalRequest, routeError } from "@/lib/http";
export async function POST(request: Request) {
  try { internalRequest(request); revalidateTag("published-projects", { expire: 0 }); return NextResponse.json({ ok: true }); } catch (error) { return routeError(error); }
}
