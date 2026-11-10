// KHÔI PHỤC DỮ LIỆU từ tệp sao lưu JSON (tải ở Quản trị > Cấu hình > Sao lưu dữ liệu)
// Cách chạy (trên máy tính có Node.js 20+):
//   1. npm install @supabase/supabase-js
//   2. Đặt biến môi trường (KHÔNG ghi vào tệp, KHÔNG gửi qua chat):
//        set SUPABASE_URL=https://<ma-du-an>.supabase.co
//        set SUPABASE_SERVICE_ROLE_KEY=<secret key lấy ở Supabase > Settings > API Keys>
//   3. node restore_from_backup.mjs duong-dan\cong-dong-ve-so-backup-YYYY-MM-DD.json
// Lưu ý: tài khoản đăng nhập (auth.users) không nằm trong tệp sao lưu; thành viên cần đăng ký lại
// hoặc khôi phục auth bằng bản sao lưu của Supabase (gói Pro). Script chỉ ghi các dòng có id tồn tại trong auth.users.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || !process.argv[2]) { console.error('Thiếu SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / đường dẫn tệp'); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });
const data = JSON.parse(readFileSync(process.argv[2], 'utf8')).tables;
const ORDER = ['app_config', 'banned_words', 'profiles', 'places', 'posts', 'comments', 'connections', 'reports', 'admin_audit'];
for (const t of ORDER) {
  const rows = data[t] || [];
  if (!rows.length) continue;
  const clean = t === 'admin_audit' ? rows.map(({ id, ...r }) => r) : rows;
  for (let i = 0; i < clean.length; i += 500) {
    const { error } = await db.from(t).upsert(clean.slice(i, i + 500), { ignoreDuplicates: false });
    if (error) console.error(`Bảng ${t}: ${error.message}`);
  }
  console.log(`Đã khôi phục ${t}: ${rows.length} dòng`);
}
