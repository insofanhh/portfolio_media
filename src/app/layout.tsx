import type { Metadata } from "next";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "./globals.css";
import "./liquid-glass.css";
import "./film-slider.css";
import { LiquidGlassLighting } from "@/components/liquid-glass-lighting";
import { appUrl } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "FRAME — Photography & Film", template: "%s · FRAME" },
  description: "Portfolio nhiếp ảnh và phim sản phẩm. Những câu chuyện kể qua ánh sáng, chuyển động và từng khung hình.",
  openGraph: { type: "website", locale: "vi_VN", siteName: "FRAME" },
  twitter: { card: "summary_large_image" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body><a className="skip-link" href="#main-content">Đến nội dung chính</a>{children}<LiquidGlassLighting /></body></html>;
}
