import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase, errText } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { ROLES, ADMIN_ROLES, NEED_STATUS, PROVINCES } from '@shared/constants.js';
import { fmtDate } from './Admin.jsx';

const TITLES = { dai_ly: 'Đại lý', ban_dao: 'Người bán vé số dạo', ban_co_dinh: 'Người bán cố định', nguoi_mua: 'Người mua' };

export default function Members() {
  const [sp] = useSearchParams();
  const vt = sp.get('vt') || '';
  const { isAdmin, isSuper, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [province, setProvince] = useState('');
  const [status, setStatus] = useState('');
  const [msg, setMsg] = useState('');
  const [page, setPage] = useState(0);
  const PAGE = 50;

  const load = async () => {
    let r = supabase.from('profiles').select('*').order('created_at', { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
    if (vt === 'dai_ly') r = r.overlaps('roles', ['dai_ly_lon', 'dai_ly_cap_duoi']);
    else if (vt) r = r.contains('roles', [vt]);
    if (q.trim()) { const t = q.trim().replace(/[%,()]/g, ' '); r = r.or(`display_name.ilike.%${t}%,email.ilike.%${t}%,phone.ilike.%${t}%`); }
    if (province) r = r.eq('province', province);
    if (status === 'locked') r = r.eq('is_locked', true);
    if (status === 'staff') r = r.neq('admin_role', 'member');
    if (status === 'need') r = r.eq('need_status', 'can_ho_tro');
    const { data, error } = await r;
    if (error) setMsg(errText(error)); else setRows(data || []);
  };
  useEffect(() => { load(); }, [vt, province, status, page]);

  const lock = async (p, locked) => {
    const reason = locked ? prompt('Lý do khóa tài khoản:') : null;
    if (locked && reason === null) return;
    const { error } = await supabase.rpc('set_user_lock', { p_user: p.id, p_locked: locked, p_reason: reason });
    setMsg(error ? errText(error) : (locked ? 'Đã khóa ' : 'Đã mở khóa ') + p.display_name); load();
  };
  const setRole = async (p, role) => {
    if (!confirm(`Đổi quyền của ${p.display_name} thành "${ADMIN_ROLES[role]}"?`)) return;
    const { error } = await supabase.rpc('set_admin_role', { p_user: p.id, p_role: role });
    setMsg(error ? errText(error) : 'Đã phân quyền.'); load();
  };

  return (
    <div>
      <h1>{TITLES[vt] || 'Quản lý thành viên'}</h1>
      <form className="filters" onSubmit={(e) => { e.preventDefault(); setPage(0); load(); }}>
        <input type="search" placeholder="Tên, email, SĐT…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={province} onChange={(e) => setProvince(e.target.value)}><option value="">Mọi tỉnh</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Mọi trạng thái</option><option value="locked">Đang khóa</option><option value="staff">Có quyền quản trị</option><option value="need">Đang cần hỗ trợ</option>
        </select>
        <button className="btn">Lọc</button>
      </form>
      {msg && <div className="notice" style={{ marginBottom: 8 }}>{msg}</div>}
      <table className="tbl">
        <thead><tr><th>Thành viên</th><th>Liên hệ</th><th>Vai trò</th><th>Khu vực</th><th>Quyền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>{rows.map((p) => (
          <tr key={p.id}>
            <td><b>{p.display_name}</b><div className="small muted">Tham gia {fmtDate(p.created_at)}</div><a href={`#/thanh-vien/${p.id}`} target="_blank" rel="noreferrer" className="small">Xem hồ sơ</a></td>
            <td className="small">{p.email}<br />{p.phone}{p.phone && !p.show_phone && ' (ẩn)'}</td>
            <td className="small">{(p.roles || []).map((r) => <div key={r}>{ROLES[r]}</div>)}{p.need_status !== 'none' && <span className="tag red">{NEED_STATUS[p.need_status]}</span>}</td>
            <td className="small">{[p.ward, p.province].filter(Boolean).join(', ')}</td>
            <td className="small">
              {isSuper && p.admin_role !== 'super_admin' && p.id !== user.id ? (
                <select value={p.admin_role} onChange={(e) => setRole(p, e.target.value)}>
                  {['member', 'moderator', 'admin'].map((r) => <option key={r} value={r}>{ADMIN_ROLES[r]}</option>)}
                </select>
              ) : ADMIN_ROLES[p.admin_role]}
            </td>
            <td className="small">{p.is_locked ? <span className="tag red">Đã khóa</span> : <span className="tag green">Hoạt động</span>}
              {p.lock_reason && <div>{p.lock_reason}</div>}{!p.adult_confirmed && <div className="tag gray">Chưa xác nhận 18+</div>}</td>
            <td>{isAdmin && p.admin_role !== 'super_admin' && p.id !== user.id && (p.is_locked
              ? <button className="btn green" onClick={() => lock(p, false)}>Mở khóa</button>
              : <button className="btn danger" onClick={() => lock(p, true)}>Khóa</button>)}</td>
          </tr>
        ))}</tbody>
      </table>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>← Trước</button>
        <span>Trang {page + 1}</span>
        <button className="btn secondary" disabled={rows.length < PAGE} onClick={() => setPage(page + 1)}>Sau →</button>
      </div>
    </div>
  );
}
