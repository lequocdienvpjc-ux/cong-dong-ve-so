# Sao lưu và khôi phục dữ liệu

Gói Free của Supabase **không có sao lưu tự động**. Vì vậy hệ thống có 3 lớp bảo vệ:

| Lớp | Cách làm | Tần suất |
|---|---|---|
| 1. Sao lưu dữ liệu | Quản trị → Cấu hình hệ thống → **⬇️ Tải bản sao lưu** → lưu tệp JSON vào `database\backup\` | Mỗi tuần (hoặc trước mỗi thay đổi lớn) |
| 2. Cấu trúc database | Tệp `database\schema\20261110000001_init.sql` (và trên GitHub) | Tự động theo mã nguồn |
| 3. Giữ database không bị tạm dừng | Workflow "Giữ database hoạt động" chạy mỗi ngày trên GitHub | Tự động |

## Khôi phục khi mất dữ liệu / chuyển máy chủ mới
1. Tạo dự án Supabase mới (hoặc dùng dự án cũ đã trống).
2. Supabase → SQL Editor → dán toàn bộ nội dung `database\schema\20261110000001_init.sql` → Run.
3. Chạy thêm: `update public.app_config set owner_email = 'dienlq779@gmail.com' where id = 1;`
4. Khôi phục dữ liệu: làm theo chú thích trong `deployment\restore_from_backup.mjs` (cần secret key của dự án mới – chỉ anh tự nhập trên máy mình).
5. Nếu đổi dự án: sửa `PUBLIC_SUPABASE_URL` và `PUBLIC_SUPABASE_KEY` trong `source_code\frontend\src\config.public.js`, đẩy lên GitHub để build lại web và APK.

## Khi nâng lên gói Pro (25 USD/tháng)
Supabase tự sao lưu hằng ngày, giữ 7 ngày; không bị tạm dừng. Không cần đổi mã nguồn.
