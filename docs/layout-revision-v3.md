# Layout V3 — Bộ ảnh dạng slide và hậu trường hỗn hợp

Phác thảo cập nhật ngày 24/11/2026. Giữ phong cách sáng tím và bố cục trang chủ V2.

## Trang chi tiết dùng chung

Desktop chia 50/50: vùng xem tác phẩm bên trái, nội dung bên phải. Dự án video dùng player 9:16; dự án bộ ảnh dùng slide ngang với nút trái/phải, thumbnail và số thứ tự. Bộ ảnh chứa cả ảnh ngang, dọc và vuông, giữ đúng tỉ lệ khi xem. Backdrop blur thay đổi theo ảnh đang chọn.

Ảnh không tự chuyển. Hỗ trợ nút trước/sau, chọn thumbnail, phím mũi tên khi focus trong vùng xem, và vuốt ngang. Trên mobile, vuốt ngang đổi ảnh; vuốt dọc vẫn cuộn xuống thông tin như trang chi tiết video. Chuyển ảnh không đưa người xem về đầu trang hoặc làm mất tab đang đọc.

## Hậu trường ở cả hai loại dự án

Tab Hậu trường có thumbnail ảnh và video với nhãn loại media rõ ràng. Bấm ảnh mở ảnh lớn; bấm video mở modal player có poster. Modal cho phép chuyển qua các media hậu trường, hiện tiêu đề, caption, liên kết ngữ cảnh dự án và số thứ tự.

Đóng bằng nút X, Escape hoặc bấm ngoài modal. Focus được giữ trong modal khi mở và trả về thumbnail khi đóng. Khi triển khai media thật: dừng video, ngắt nguồn nếu cần khi đổi media hoặc đóng modal; không tiếp tục phát âm thanh ngầm. Tệp lớn chỉ tải khi mở modal, chỉ tải trước tối đa một ảnh lân cận.

Trên mobile modal vừa chiều rộng thiết bị, ảnh/video giữ tỉ lệ, controls nằm trong vùng an toàn. Bản phác thảo dùng poster hình khối và thông báo vị trí player vì chưa có video thật; không mô phỏng một video đang phát.

## Dữ liệu cần biểu diễn khi triển khai

- Mỗi project có danh sách tác phẩm được sắp thứ tự, tách khỏi danh sách hậu trường.
- Một mục hậu trường chứa mediaId, loại ảnh/video, poster, caption, sortOrder và projectId.
- Có thể sử dụng ProjectMedia cùng trường placement `MAIN` / `BEHIND_THE_SCENES` thay vì tạo hệ lưu trữ thứ hai.
- Luồng Blob private/public và pipeline tối ưu ảnh/video vẫn theo kế hoạch đã lập.

## Kiểm tra bố cục

Mở Bộ ảnh → đổi slide bằng nút/thumbnail → chuyển Hậu trường → mở lần lượt ảnh và video → chuyển media trong modal → đóng bằng Escape. Thử cả màn rộng và khung điện thoại, gồm cuộn từ gallery xuống thông tin.
