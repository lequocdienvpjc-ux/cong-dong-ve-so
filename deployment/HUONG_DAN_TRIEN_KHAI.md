# Hướng dẫn triển khai (dành cho kỹ thuật)

## Kiến trúc
```
Android APK (Capacitor) ─┐
iPhone PWA (Safari)     ─┼─► Ứng dụng React/Vite (1 mã nguồn) ─► Supabase (PostgreSQL + Auth + Storage, RLS)
Web quản trị (#/admin)  ─┘        ▲ GitHub Pages                    ▲ máy chủ Asia-Pacific
                                   └ GitHub Actions: kiểm thử → build web → build APK → Releases
```

## Thư mục
| Đường dẫn | Nội dung |
|---|---|
| `source_code/frontend` | Ứng dụng + trang quản trị (`src/admin`) |
| `source_code/backend/supabase/migrations` | Lược đồ database, RLS, hàm, trigger |
| `source_code/backend/tests` | Kiểm thử bảo mật database (chạy trong CI) |
| `source_code/shared` | Danh mục dùng chung (vai trò, 34 tỉnh, từ khóa cấm) |
| `.github/workflows` | `ci.yml`, `deploy-web.yml`, `android.yml`, `keepalive.yml` |

## Chạy trên máy (tùy chọn)
```
cd source_code/frontend
npm ci
npm run dev
```

## Cấu hình
- Backend công khai: `source_code/frontend/src/config.public.js` (URL + publishable key – được thiết kế để công khai).
- **Không bao giờ** đưa secret key / service_role key / mật khẩu database vào mã nguồn.
- Supabase → Authentication → URL Configuration: Site URL và Redirect URL = địa chỉ GitHub Pages.

## GitHub Secrets (Settings → Secrets and variables → Actions)
| Secret | Bắt buộc | Mục đích |
|---|---|---|
| `ANDROID_KEYSTORE_B64` | Nên có | Khóa ký APK dạng base64. Có khóa cố định thì bản cập nhật mới cài đè được bản cũ |
| `ANDROID_KEYSTORE_PASSWORD` | Đi kèm | Mật khẩu khóa ký |

Tệp khóa ký và mật khẩu được lưu **trên máy anh** ở `deployment\khoa_ky_android\` (không đưa lên GitHub). Hãy giữ bản sao an toàn: mất khóa thì không phát hành bản cập nhật cài đè được.

## Email xác minh (SMTP)
Email mặc định của Supabase chỉ gửi rất ít thư/giờ và chỉ tới thành viên dự án. Khi mở cho nhiều người:
Supabase → Authentication → Emails → SMTP Settings → bật Custom SMTP, dùng một trong các cách:
- Gmail: host `smtp.gmail.com`, port `465`, user = địa chỉ Gmail, password = **mật khẩu ứng dụng** (Google Account → Bảo mật → Xác minh 2 bước → Mật khẩu ứng dụng). Giới hạn khoảng 500 thư/ngày.
- Brevo / Resend: dùng thông số SMTP của dịch vụ (có gói miễn phí).
Sau đó Authentication → Rate Limits: tăng số email/giờ phù hợp.

## Nâng cấp database
Thêm tệp migration mới vào `source_code/backend/supabase/migrations/` (tên tăng dần), chạy trong Supabase SQL Editor, đồng thời CI sẽ kiểm thử lại.
