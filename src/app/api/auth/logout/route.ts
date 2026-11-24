import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { assertOrigin, routeError } from "@/lib/http";
export async function POST(request: Request) {
  try { assertOrigin(request); await destroySession(); return NextResponse.json({ ok: true }); } catch (error) { return routeError(error); }
}
