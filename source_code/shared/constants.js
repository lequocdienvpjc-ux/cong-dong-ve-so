// Danh mục dùng chung cho ứng dụng và trang quản trị

export const ROLES = {
  dai_ly_lon: 'Đại lý lớn',
  dai_ly_cap_duoi: 'Đại lý cấp dưới',
  ban_dao: 'Người bán vé số dạo',
  ban_co_dinh: 'Người bán cố định',
  nguoi_mua: 'Người mua vé số',
  ho_tro: 'Người muốn hỗ trợ cộng đồng',
};

export const NEED_STATUS = {
  none: 'Bình thường',
  can_ho_tro: 'Đang cần hỗ trợ',
  muon_ho_tro: 'Sẵn sàng hỗ trợ người khác',
};

export const MAP_KINDS = {
  dai_ly: { label: 'Đại lý', color: '#1d4ed8', icon: '🏪' },
  diem_ban: { label: 'Điểm bán', color: '#0f766e', icon: '📍' },
  ban_dao: { label: 'Người bán dạo', color: '#b45309', icon: '🚶' },
  ban_co_dinh: { label: 'Người bán cố định', color: '#7c3aed', icon: '🪑' },
  can_ho_tro: { label: 'Cần hỗ trợ', color: '#dc2626', icon: '🆘' },
  muon_ho_tro: { label: 'Muốn hỗ trợ', color: '#16a34a', icon: '🤝' },
  thanh_vien: { label: 'Thành viên', color: '#475569', icon: '👤' },
};

export const POST_KINDS = {
  can_giup: 'Cần giúp đỡ',
  muon_giup: 'Muốn giúp đỡ',
  kinh_nghiem: 'Chia sẻ kinh nghiệm',
  thong_tin: 'Thông tin hữu ích',
};

export const REPORT_REASONS = {
  lua_dao: 'Lừa đảo',
  mua_ban_ve: 'Rao mua bán / giao vé',
  du_doan_so: 'Dự đoán kết quả, soi cầu',
  xuc_pham: 'Xúc phạm, quấy rối',
  thong_tin_sai: 'Thông tin sai',
  khac: 'Lý do khác',
};

export const ADMIN_ROLES = {
  member: 'Thành viên',
  moderator: 'Kiểm duyệt viên',
  admin: 'Quản trị viên',
  super_admin: 'SUPER ADMIN',
};

// 34 tỉnh, thành phố sau sắp xếp đơn vị hành chính (hiệu lực 01/7/2025)
export const PROVINCES = [
  'An Giang', 'Bắc Ninh', 'Cà Mau', 'Cao Bằng', 'Cần Thơ', 'Đà Nẵng', 'Đắk Lắk', 'Điện Biên',
  'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Nội', 'Hà Tĩnh', 'Hải Phòng', 'Huế', 'Hưng Yên',
  'Khánh Hòa', 'Lai Châu', 'Lạng Sơn', 'Lào Cai', 'Lâm Đồng', 'Nghệ An', 'Ninh Bình', 'Phú Thọ',
  'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sơn La', 'Tây Ninh', 'Thái Nguyên', 'Thanh Hóa',
  'TP. Hồ Chí Minh', 'Tuyên Quang', 'Vĩnh Long',
];

// Kiểm tra nội dung cấm phía giao diện (server vẫn kiểm tra lại)
export const BANNED_HINTS = ['soi cầu', 'soi cau', 'chốt số', 'chot so', 'lô đề', 'lo de', 'đánh đề',
  'bao lô', 'mua hộ vé', 'bán vé online', 'giao vé tận nhà'];

export function findBanned(text = '') {
  const t = text.toLowerCase();
  return BANNED_HINTS.find((w) => t.includes(w)) || null;
}

export function normalizePhone(p = '') {
  const d = String(p).replace(/[^\d+]/g, '');
  if (d.startsWith('+84')) return '0' + d.slice(3);
  if (d.startsWith('84') && d.length === 11) return '0' + d.slice(2);
  return d;
}

export function isValidVnPhone(p = '') {
  return /^0(3|5|7|8|9)\d{8}$/.test(normalizePhone(p));
}

export function formatKm(km) {
  if (km == null) return '';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
