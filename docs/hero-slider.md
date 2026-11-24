# Hero card stack

Tham khảo [ViDesigns — CMS Powered Card Stacking Slider](https://videsigns-cloneable-3.webflow.io/). Đã xem trực tiếp chuyển động và đọc phần hướng dẫn/source của mẫu: ba lớp thẻ, tự chuyển mỗi 3 giây, animation khoảng 600 ms; thẻ trước thoát về trái rồi tái nhập phía sau sau khoảng 200 ms. Mẫu đồng bộ nội dung và nền với thẻ trước.

Triển khai tại `src/components/hero-slider.tsx` bằng React state + CSS transform/opacity, không tải jQuery/Webflow hoặc asset của mẫu. Giữ phong cách FRAME, tỉ lệ 9:16 và thông tin giới thiệu của chủ portfolio.

- Tối đa 5 dự án đã xuất bản, dự án hero trong Cài đặt đứng đầu, tiếp đến thứ tự nổi bật hiện có. Chỉ 3 thẻ lộ ra; số lượng 0/1/2 cũng được xử lý.
- Nền blur, CTA, tiêu đề, loại tác phẩm và link chi tiết cùng cập nhật theo thẻ trước.
- Nút trước/sau, chọn chấm, phím trái/phải trong vùng media, vuốt ngang bằng touch/pen. Cuộn dọc trên mobile vẫn hoạt động; vuốt đổi thẻ không mở link.
- Tự chuyển mỗi 3 giây; tạm dừng khi hover, ra khỏi viewport hoặc tab bị ẩn. Tương tác thủ công/focus nội dung dừng autoplay. Cụm điều hướng chỉ gồm trước/sau và chấm chọn; cách khung thẻ khoảng 30 px. Thiết bị bật reduced motion không autoplay và bỏ animation.
- Thẻ phía sau dùng `inert` + `aria-hidden` để chỉ thẻ hiện tại nhận focus. Slide count được thông báo khi chuyển thủ công.
- Dùng poster responsive sẵn có, nền blur dùng thumbnail; không tải/phát nguồn video trong hero. Không thêm thư viện animation.

Đã kiểm tra trên trình duyệt: chuyển tự động, pause, chọn trực tiếp, vòng cuối → đầu, bàn phím, đồng bộ backdrop/CTA/link, không tràn ngang ở desktop và mobile 390/320 px. Touch swipe cần kiểm tra bổ sung trên thiết bị thật; logic đã được triển khai. Hỗ trợ reduced motion qua media query, chưa giả lập setting hệ điều hành trong lần kiểm tra này.
