# Duyệt layout portfolio — V2

Ngày cập nhật: 24/11/2026. Phạm vi: phác thảo giao diện trước khi triển khai website. Thay thế các đề xuất bố cục tương ứng trong kế hoạch V1; các mục hạ tầng không đổi.

## Các thay đổi theo yêu cầu

1. **Giới thiệu đầu trang**: lời chào nhỏ, tên chủ portfolio lớn, chức danh Photographer & Filmmaker màu tím, mô tả 1–2 câu và hai CTA. Tên là dữ liệu chờ bổ sung. Không dùng slogan lớn ba dòng của V1.
2. **Background banner**: cùng nguồn với media spotlight bên phải. Ưu tiên poster blur tĩnh; khi có clip phù hợp và người dùng không bật reduced motion/data saver, có thể dùng video nền muted, playsinline, blur. Lớp phủ sáng dưới chữ giữ khả năng đọc. Không tải hai bản video lớn chỉ để làm nền.
3. **Dự án video dọc**: poster/player giữ tỉ lệ nguồn, mặc định 9:16. Desktop ba card dọc một hàng; mobile dự án đầu nổi bật, hai dự án sau thành cặp. Không ép video vào thumbnail ngang. Bản phát tương ứng: 480×854, 720×1280, 1080×1920 khi nguồn cho phép; kiểm tra kích thước chẵn và tỉ lệ thực khi encode, không upscale.
4. **Hậu trường trên trang chủ**: một video BTS dọc, hai ảnh setup/chi tiết và đoạn giới thiệu ngắn. Có liên kết đến tab Hậu trường của dự án. Gallery ảnh tác phẩm là section riêng.
5. **Trang chi tiết video**: desktop chia trái/phải 50/50; trái là nền tối, video 9:16 căn giữa và backdrop blur từ cùng poster, nút đóng/trước/sau. Phải là tên, mô tả, vai trò, khách hàng, ý tưởng, credits, tab Hậu trường và CTA liên hệ. Không thêm bình luận, lượt thích hoặc lượt theo dõi vào portfolio.

## Trải nghiệm màn dọc

Trang chi tiết bắt đầu trực tiếp bằng khu video, không dành diện tích cho header trang chủ. Khu xem chiếm một chiều cao màn hình; video dùng object-fit: contain, không crop mất nội dung để lấp đầy thiết bị có tỉ lệ khác 9:16. Phần trống dùng nền blur từ cùng media. Nút quay lại, điều khiển phát và cue “Vuốt lên để xem thông tin” nằm trong vùng an toàn.

Thông tin nằm tiếp theo trong luồng cuộn bình thường. Vuốt lên hoặc bấm cue đều đến phần thông tin; không chiếm gesture bằng một carousel chuyển sang video khác. Video trước/sau dùng nút riêng để không xung đột cuộn đọc. Dừng phát khi vùng video ra khỏi màn hình; không tự phát lại khi chỉ cuộn đọc thông tin.

Khi triển khai, đo chiều cao thực bằng viewport/safe-area phù hợp, ưu tiên 100svh/dvh có fallback; cấu hình breakpoint theo cả chiều rộng và hướng màn hình. Trên tablet dọc cũng xếp video trước, thông tin sau. Bản phác thảo dùng khung điện thoại có viewport mô phỏng để duyệt tương tác ngay trong hội thoại.

## Nguồn nghiên cứu và giới hạn

- Ảnh TikTok desktop do người dùng cung cấp là tham chiếu trực tiếp cho quan hệ vùng video bên trái / thông tin bên phải.
- TikTok công bố hướng desktop modular, giảm yếu tố gây phân tâm và tập trung vào trải nghiệm xem: [TikTok Newsroom, 27/02/2025](https://newsroom.tiktok.com/new-features-bring-tiktok-magic-to-desktop?lang=en&pubDate=20250227).
- Tỉ lệ chia 50/50, panel thông tin portfolio và cuộn xuống thông tin trên màn dọc là thiết kế theo yêu cầu người dùng, không phải khẳng định TikTok hiện dùng đúng các quy tắc này trên mọi thiết bị.
- Poster dựng bằng hình khối trong bản phác thảo là minh họa; chưa có phim hay tác phẩm thật. Nút phát chỉ chỉ ra vị trí player. Bản triển khai vẫn sử dụng video upload lên Blob, không bắt buộc nhúng TikTok.

## Tương tác để duyệt

- Chọn Trang chủ / Dự án video / Bộ ảnh.
- Chọn màn rộng hoặc điện thoại.
- Bấm một card video để mở đúng dự án; thử trước/sau.
- Trong điện thoại, cuộn hoặc bấm “Vuốt lên để xem thông tin”.
- Chuyển Câu chuyện / Hậu trường trong phần thông tin.
- Có thể điều chỉnh độ blur và thử cùng lúc poster/nền qua điều khiển thiết kế của bản phác thảo.
