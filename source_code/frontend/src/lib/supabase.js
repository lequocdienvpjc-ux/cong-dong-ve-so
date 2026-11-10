import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY, PUBLIC_APP_URL } from '../config.public.js';

// URL và khóa công khai (publishable/anon) của Supabase. Đây là khóa được thiết kế để
// nằm trong ứng dụng phía người dùng; dữ liệu được bảo vệ bằng Row Level Security.
// Giá trị được nạp lúc build từ GitHub Actions (biến VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || PUBLIC_SUPABASE_KEY;
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
export const PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL || PUBLIC_APP_URL;

export const configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = configured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
    })
  : null;

export function errText(e) {
  if (!e) return '';
  const m = e.message || String(e);
  if (m.includes('Invalid login credentials')) return 'Sai email hoặc mật khẩu.';
  if (m.includes('Email not confirmed')) return 'Email chưa được xác minh. Hãy mở thư xác minh trong hộp thư.';
  if (m.includes('User already registered')) return 'Email này đã đăng ký. Hãy đăng nhập hoặc dùng "Quên mật khẩu".';
  if (m.includes('Password should be')) return 'Mật khẩu cần ít nhất 6 ký tự.';
  if (m.includes('rate limit')) return 'Thao tác quá nhanh, vui lòng thử lại sau ít phút.';
  if (m.includes('row-level security') || m.includes('permission denied')) return 'Bạn không có quyền thực hiện thao tác này.';
  if (m.includes('Failed to fetch')) return 'Không có mạng. Vui lòng kiểm tra kết nối.';
  return m;
}

// Đường dẫn quay về ứng dụng sau khi bấm link trong email
export function redirectUrl(path = '') {
  const base = PUBLIC_URL.split('#')[0];
  return base + (path ? '#' + path : '');
}
