import { NavLink, Navigate, Route, Routes, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { ADMIN_ROLES } from '@shared/constants.js';
import Dashboard from './Dashboard.jsx';
import Members from './Members.jsx';
import Places from './Places.jsx';
import Posts from './Posts.jsx';
import Reports from './Reports.jsx';
import Settings from './Settings.jsx';
import Audit from './Audit.jsx';
import Auth from '../pages/Auth.jsx';

const logo = import.meta.env.BASE_URL + 'logo.png';

const MENU = [
  ['tong-quan', '📊 Thống kê'],
  ['thanh-vien', '👥 Tất cả thành viên'],
  ['thanh-vien?vt=dai_ly', '🏪 Đại lý'],
  ['thanh-vien?vt=ban_dao', '🚶 Người bán dạo'],
  ['thanh-vien?vt=ban_co_dinh', '🪑 Người bán cố định'],
  ['thanh-vien?vt=nguoi_mua', '🛒 Người mua'],
  ['diem-ban', '📍 Điểm bán / đại lý'],
  ['bai-dang', '📝 Bài đăng'],
  ['yeu-cau-ho-tro', '🆘 Yêu cầu hỗ trợ'],
  ['bao-cao', '⚠️ Báo cáo vi phạm'],
  ['cau-hinh', '⚙️ Cấu hình hệ thống'],
  ['nhat-ky', '🧾 Nhật ký quản trị'],
];

export default function Admin() {
  const { user, profile, loading, isStaff, signOut } = useAuth();
  if (loading) return <p className="center">Đang tải…</p>;
  if (!user) return (
    <main className="page"><h1>Đăng nhập trang quản trị</h1><Auth /></main>
  );
  if (!isStaff) return (
    <main className="page"><div className="error">Tài khoản {user.email} không có quyền quản trị.</div>
      <p><Link to="/">Về ứng dụng</Link> · <button className="btn sm ghost" onClick={signOut}>Đăng xuất</button></p></main>
  );
  return (
    <div className="admin">
      <aside>
        <div className="brand"><img src={logo} alt="" /><div>Quản trị<br /><small style={{ color: '#fde68a' }}>Cộng Đồng Vé Số</small></div></div>
        {MENU.map(([to, label]) => <NavLink key={to} to={'/admin/' + to} end={!to.includes('?')}>{label}</NavLink>)}
        <hr style={{ borderColor: 'rgba(255,255,255,.2)' }} />
        <div className="small" style={{ color: '#cbd5e1' }}>{profile.display_name}<br />{ADMIN_ROLES[profile.admin_role]}</div>
        <Link to="/" style={{ marginTop: 8 }}>← Về ứng dụng</Link>
        <a href="#" onClick={(e) => { e.preventDefault(); signOut(); }}>Đăng xuất</a>
      </aside>
      <div className="content">
        <Routes>
          <Route index element={<Navigate to="tong-quan" replace />} />
          <Route path="tong-quan" element={<Dashboard />} />
          <Route path="thanh-vien" element={<Members />} />
          <Route path="diem-ban" element={<Places />} />
          <Route path="bai-dang" element={<Posts />} />
          <Route path="yeu-cau-ho-tro" element={<Posts helpOnly />} />
          <Route path="bao-cao" element={<Reports />} />
          <Route path="cau-hinh" element={<Settings />} />
          <Route path="nhat-ky" element={<Audit />} />
        </Routes>
      </div>
    </div>
  );
}

export function fmtDate(iso) { return iso ? new Date(iso).toLocaleString('vi-VN') : ''; }
