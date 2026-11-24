import { siteSettings } from "@/lib/projects";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export const metadata = { title: "Quyền riêng tư" };
export default async function PrivacyPage() {
  const settings = await siteSettings();
  return <div className="site-shell"><SiteHeader brand={settings.brand} /><main id="main-content" className="prose-page"><p className="eyebrow">PRIVACY</p><h1>Thông tin của bạn.</h1><h2>Thông tin được thu thập</h2><p>Form liên hệ lưu họ tên, email, loại dự án và brief bạn chủ động gửi. Những thông tin này được sử dụng để phản hồi và trao đổi về yêu cầu hợp tác.</p><h2>Lưu trữ và quyền truy cập</h2><p>Nội dung yêu cầu liên hệ chỉ hiển thị cho người quản trị website. Website sử dụng cookie phiên đăng nhập cho khu vực quản trị; người xem portfolio không cần tạo tài khoản.</p><h2>Yêu cầu chỉnh sửa hoặc xóa</h2><p>Bạn có thể liên hệ {settings.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : "qua form liên hệ"} để yêu cầu xem lại, chỉnh sửa hoặc xóa thông tin đã gửi. Không gửi thông tin nhạy cảm không cần thiết trong brief dự án.</p></main><SiteFooter settings={settings} /></div>;
}
