# Hướng dẫn quản trị – Cộng Đồng Vé Số

Địa chỉ: xem `web_admin/WEB_ADMIN_LINK.txt`. Dùng trên máy tính, đăng nhập bằng tài khoản có quyền quản trị.

## 1. Tài khoản SUPER ADMIN đầu tiên
- Chỉ email **dienlq779@gmail.com**, **sau khi đã xác minh email**, mới được hệ thống tự cấp SUPER ADMIN (kiểm tra trong database, không phải ở giao diện).
- Cấp xong, cơ chế tự cấp bị **khóa vĩnh viễn**. Mọi người đăng ký sau là thành viên thường.
- Kiểm tra: Quản trị → Cấu hình hệ thống → dòng "Khởi tạo SUPER ADMIN: đã khóa".

## 2. Phân quyền
| Quyền | Được làm |
|---|---|
| SUPER ADMIN | Mọi việc + cấp/thu quyền Quản trị viên, Kiểm duyệt viên |
| Quản trị viên | Khóa/mở tài khoản, sửa cấu hình, gửi thông báo, sao lưu, xóa điểm/bài |
| Kiểm duyệt viên | Ẩn/gỡ bài và điểm bán, xử lý báo cáo, xem thống kê |
| Thành viên | Dùng ứng dụng |

Cấp quyền: **Thành viên** → cột "Quyền" → chọn vai trò (chỉ SUPER ADMIN thấy ô chọn). Không ai khóa hoặc hạ quyền được SUPER ADMIN.

## 3. Các mục trong trang quản trị
| Mục | Việc thường làm |
|---|---|
| Thống kê | Số thành viên theo vai trò, theo tỉnh, đăng ký 30 ngày, bài, kết nối, báo cáo chờ xử lý |
| Thành viên / Đại lý / Người bán dạo / Bán cố định / Người mua | Tìm theo tên–email–SĐT, lọc tỉnh, **Khóa / Mở khóa** (ghi lý do) |
| Điểm bán / đại lý | Ẩn, hiện, xóa điểm sai |
| Bài đăng | Ẩn, **Gỡ vi phạm**, hiện lại |
| Yêu cầu hỗ trợ | Theo dõi tin "cần giúp" chưa được giúp, đánh dấu đã giúp xong |
| Báo cáo vi phạm | Xem nội dung bị báo cáo → **Gỡ / ẩn** hoặc **Khóa tài khoản**, hoặc **Bỏ qua** |
| Cấu hình hệ thống | Thông báo đầu ứng dụng, phiên bản + link APK, từ khóa bị chặn, gửi thông báo toàn hệ thống, **sao lưu** |
| Nhật ký quản trị | Ai đã làm gì, lúc nào |

## 4. Khi phát hành bản Android mới
GitHub Actions tự build và đăng APK lên Releases sau mỗi lần cập nhật mã nguồn.
Vào **Cấu hình hệ thống** → sửa "Phiên bản Android mới nhất" (ví dụ `1.0.5`) → Lưu. Ứng dụng cũ sẽ hiện nút **Cập nhật**.

## 5. Nguyên tắc kiểm duyệt
Gỡ ngay: dự đoán kết quả, rao mua bán/mua hộ/giao vé, xin chuyển tiền, số tài khoản, xúc phạm.
Ứng dụng đã tự chặn các cụm từ trong danh sách "Từ khóa bị chặn"; thêm từ mới khi phát hiện cách lách.
