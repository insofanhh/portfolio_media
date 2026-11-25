# Liquid Glass cho FRAME

## Nghiên cứu

[Apple HIG — Materials](https://developer.apple.com/design/human-interface-guidelines/materials) và [Meet Liquid Glass, WWDC25](https://developer.apple.com/videos/play/wwdc2025/219/) mô tả vật liệu có chiều sâu, ánh sáng theo hình khối và phản hồi mềm khi tương tác. Điểm thiết kế được áp dụng: dùng kính ở lớp điều hướng/điều khiển, giữ nội dung làm trọng tâm, hạn chế kính chồng kính và ưu tiên độ rõ của nhãn.

Đây là diễn giải cho web: CSS blur/saturation, viền bắt sáng, bóng nhiều lớp, lớp màu bảo đảm tương phản và highlight theo con trỏ. Không phải API Liquid Glass native, không mô phỏng đầy đủ khúc xạ thích ứng của Apple. [WebKit giải thích backdrop filters](https://webkit.org/blog/3632/introducing-backdrop-filters/) và lưu ý chi phí thêm lượt render; [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter) mô tả hỗ trợ trình duyệt và yêu cầu lớp nền trong để thấy hiệu ứng.

## Triển khai

- `src/app/liquid-glass.css`: tokens chung, light glass cho header/nút phụ/slider/filter/tab, tint tối cho CTA chính, lớp tối cục bộ cho nút trên ảnh/video. Viền frame chỉ có ánh sáng cạnh; không thêm blur/biến dạng lên tác phẩm.
- Header nổi sticky có blur khi nội dung cuộn phía sau. Menu điện thoại có nền kính dày hơn để đọc rõ. Các button bên trong header/toolbar/slider không tạo thêm lớp backdrop blur lồng nhau.
- `src/components/liquid-glass-lighting.tsx`: một listener pointer được delegate; chỉ desktop fine pointer, tối đa một requestAnimationFrame chờ xử lý. Không set React state trên mỗi lần di chuột và không có vòng lặp render thường trực. Highlight không bắt click.
- Các section trang chủ (video, bộ ảnh, hậu trường, giới thiệu, quy trình và liên hệ) dùng một lớp material bán trong suốt thay nền đặc. Nền trang có các vùng màu lavender, sage và peach tĩnh để kính truyền được màu phía sau; cạnh sáng, bóng nhẹ và highlight tĩnh tạo chiều sâu. Đây là diễn giải thẩm mỹ Liquid Glass cho web; Apple phân biệt lớp Liquid Glass cho điều hướng với standard materials cho nội dung.
- Blur section đặt trên `::before` ở dưới nội dung, không đặt trên section cha: ảnh/video giữ sắc nét, tránh thay containing block của thành phần nổi. `::after` chỉ tạo phản sáng ở mép; cả hai không nhận click. Không bổ sung highlight theo con trỏ cho các panel lớn.
- Blur giới hạn 10–18px ở phần điều khiển, 20px cho material section và giảm còn 12px trên mobile. Nền môi trường không chạy animation; không thêm WebGL, SVG displacement, thư viện animation hay media mới. Bảng và form quản trị giữ nền đặc.
- Có `@supports` nền đặc khi không hỗ trợ backdrop filter, `prefers-reduced-transparency`, `prefers-contrast`, `prefers-reduced-motion` và forced colors. Pointer highlight dừng khi giảm chuyển động/transparency, tăng contrast hoặc forced colors. Mức hỗ trợ media query phụ thuộc trình duyệt/OS.
- Giữ khoảng cách cụm slider đã sửa và không đưa nút pause trở lại. Chuyển động/đường dẫn của slider tiếp tục dùng component hiện có.

## Kiểm tra

Kiểm tra hình thức và chức năng trên browser desktop/mobile: header khi cuộn, menu, CTA, slider, filter, tab chi tiết, nút quay về, modal ảnh/video, không tràn ngang và không lớp highlight chặn tương tác. Kiểm tra computed styles cho blur và vị trí các control, console, TypeScript/lint/build. Kiểm tra setting tương phản/transparency và hiệu năng trên Safari/iOS, thiết bị yếu thực tế trước launch; không công bố số đo FPS hay chứng nhận accessibility khi chưa đo.
