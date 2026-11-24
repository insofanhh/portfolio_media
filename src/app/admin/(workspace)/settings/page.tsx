import { db } from "@/lib/db";
import { defaultSettings, type Settings } from "@/lib/types";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireUser } from "@/lib/auth";
export default async function SettingsPage() {
  await requireUser();
  const [settings, projects] = await Promise.all([db.siteSettings.findUnique({ where: { id: "site" } }), db.project.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true }, orderBy: { featuredOrder: "asc" } })]);
  return <><div className="admin-page-heading"><div><p className="eyebrow">MAKE THE SPACE YOURS</p><h1>Cài đặt website</h1><p>Tên, giới thiệu và những cách khách hàng có thể tìm đến bạn.</p></div></div><SettingsForm initial={{ ...defaultSettings, ...(settings?.data as unknown as Settings || {}) }} projects={projects} /></>;
}
