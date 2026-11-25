# FRAME — Media portfolio

Portfolio Next.js triển khai theo [layout V3](docs/layout-revision-v3.md) và [kế hoạch](docs/portfolio-plan.md). Giao diện tiếng Việt, sáng tím, ưu tiên phim sản phẩm dọc và bộ ảnh.

## Chạy local

Yêu cầu Node.js 22+ (đã kiểm thử Node 24), MySQL 8, FFmpeg và FFprobe có trong PATH.

```powershell
cd C:\laragon\www\Portfolio_media
npm ci
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
npm run db:migrate
npm run db:seed
npm run dev
```

Script setup dành cho máy Laragon hiện tại: MySQL riêng tại `.local/mysql`, cổng **3307**, không sử dụng database của dự án khác. Nếu đường dẫn MySQL thay đổi, sửa `$taskBase` trong script. Chạy lại script để khởi động DB sau khi restart máy. Với MySQL có sẵn, copy `.env.example` sang `.env`, tạo database/user riêng rồi cập nhật `DATABASE_URL`; không cần script Laragon.

- Website: http://127.0.0.1:3000
- Quản trị: http://127.0.0.1:3000/admin
- Tài khoản: `ADMIN_EMAIL` và `ADMIN_PASSWORD` trong **`.env`**. Mật khẩu local được tạo ngẫu nhiên; không đưa file này lên Git.
- `npm run dev` chạy cả web và worker xử lý media. Giữ terminal này mở.
- Seed tạo 5 dự án và media minh họa, gồm video MP4 có chuyển động thật. Đây chưa phải tác phẩm hay khách hàng thực tế của chủ website.
- `npm run admin:create` tạo admin mà không nạp demo, dùng được khi kết nối production. `npm run admin:create -- --reset-password` đổi mật khẩu theo biến môi trường và thu hồi session cũ.

## Các luồng đã có

Trang chủ, danh sách/lọc dự án, giới thiệu, liên hệ lưu DB, quyền riêng tư, sitemap và metadata. Hero dùng poster blur từ cùng tác phẩm phía trước. Chi tiết desktop chia đôi; mobile hiển thị media hết màn đầu, cuộn dọc xuống thông tin. Bộ ảnh trượt ngang, giữ tỉ lệ, có thumbnail/phím mũi tên. Hậu trường ảnh/video mở modal, điều khiển bàn phím, dừng và giải phóng video khi đóng.

Hero đã bổ sung [slider xếp thẻ theo mẫu ViDesigns](docs/hero-slider.md): ba lớp thẻ, tự đổi mỗi 3 giây, đồng bộ nền/CTA, hỗ trợ nút chuyển, bàn phím, vuốt và reduced motion.

Giao diện có [Liquid Glass cho web](docs/liquid-glass.md) ở các lớp điều hướng, nút và điều khiển: kính mờ, viền bắt sáng, highlight theo con trỏ và fallback tăng độ rõ. Hình ảnh/video vẫn giữ nguyên bản hiển thị đã xử lý.

Khu vực video dùng [slider phối cảnh theo GIF](docs/film-slider.md): thẻ giữa sáng và lớn, hai thẻ bên nghiêng, nền blur đổi theo tác phẩm, có nút chuyển/chọn thẻ/vuốt. Dùng chung ở trang chủ và trang danh sách video.

Từ 1200px, slider video hiển thị 5 thẻ (hai mỗi bên thẻ chính); màn nhỏ giữ 3 thẻ. Khi chưa đủ 5 video, các dự án có thật được lặp vòng; bộ đếm vẫn tính số dự án thực tế.

`photo-grid` dùng [accordion ảnh theo video mẫu](docs/photo-accordion.md): dải ảnh hẹp mở rộng khi bấm, hiện thông tin và nút xem bộ ảnh. Có bàn phím và cuộn ngang trên mobile; dùng dữ liệu dự án thật.

Admin có đăng nhập, bản nháp/preview riêng tư, tạo/sửa/sắp xếp media, cover/focal point/alt/caption, xuất bản/gỡ xuất bản, lưu trữ/khôi phục dự án, thư viện tái sử dụng, tiến độ/hủy/thử lại upload, thử lại xử lý lỗi, thùng rác media khôi phục 7 ngày, quản lý liên hệ và cài đặt website.

## Media và chất lượng

- Bản gốc được giữ riêng tư. DB chỉ chứa metadata, quan hệ và đường dẫn; không lưu binary.
- Ảnh xoay theo EXIF, chuyển sRGB, loại metadata, tạo WebP theo cạnh dài 480/960/1600/2560/3200 px nếu nguồn đủ lớn, chất lượng 85–90. Không upscale. Browser chọn bằng `srcSet`; không nén hao hụt lần thứ hai qua Image Optimizer. Ảnh ngoài màn hình tải lazy.
- Video qua worker FFmpeg: H.264/AAC CRF 19, faststart, giữ chiều dọc; poster riêng. Video chỉ tải sau thao tác phát. Video trên 60 giây hoặc bản MP4 trên 40 MiB tạo thêm HLS nhiều mức 480/720/1080 theo kích thước nguồn, tự điều chỉnh và có lựa chọn chất lượng trên player HLS.js. Safari dùng HLS native.
- Mặc định mỗi ảnh tối đa 50 MiB, video 2 GiB; giới hạn tổng **nguồn** 20 GiB. Dung lượng derivatives và băng thông cần theo dõi riêng trên cloud. HEIC cần chuyển sang JPEG trước khi upload.
- Xuất bản tạo snapshot riêng. Chỉnh sửa draft không thay đổi nội dung đang công khai. Cloud dùng hai Blob stores private/public; worker chỉ công khai derivatives. Gỡ xuất bản ngăn truy cập mới, không thu hồi các tệp khách đã tải/cache trước đó.
- Đây là các cấu hình cân bằng chất lượng/tốc độ ban đầu. Cần đánh giá bằng tác phẩm thật, màn hình retina và mạng di động trước launch; chưa có kết quả Core Web Vitals production.

## Kiến trúc và lệnh kiểm tra

`src/app` chứa public/admin/API; `src/components` chứa giao diện; `src/lib` chứa auth/storage/data; `prisma` chứa schema/migrations; `worker` chứa xử lý media và publication. Worker riêng để encode video không chiếm thời gian Vercel Function.

```powershell
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npm audit
```

Integration cần MySQL, web và worker đang chạy, chỉ cho phép local storage. Nó tạo fixture có tên QA riêng rồi dọn đúng dữ liệu của mình; kiểm tra auth, upload, ảnh/video/HLS, xuất bản snapshot, byte ranges, archive, liên hệ và thùng rác. Không chạy trên dữ liệu production.

Nếu chạy integration nhiều lần trên local trong cùng giờ, dùng `npm run test:integration -- --reset-local-rate-limits` để xóa đúng bucket rate limit loopback dành cho kiểm thử. Cờ này chỉ cho phép `APP_URL` localhost/127.0.0.1 và local storage; không tắt rate limit của server. Test còn kiểm tra yêu cầu liên hệ vượt giới hạn bị trả về 429.

**Windows:** dừng `npm run dev` trước `npm run build` hoặc `npm run db:generate` vì Prisma DLL đang được web/worker sử dụng. Dùng Webpack do lỗi junction Prisma/Turbopack trên máy này. Muốn xem bản production local: build rồi `npm start`; mở terminal khác chạy `npm run worker`.

## Đưa lên cloud sau

Mã nguồn được quản lý tại [GitHub — insofanhh/portfolio_media](https://github.com/insofanhh/portfolio_media), nhánh `main`. Xem [hướng dẫn triển khai](docs/deployment.md), [vận hành](docs/operations.md) và `.env.example`. Đã chuẩn bị CI, migrations, worker Docker và bộ kiểm tra cấu hình. Chưa provision Vercel/Blob/TiDB/Cloud Run và chưa chạy kiểm thử cloud. Không cần nhập khóa cloud để xem bản local.
