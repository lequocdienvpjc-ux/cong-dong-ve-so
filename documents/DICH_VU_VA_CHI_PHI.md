# Danh sách dịch vụ đang sử dụng và chi phí

| Dịch vụ | Dùng cho | Tài khoản | Gói | Chi phí hiện tại | Giới hạn cần biết |
|---|---|---|---|---|---|
| GitHub | Mã nguồn, build APK (Actions), phát hành APK (Releases), web (Pages) | lequocdienvpjc-ux | Free, repo công khai | 0 đ | Repo công khai: ai cũng xem được mã nguồn (không chứa bí mật) |
| GitHub Pages | Ứng dụng web/PWA + trang quản trị | như trên | Free | 0 đ | Băng thông mềm 100 GB/tháng |
| Supabase | Database PostgreSQL, đăng nhập, lưu ảnh đại diện | lequocdienvpjc@gmail.com's Org (đăng nhập qua GitHub) | Free | 0 đ | 500 MB database, 1 GB file, 5 GB băng thông, 50.000 người dùng/tháng; tạm dừng sau 7 ngày không truy cập (đã có workflow giữ hoạt động); không sao lưu tự động |
| OpenStreetMap | Bản đồ | không cần | Free | 0 đ | Không dành cho lưu lượng rất lớn; khi đông người dùng cần chuyển nhà cung cấp bản đồ |
| Gửi email xác minh | Email đăng ký, quên mật khẩu | xem mục SMTP trong `deployment\HUONG_DAN_TRIEN_KHAI.md` | — | 0 đ | Email mặc định của Supabase chỉ gửi rất ít thư/giờ và chỉ tới thành viên dự án; cần SMTP riêng khi mở rộng |

## Chi phí có thể phát sinh (chỉ khi anh đồng ý)
| Khi nào | Khoản | Ước tính |
|---|---|---|
| Có nhiều người dùng thật, cần không gián đoạn + sao lưu tự động | Supabase Pro | 25 USD/tháng |
| Muốn tên miền riêng (vd. congdongveso.vn) | Tên miền | vài trăm nghìn đồng/năm |
| Bắt buộc xác thực số điện thoại bằng OTP | Dịch vụ SMS | tính theo tin nhắn |
| Muốn đưa lên Google Play | Tài khoản nhà phát triển Google Play | 25 USD một lần |

## Nếu dịch vụ ngừng miễn phí
Dữ liệu là PostgreSQL chuẩn: chuyển sang Supabase Pro, Neon, hoặc tự dựng Supabase trên VPS. Web có thể chuyển sang Cloudflare Pages / Netlify. Không phải viết lại giao diện.
