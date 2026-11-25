# Tạo Google Cloud project cho worker media

Website và admin chạy trên Vercel; ảnh/video được lưu ở Blob. Worker riêng chạy FFmpeg để tạo ảnh tối ưu, poster, MP4/HLS và xuất bản media. Upload mới chưa được bật khi worker chưa cấu hình.

## Bước bạn cần thực hiện

1. Mở [Create project](https://console.cloud.google.com/projectcreate), đăng nhập Google, đặt tên `portfolio-media` và bấm Create. Ghi lại **Project ID** (chuỗi như `portfolio-media-123456`), không phải Project number.
2. Trong project vừa tạo, mở **Billing → Link a billing account**. Tạo hoặc chọn tài khoản thanh toán của bạn rồi liên kết. Nếu màn hình yêu cầu thông tin thanh toán/điều khoản, bạn tự hoàn tất. Việc dùng Cloud Run, build image, registry và secrets có thể phát sinh phí; không giả định mọi tài nguyên đều miễn phí. Xem [hướng dẫn billing của Google](https://docs.cloud.google.com/billing/docs/how-to/modify-project).
3. Mở Cloud Shell trong Console và chạy đoạn dưới, thay Project ID thật. Cloud Shell đã có `gcloud` và phiên đăng nhập của bạn:

```bash
TASK_PROJECT_ID="YOUR_PROJECT_ID"
gcloud config set project "$TASK_PROJECT_ID"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com cloudscheduler.googleapis.com
```

4. Gửi Project ID và cho biết bạn đã làm đến bước nào. Không gửi mật khẩu Google hay private key trong chat. Để thao tác tiếp từ máy local cần có phiên Google Cloud được xác thực; Project ID chỉ xác định project, không tự cấp quyền truy cập.

## Các phần còn lại cần triển khai

- Build `Dockerfile.worker`, đẩy image vào Artifact Registry, tạo Cloud Run **Job** `portfolio-media-worker` tại `asia-southeast1`.
- Worker dùng identity riêng để đọc đúng secrets của dự án: TiDB URL, hai Blob tokens, APP_URL và WORKER_SECRET. Web dùng service account khác, chỉ có `roles/run.invoker` trên job để gọi `run.jobs.run`; không cần Owner/Editor. [Service identity](https://docs.cloud.google.com/run/docs/configuring/jobs/service-identity), [quyền thực thi job](https://docs.cloud.google.com/run/docs/execute/jobs).
- Lưu `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_REGION`, `MEDIA_WORKER_JOB` và `GCP_SERVICE_ACCOUNT_JSON` vào `.local/production.env` và Vercel production. JSON account là bí mật; không commit Git và không đưa lên public Blob.
- Cấu hình scheduler gọi POST `/api/internal/reconcile` với bearer WORKER_SECRET; nghiệm thu upload ảnh/video, xử lý job và publish trước khi coi chức năng upload production đã sẵn sàng.

Tham khảo [Create jobs](https://docs.cloud.google.com/run/docs/create-jobs). Không chạy FFmpeg trong request Vercel.
