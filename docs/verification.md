# Kiểm tra bản triển khai local — 24/11/2026

Môi trường: Windows, Node 24.20.0, Next 16.4.6 Webpack, Prisma 6.19.3, MySQL 8.0.30 riêng cổng 3307, local storage và FFmpeg.

- Production build thành công, gồm kiểm tra TypeScript và prerender các trang công khai.
- ESLint sạch; 7 unit tests qua; npm audit không tìm thấy lỗ hổng tại thời điểm kiểm tra.
- Integration chạy trên cả dev và production local: auth/session/CSRF, từ chối upload sai định dạng/dung lượng, stream upload, encode ảnh/video, bảo vệ media nháp, publish snapshot, sửa nháp không lộ, range 206/416, HLS video 61 giây và segment, unpublish, bảo vệ media đang dùng, thùng rác/restore, archive/restore project, contact persistence/honeypot/rate limit và logout.
- Kiểm tra trình duyệt thực tế: homepage, video phát được (`readyState=4`), tab hậu trường ảnh/video, modal vừa khung và dọn player khi đóng, Escape và trả focus về thumbnail, gallery bằng nút/thumbnail/phím mũi tên, giữ slide khi resize, login/dashboard/thư viện/cài đặt admin.
- Viewport mobile 390 × 844 và 320 × 740: không tràn ngang trang chủ; trang chi tiết media ở màn đầu, thông tin ở màn tiếp theo. Desktop chia 50/50. Ảnh kiểm tra không bị lỗi tải, trang chủ không tải nguồn video trước thao tác phát.

Ảnh giao diện: [trang chủ](screenshots/home-desktop.jpg), [chi tiết desktop](screenshots/project-desktop.jpg), [chi tiết mobile](screenshots/project-mobile.jpg).

Chưa kiểm thử: tài khoản Blob/TiDB/Cloud Run/Vercel thật, CI trên GitHub, Docker build trên máy này, Safari/iOS thật, video HDR thực tế, tải đồng thời production, Core Web Vitals và hóa đơn cloud. Các mục này cần nghiệm thu staging theo deployment.md. Hình/video hiện là dữ liệu minh họa.

## Cập nhật 25/11/2026 — phát video trong film slider

Slider trang chủ và danh sách video giờ tự phát thẻ giữa khi đủ 50% trong viewport (muted, loop, playsInline), hoặc bấm Play. Nút phát/dừng và âm thanh tách khỏi link chi tiết. Kiểm tra bằng browser: `paused=false`, `currentTime` tăng, bật tiếng, chuyển thẻ chỉ còn một video, nguồn chưa được gán khi slider nằm ngoài viewport lúc tải trang, dừng ngoài vùng xem và khi mở modal, giữ Pause thủ công sau khi cuộn trở lại. Mobile 390 × 844 và 320 × 740 không tràn ngang và hai nút điều khiển không chồng nhau. ESLint, TypeScript và production build được kiểm tra lại. Cần kiểm thử bổ sung autoplay policy/reduced motion/Data Saver trên trình duyệt thực tế và luồng HLS dài trong slider; các demo dùng MP4.
