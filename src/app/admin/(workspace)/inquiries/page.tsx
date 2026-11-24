import { db } from "@/lib/db";
import { jsonSafe } from "@/lib/utils";
import { InquiryList } from "@/components/admin/inquiry-list";
import { requireUser } from "@/lib/auth";
export default async function InquiriesPage() {
  await requireUser();
  const inquiries = await db.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return <><div className="admin-page-heading"><div><p className="eyebrow">LET THE CONVERSATION BEGIN</p><h1>Yêu cầu liên hệ</h1><p>Những ý tưởng và lời mời hợp tác được gửi từ website.</p></div></div><InquiryList initial={jsonSafe(inquiries)} /></>;
}
