# Slider video có phối cảnh

Màn hình từ 1200px hiển thị 5 thẻ (một thẻ chính và hai mỗi bên); dưới 1200px hiển thị 3 thẻ. Hai thẻ ngoài cùng nhỏ/tối hơn và vẫn bấm được. Nếu chỉ có 2–4 video, slider lặp các dự án có thật quanh vòng để đủ thẻ; chỉ số và pagination tính theo dự án thực tế, không tạo nội dung mới. Một video vẫn chỉ hiện một thẻ.

Thực hiện theo GIF người dùng cung cấp: thẻ giữa đứng thẳng và sáng, hai thẻ bên nhỏ hơn/tối hơn và nghiêng vào trong; chuyển thẻ đồng thời đổi nền blur và tiêu đề. Giữ media dọc 9:16 và màu FRAME bên ngoài vùng xem. Bộ điều hướng tiếp tục dùng phong cách Liquid Glass.

`src/components/film-slider.tsx` dùng chung cho video ở trang chủ và `/work` (kể cả lọc VIDEO). Trang chủ lấy các video đã xuất bản theo thứ tự hiện có; trang danh sách giữ phân trang. Bộ ảnh và các dự án hỗn hợp tiếp tục dùng grid.

- Nút trái/phải, chấm chọn, chọn thẻ bên để đưa vào giữa, phím mũi tên và gesture vuốt ngang bằng touch/pen. Chỉ thẻ giữa mở trang chi tiết; gesture đổi thẻ chặn click mở link ngoài ý muốn. Không autoplay video hay tự chuyển carousel.
- CSS perspective/rotateY/translate3d cho chiều sâu, transition 700ms, tiêu đề vào cùng slide, poster zoom nhẹ khi hover. Lớp phối cảnh không bắt pointer để các thẻ ở Z âm vẫn bấm được.
- Nền dùng thumbnail mờ, chuyển nền giữ tối đa ảnh cũ/mới; chỉ tải poster của các thẻ đang hiển thị (tối đa 5 ở màn lớn, 3 ở màn nhỏ). Các bản lặp dùng chung URL/cache. Không tải nguồn video trong carousel, không thêm thư viện.
- Có 0/1/2 hoặc nhiều dự án: component rỗng không render, một dự án không có nút chuyển, số lượng còn lại wrap theo modulo. Pagination chấm cuộn ngang khi nhiều dự án, không làm tăng chiều cao stage.
- Tiêu đề/role dài được giới hạn số dòng. Mobile giữ thẻ giữa và một phần hai thẻ cạnh, nút không tràn ngang. Có reduced motion, reduced transparency/contrast và forced colors.

Kiểm tra trực tiếp: nút chuyển, chọn thẻ bên, vòng cuối → đầu, bàn phím, chấm chọn, link đúng dự án; desktop và mobile 390/320 px không tràn ngang, không có video source tải trong carousel. Touch gesture đã triển khai, cần nghiệm thu thêm trên điện thoại thực tế. TypeScript/lint/build được kiểm tra trước bàn giao.
