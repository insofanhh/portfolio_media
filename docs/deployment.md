# Kết nối GitHub → Vercel + Blob + TiDB

Đây là cấu hình triển khai chuẩn bị sẵn; cần tạo tài khoản và kiểm thử staging trước khi sử dụng production. Không giả định các dịch vụ nằm trong gói miễn phí. Web ở Vercel; encode bằng worker container riêng (Cloud Run Job). Các lệnh tạo dịch vụ chỉ thực hiện sau khi chọn project, region và ngân sách.

## Trạng thái kết nối — 25/11/2026

- Repository: `insofanhh/portfolio_media`, nhánh production `main`.
- Vercel project: [portfolio-media](https://vercel.com/insofanhs-projects-e7977654/portfolio-media), đã nối GitHub; Next.js và Node 24. `vercel.json` dùng `npm ci` / `npm run build`; `.vercelignore` loại secrets, DB/upload local, build local và bản thiết kế khỏi gói deploy.
- Blob region `sin1`: `portfolio-media-originals` (private, prefix `BLOB`) và `portfolio-media-published` (public, prefix `BLOB_PUBLIC`), chỉ nối môi trường production. Hai token riêng tương ứng `BLOB_READ_WRITE_TOKEN` và `BLOB_PUBLIC_READ_WRITE_TOKEN`.
- File cấu hình bí mật local: `.local/production.env` (đã ignore, không commit). Database TiDB `portfolio` đã kết nối bằng strict TLS; hai migration đã áp dụng. Đã chuyển 5 dự án, 10 media, 38 variants, một tài khoản admin và cấu hình site từ local; không chuyển sessions, jobs hay rate limits.
- 86 Blob objects đã được copy: original/derivatives ở private, chỉ derivatives của dự án xuất bản ở public. Kiểm tra ảnh public HTTP 200, video range HTTP 206, original không có xác thực HTTP 403. Snapshot dùng URL Blob production, không còn đường dẫn media localhost.
- `DATABASE_URL`, `APP_URL=https://portfolio-media-five.vercel.app`, hai Blob tokens và worker secret đã cấu hình trên Vercel production. Còn thiếu Google Cloud project và service account để kích hoạt xử lý upload mới. Xem [hướng dẫn tạo Google Cloud project](google-cloud-setup.md). Các route upload/publish sẽ báo chưa cấu hình worker cho đến khi hoàn tất bước này.

## 1. GitHub và môi trường

Tạo repository trống rồi thêm remote thật và push nhánh local. `.env`, `.local`, upload, DB, build và `node_modules` đã được ignore. CI trong `.github/workflows/ci.yml` chạy MySQL tạm, lint/type/unit/integration/build. Không có secrets production trong workflow.

Tách staging/production: mỗi môi trường có DB, hai Blob stores, worker job và secrets riêng. Không nối Vercel Preview vào DB production. Đặt `APP_URL` đúng origin HTTPS của từng môi trường; đây cũng là nguồn được phép gửi mutation. Chốt domain ổn định cho staging để callback/upload và CSRF dùng cùng origin.

## 2. TiDB

Tạo database, tài khoản app với quyền CRUD và tài khoản migration riêng với DDL. Chọn region gần web/worker. Trong Connect → Prisma, lấy URL MySQL, URL-encode password và bật TLS `sslaccept=strict`; dùng trust store hệ thống hoặc chỉ định CA tin cậy qua `sslcert` nếu cluster cần CA riêng. Kết nối TiDB hiện tại đã xác minh strict TLS với cipher `TLS_AES_128_GCM_SHA256`, không cần CA tùy chỉnh. Không dùng `accept_invalid_certs`. Dùng pool nhỏ ban đầu (`connection_limit=3`, `pool_timeout=20`), sau đó kiểm tra concurrency theo hạn mức cluster. [Hướng dẫn Prisma của TiDB](https://docs.pingcap.com/developer/dev-guide-sample-application-nodejs-prisma/).

```dotenv
DATABASE_URL="mysql://USER:URL_ENCODED_PASSWORD@HOST:4000/portfolio_media?sslaccept=strict&sslcert=ABSOLUTE_CA_PATH&connection_limit=3&pool_timeout=20"
```

Trên worker Debian có thể dùng CA bundle hệ thống nếu chuỗi chứng chỉ cluster được bundle đó tin cậy; nếu cluster cấp CA riêng, mount đúng CA riêng. Trên Vercel, thêm CA công khai vào `prisma/certs/`, bật `outputFileTracingIncludes` cho file này trong `next.config.ts` và đặt `sslcert` trỏ tới file đã được bundle ở runtime. Kiểm tra cả build và runtime đọc được file; chứng chỉ CA phải được lấy từ nhà cung cấp, không tự tạo chứng chỉ thay thế.

Chạy `npm run db:migrate` từ máy/runner đáng tin với URL của tài khoản migration. Không dùng `migrate dev` hay reset DB trên production. Hai migrations đã chạy thành công trên TiDB 8.5.3 Serverless ngày 25/11/2026. Tiếp tục nghiệm thu auth, upload, publish/unpublish trên staging khi worker sẵn sàng.

## 3. Hai Blob stores

Tạo một store **Private** cho sources/drafts và một store **Public** cho derivatives đã xuất bản. Gán token riêng: `BLOB_READ_WRITE_TOKEN` là token private; `BLOB_PUBLIC_READ_WRITE_TOKEN` là token public. Không để dashboard tự ghi đè token private khi connect store thứ hai. [Blob private/public](https://vercel.com/docs/vercel-blob), [upload trực tiếp từ trình duyệt](https://vercel.com/docs/vercel-blob/client-upload).

Đặt `STORAGE_DRIVER=blob` ở web và worker. Browser upload thẳng private Blob bằng token ngắn hạn được API admin cấp; token read/write không đưa vào client. Callback SDK xác minh phiên, worker nhận job trong DB, encode, rồi copy derivatives vào public store khi xuất bản. URL derivatives có version và cache dài. Các tệp gốc không được copy ra public store.

## 4. Worker media

Build `Dockerfile.worker` và đẩy image vào registry của project đã chọn. Tạo Cloud Run Job chạy CMD mặc định `npm run worker:once`. Gợi ý ban đầu 2 vCPU/4 GiB RAM, một task, timeout 60 phút, hạn chế concurrency và theo dõi với footage thực tế; đây không phải sizing đã load-test. FFmpeg có sẵn trong image. Worker drain hàng đợi đến khi hết job có thể chạy ngay, có lease/heartbeat/retry.

Web cần service account riêng, chỉ được execute đúng Cloud Run Job (`run.jobs.run`); `GCP_SERVICE_ACCOUNT_JSON` là JSON account đó trong secret manager/Vercel env. Worker dùng runtime identity riêng, cấp quyền đọc các secrets thực sự cần. Không cấp account web quyền owner/editor project. Không lưu key JSON lên Git.

Web env cần `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_REGION`, `MEDIA_WORKER_JOB`, `GCP_SERVICE_ACCOUNT_JSON`. Worker cần `DATABASE_URL`, `STORAGE_DRIVER`, hai Blob tokens, `APP_URL`, `WORKER_SECRET`, giới hạn media và `FFMPEG_PATH=ffmpeg`, `FFPROBE_PATH=ffprobe`. Worker không cần key dispatch.

Cấu hình scheduler ngoài app gọi `POST /api/internal/reconcile` mỗi 5 phút với `Authorization: Bearer WORKER_SECRET`; endpoint khôi phục lease hết hạn, dọn session/rate limit, đánh dấu upload hết hạn, kích hoạt job còn chờ. Chọn scheduler hỗ trợ POST/header bí mật (ví dụ Cloud Scheduler HTTP); token đặt bằng secret/biến khi provision, không nhúng vào file Git. Endpoint này dùng bearer ứng dụng, không chỉ Google OIDC. Nếu cần giới hạn tầng mạng, cấu hình thêm theo hạ tầng đã chọn. Đừng dùng Vercel cron GET trực tiếp vào endpoint POST này.

## 5. Vercel

Import GitHub repository, preset Next.js, Node 24, install `npm ci`, build `npm run build`. Next web phải dùng Node runtime. Không chạy FFmpeg trong Vercel Function. Nhập env riêng cho staging/production; `APP_URL` phải trùng domain đang truy cập admin. Không đặt secrets trong biến `NEXT_PUBLIC_*`.

Chạy `npm run admin:create` từ môi trường đáng tin đã kết nối TiDB bằng `ADMIN_EMAIL`/`ADMIN_PASSWORD` mạnh. Lệnh không nạp demo. Sau khi tạo, bỏ bootstrap password khỏi môi trường web và lưu vào password manager của chủ site. Muốn đổi mật khẩu, cập nhật env trong terminal quản trị rồi chạy `npm run admin:create -- --reset-password`.

`npm run check:production` kiểm tra cấu trúc env, không in secrets. Lệnh này chỉ kiểm tra cấu hình web; chưa xác minh quyền cloud, chứng chỉ, hóa đơn hay dữ liệu thật. Không chạy nó trong CI local như điều kiện phải pass.

## 6. Điều kiện launch

- Migration, TLS và pool chạy được trên TiDB staging; xác nhận constraints/transactions.
- Upload thẳng Blob nhiều ảnh, video lớn, hủy/retry, callback hết hạn, session hết hạn và không đăng nhập.
- Job xử lý ảnh/video/HDR/video dài; web hiển thị trạng thái lỗi và thử lại.
- Xác nhận original/draft không đọc công khai; publish tạo public derivatives; bản sửa nháp không lộ; unpublish loại khỏi trang/sitemap. Tệp đã cache/download không thể thu hồi từ máy khách.
- HLS phát/tua được trong Chromium qua HLS.js và iOS Safari native; thử mạng yếu và mất mạng.
- Đo LCP/CLS/INP với dữ liệu thật trên mobile, kiểm tra ảnh retina và chi phí bandwidth/storage. Chưa có số đo cloud.
- Thử restore DB + cả hai Blob stores trước; bật cảnh báo job FAILED, queue tồn lâu, quota và chi phí.

Thông báo liên hệ hiện lưu DB/admin; chưa gửi email. Analytics, đa ngôn ngữ và album riêng cho khách là giai đoạn sau theo plan.
