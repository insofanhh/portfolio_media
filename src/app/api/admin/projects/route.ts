import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { adminMutation, HttpError, routeError } from "@/lib/http";
import { projectSchema } from "@/lib/validation";

export async function GET() {
  try {
    if (!await currentUser()) throw new HttpError(401, "Vui lòng đăng nhập.");
    return NextResponse.json(await db.project.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true, slug: true, type: true, status: true, publicationState: true, publicationError: true, revision: true, publishedRevision: true, updatedAt: true, _count: { select: { media: true } } } }));
  } catch (error) { return routeError(error); }
}
export async function POST(request: Request) {
  try {
    const user = await adminMutation(request);
    const data = projectSchema.parse(await request.json());
    const project = await db.project.create({ data });
    await db.auditLog.create({ data: { userId: user.id, action: "PROJECT_CREATE", targetId: project.id } });
    return NextResponse.json({ id: project.id }, { status: 201 });
  } catch (error) { return routeError(error); }
}
