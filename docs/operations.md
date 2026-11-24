# Vận hành và khôi phục

## Hằng ngày

Kiểm tra dashboard admin: media FAILED, job tồn, inquiry mới. Kiểm tra logs web/worker và dung lượng/băng thông riêng trên Blob. `MAX_STORAGE_BYTES` chỉ chặn tổng dung lượng sources được khai báo; không đại diện tổng hóa đơn cloud, derivatives hay traffic. Thông báo gửi email chưa cấu hình.

Khi xử lý lỗi: xem nguyên nhân trong thư viện, kiểm tra định dạng/FFmpeg/worker/DB, sau đó dùng “Thử xử lý lại”. Khi xuất bản lỗi: sửa nguyên nhân rồi xuất bản lại. Job retry có backoff; scheduler reconcile gọi lại worker nếu bị gián đoạn. Cảnh báo vận hành nên dựa trên `ProcessingJob.status=FAILED` và tuổi job PENDING/RUNNING; chưa gắn dịch vụ alert bên ngoài.

## Sao lưu

Local: sao lưu `.env` ở nơi bảo mật; export database bằng tài khoản backup và công cụ MySQL, đồng thời sao chép `.local/storage`. Dừng ghi/upload/xuất bản trong cửa sổ backup để giữ DB và media nhất quán. Không chỉ sao chép thư mục raw `.local/mysql` khi MySQL đang chạy. `.local/demo-input` chỉ là nguồn minh họa, không thay thế kho media.

Cloud: bật tính năng backup theo gói TiDB thực tế và export độc lập định kỳ. Sao lưu **cả private và public Blob stores**, giữ nguyên pathname/version; lưu inventory, checksum và mốc thời gian cùng bản dump DB. Bản backup độc lập cần quyền/retention tách khỏi credentials app. Chính sách ban đầu đề xuất 7 bản ngày + 4 bản tuần, điều chỉnh theo dung lượng và ngân sách của chủ website.

Thử restore vào môi trường riêng: tạo DB trống → restore dump → khôi phục media theo đúng path → nếu đổi store/domain, cập nhật URL metadata/snapshot tương ứng → kiểm tra original riêng tư, project công khai, ảnh đủ, video tua được → mới đổi app sang môi trường phục hồi. Không kết nối staging vào production trong khi thử. Ghi lại thời gian khôi phục thực tế; chưa công bố RPO/RTO khi chưa diễn tập.

## Thay thế nội dung mẫu

Trong Cài đặt thay tên, giới thiệu, liên hệ và social. Upload tác phẩm thật vào dự án mới, nhập vai trò/credits/alt/caption, đặt cover, xem preview, xuất bản. Chọn dự án hero đã xuất bản. Gỡ xuất bản các dự án mẫu rồi lưu trữ. Media mẫu có thể dùng chung; gỡ hết quan hệ trước khi đưa vào thùng rác. Trạng thái ARCHIVED giữ nội dung để khôi phục; media thùng rác được xóa sau 7 ngày khi worker xử lý đến hạn.

## Giới hạn hiện tại

Đã kiểm tra local MySQL + local filesystem; cần nghiệm thu Blob/TiDB/Cloud Run thật theo deployment checklist. Encode là lossy có cấu hình chất lượng cao; không cam kết giống hệt master. HEIC chưa bật vì decoder khác nhau theo build Sharp. HLS chỉ sinh cho video dài/lớn. Nguồn không được replace tại chỗ từ admin; upload media mới rồi thay trong bản nháp để không làm thay đổi snapshot đang xuất bản.

Khi gỡ xuất bản, public CDN và browser có thể còn bản đã cache; không dùng public Blob cho nội dung cần thu hồi tuyệt đối. Việc xóa tài nguyên công khai không thể xóa bản sao đã được khách tải về. Cleanup upload bỏ dở/orphan trên cloud cần đối chiếu inventory với DB theo lịch vận hành, không cấu hình lifecycle xóa tùy tiện toàn store.
