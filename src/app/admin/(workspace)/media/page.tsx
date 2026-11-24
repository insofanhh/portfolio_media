import { db } from "@/lib/db";
import { jsonSafe } from "@/lib/utils";
import { MediaLibrary } from "@/components/admin/media-library";
import { requireUser } from "@/lib/auth";
export default async function AdminMediaPage() {
  await requireUser();
  const media = await db.media.findMany({ take: 60, orderBy: { createdAt: "desc" }, include: { variants: true, projects: { include: { project: { select: { id: true, title: true } } } }, _count: { select: { publicReferences: true } } } });
  return <><div className="admin-page-heading"><div><p className="eyebrow">YOUR VISUAL LIBRARY</p><h1>Thư viện media</h1><p>Upload ảnh, video và tái sử dụng trong nhiều dự án.</p></div></div><MediaLibrary initial={jsonSafe(media)} initialCursor={media.length === 60 ? media[59].id : null} /></>;
}
