// Cấu hình CÔNG KHAI của backend. Khóa "publishable" được Supabase thiết kế để nằm trong ứng dụng
// phía người dùng ("Publishable keys can be safely shared publicly"); dữ liệu được bảo vệ bằng RLS.
// KHÔNG đặt secret key / service_role key / mật khẩu database vào đây.
export const PUBLIC_SUPABASE_URL = 'https://syeviwfpvodxfzuumvdd.supabase.co';
export const PUBLIC_SUPABASE_KEY = 'sb_publishable_dregOj6WQhDjCZk5n-I7UQ_Rkt3GWQr';
export const PUBLIC_APP_URL = 'https://lequocdienvpjc-ux.github.io/cong-dong-ve-so/';

// V2 dùng OpenStreetMap. Google Maps để dành cho V3 (xem documents/GHI_CHU_NANG_CAP_V3.md) — GIỮ TRỐNG.
// Khóa này luôn hiện trong trình duyệt theo thiết kế của Google; bảo vệ bằng cách GIỚI HẠN khóa
// theo tên miền (HTTP referrer) và chỉ cho phép Maps JavaScript API, kèm hạn mức/ngày trong Google Cloud.
export const PUBLIC_GOOGLE_MAPS_KEY = '';
