# Photo grid dạng accordion

Tham khảo chuyển động trong video người dùng cung cấp: các ảnh là dải hẹp bo tròn, một ảnh được mở rộng khi click, icon và nhãn ở đáy. Phần code hiển thị trong video chỉ được xem như nội dung tham khảo; không được thực thi.

`PhotoAccordion` dùng chung cho trang chủ, danh sách bộ ảnh và dự án hỗn hợp. Mỗi dải tương ứng một dự án thật, sử dụng cover/poster của dự án đó. Trang chủ lấy tối đa 6 dự án ảnh/hỗn hợp theo thứ tự nổi bật; trang danh sách giữ bộ lọc/phân trang. Không nhân bản dự án để lấp đầy gallery.

- Một panel mở tại một thời điểm. Click panel khác đổi trạng thái bằng flex transition 700ms, hiện tiêu đề, vai trò, số ảnh/media và CTA riêng mở trang chi tiết.
- Ảnh mở rộng dùng contain để thấy trọn ảnh; vùng còn lại dùng thumbnail blur cùng tác phẩm. Các dải đóng dùng cover theo focal point. Ảnh dùng srcSet/pre-encoded derivatives và lazy loading hiện có.
- Hỗ trợ phím trái/phải, Home/End, Enter/Space của button native. `aria-expanded`, `aria-controls`, trạng thái thông báo và liên kết của panel đóng được ẩn. Giữ các tổ hợp phím trình duyệt.
- Mobile giữ cùng cơ chế, panel mở có chiều rộng phù hợp, gallery cuộn ngang bằng thao tác native. ResizeObserver chỉ giữ panel mở trong vùng gallery, không tự cuộn cả trang.
- Reduced motion bỏ transition; có tăng tương phản, giảm trong suốt và forced colors. Không thêm thư viện hoặc tải video trong phần preview.
- Gallery một dự án vẫn hiển thị ảnh mở; không có dự án thì không render. Nhiều dự án thu hẹp theo chiều rộng desktop và cuộn nội bộ khi cần.

Nội dung demo hiện có 2 bộ ảnh nên chỉ có 2 panel. Khi thêm/xuất bản dự án, gallery tự tăng số dải theo dữ liệu thật. Nút xem bộ ảnh giữ nguyên trang chi tiết với slide ảnh và hậu trường hỗn hợp.
