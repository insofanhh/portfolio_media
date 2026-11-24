import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { adminMutation, HttpError, routeError } from "@/lib/http";
import { settingsSchema } from "@/lib/validation";
export async function PUT(request: Request) {
  try {
    const user = await adminMutation(request);
    const data = settingsSchema.parse(await request.json());
    if (data.heroProjectId && !await db.project.count({ where: { id: data.heroProjectId, status: "PUBLISHED" } })) throw new HttpError(400, "Chọn dự án đã xuất bản cho banner.");
    await db.siteSettings.upsert({ where: { id: "site" }, create: { id: "site", data }, update: { data } });
    await db.auditLog.create({ data: { userId: user.id, action: "SETTINGS_UPDATE", targetId: "site" } });
    revalidateTag("site-settings", { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (error) { return routeError(error); }
}
