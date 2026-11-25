# Slider video có phối cảnh

Màn hình từ 1200px hiển thị 5 thẻ (một thẻ chính và hai mỗi bên); dưới 1200px hiển thị 3 thẻ. Hai thẻ ngoài cùng nhỏ/tối hơn và vẫn bấm được. Nếu chỉ có 2–4 video, slider lặp các dự án có thật quanh vòng để đủ thẻ; chỉ số và pagination tính theo dự án thực tế, không tạo nội dung mới. Một video vẫn chỉ hiện một thẻ.

Thực hiện theo GIF người dùng cung cấp: thẻ giữa đứng thẳng và sáng, hai thẻ bên nhỏ hơn/tối hơn và nghiêng vào trong; chuyển thẻ đồng thời đổi nền blur và tiêu đề. Giữ media dọc 9:16 và màu FRAME bên ngoài vùng xem. Bộ điều hướng tiếp tục dùng phong cách Liquid Glass.

`src/components/film-slider.tsx` dùng chung cho video ở trang chủ và `/work` (kể cả lọc VIDEO). Trang chủ lấy các video đã xuất bản theo thứ tự hiện có; trang danh sách giữ phân trang. Bộ ảnh và các dự án hỗn hợp dùng [photo accordion](photo-accordion.md).

- Nút trái/phải, chấm chọn, chọn thẻ bên để đưa vào giữa, phím mũi tên và gesture vuốt ngang bằng touch/pen. Link trên thẻ giữa mở trang chi tiết; nút Play/Pause riêng phát/dừng ngay trong thẻ. Gesture đổi thẻ chặn click mở link ngoài ý muốn. Carousel không tự chuyển thẻ.
- CSS perspective/rotateY/translate3d cho chiều sâu, transition 700ms, tiêu đề vào cùng slide, poster zoom nhẹ khi hover. Lớp phối cảnh không bắt pointer để các thẻ ở Z âm vẫn bấm được.
- Nền dùng thumbnail mờ, chuyển nền giữ tối đa ảnh cũ/mới; chỉ tải poster của các thẻ đang hiển thị (tối đa 5 ở màn lớn, 3 ở màn nhỏ). Các bản lặp dùng chung URL/cache. Chỉ thẻ giữa mount `FilmCardVideo`, lấy video đầu tiên thuộc MAIN (cover vẫn có thể là ảnh).
- Video tự phát lặp, tắt tiếng, `playsInline` khi ít nhất 50% thẻ nằm trong viewport. Play/Pause và bật/tắt âm thanh là button độc lập với link. Dừng khi cuộn khỏi vùng xem, ẩn tab hoặc mở modal; khi người xem chủ động Pause thì giữ trạng thái đó cho đến khi bấm Play hoặc đổi thẻ. Reduced motion và Data Saver tắt autoplay, vẫn cho phép bấm Play.
- `preload="none"`, chỉ gán nguồn khi cần phát. Ưu tiên HLS có sẵn với player-size cap, bắt đầu từ mức thấp và buffer ngắn; MP4 làm fallback, dùng lại `hls.js` đã có trong dự án. Đổi thẻ hủy engine, pause và gỡ nguồn của thẻ cũ; thẻ bên chỉ là poster. Autoplay bị trình duyệt chặn vẫn giữ nút Play; lỗi nguồn có thông báo và cho thử lại. Theo [MDN autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), phát tự động dùng muted; kết quả `play()` được xử lý để không hiển thị Pause khi chưa phát.
- Có 0/1/2 hoặc nhiều dự án: component rỗng không render, một dự án không có nút chuyển, số lượng còn lại wrap theo modulo. Pagination chấm cuộn ngang khi nhiều dự án, không làm tăng chiều cao stage.
- Tiêu đề/role dài được giới hạn số dòng. Mobile giữ thẻ giữa và một phần hai thẻ cạnh, nút không tràn ngang. Có reduced motion, reduced transparency/contrast và forced colors.

Kiểm tra trực tiếp: nút chuyển, chọn thẻ bên, vòng cuối → đầu, bàn phím, chấm chọn, link đúng dự án; desktop và mobile 390/320 px không tràn ngang. Kiểm tra thêm video thực sự phát bằng `currentTime`/`paused`, nút phát/dừng không điều hướng, âm thanh, chỉ một video được mount, dừng khi cuộn khỏi slider và modal hậu trường. Touch gesture, Safari/iOS, HLS dài và chế độ tiết kiệm dữ liệu cần nghiệm thu thêm trên thiết bị thực tế. TypeScript/lint/build được kiểm tra trước bàn giao.
