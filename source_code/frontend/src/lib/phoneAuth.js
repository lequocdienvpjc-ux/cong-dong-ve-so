// Đăng ký / đăng nhập bằng số điện thoại + mã OTP qua Supabase Auth.
// Mã OTP do Supabase tạo và gửi qua nhà cung cấp SMS đã cấu hình trong Supabase
// (Authentication → Sign In / Providers → Phone). Ứng dụng KHÔNG tự tạo mã, không lưu mã,
// không ghi mã vào nhật ký. Việc kiểm tra mã, hết hạn và giới hạn gửi do Supabase thực hiện.
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase.js';
import { toE164Vn } from '@shared/constants.js';

let cached = null;

// Hỏi máy chủ xác thực xem đăng nhập bằng điện thoại đã được bật chưa.
// Trả về true / false; lỗi mạng hoặc chưa cấu hình → false.
export async function phoneAuthEnabled() {
  if (cached !== null) return cached;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return (cached = false);
  try {
    const r = await fetch(SUPABASE_URL.replace(/\/$/, '') + '/auth/v1/settings', { headers: { apikey: SUPABASE_ANON_KEY } });
    if (!r.ok) return false;
    const s = await r.json();
    cached = Boolean(s?.external?.phone) && !s?.disable_signup;
    return cached;
  } catch {
    return false;
  }
}

// Gửi mã OTP. createUser = true khi đăng ký mới, false khi đăng nhập (không tạo tài khoản ngoài ý muốn).
export async function sendPhoneOtp(phone, { createUser, data } = {}) {
  const e164 = toE164Vn(phone);
  if (!e164) return { error: { message: 'Số điện thoại chưa đúng (ví dụ: 0912345678).' } };
  const { error } = await supabase.auth.signInWithOtp({
    phone: e164,
    options: { shouldCreateUser: Boolean(createUser), ...(createUser && data ? { data } : {}), channel: 'sms' },
  });
  return { error, e164 };
}

// Xác minh mã OTP người dùng nhập. Thành công → Supabase tạo phiên đăng nhập.
export async function verifyPhoneOtp(e164, token) {
  const code = String(token || '').replace(/\D/g, '');
  if (code.length < 6) return { error: { message: 'Mã xác minh gồm 6 chữ số.' } };
  return supabase.auth.verifyOtp({ phone: e164, token: code, type: 'sms' });
}

// Gắn số điện thoại vào tài khoản đang đăng nhập (tránh tạo 2 tài khoản cho 1 người).
export async function startLinkPhone(phone) {
  const e164 = toE164Vn(phone);
  if (!e164) return { error: { message: 'Số điện thoại chưa đúng (ví dụ: 0912345678).' } };
  const { error } = await supabase.auth.updateUser({ phone: e164 });
  return { error, e164 };
}

export async function confirmLinkPhone(e164, token) {
  const code = String(token || '').replace(/\D/g, '');
  if (code.length < 6) return { error: { message: 'Mã xác minh gồm 6 chữ số.' } };
  return supabase.auth.verifyOtp({ phone: e164, token: code, type: 'phone_change' });
}
