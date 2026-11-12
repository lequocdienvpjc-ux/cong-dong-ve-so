import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { getPosition } from '../lib/geo.js';
import { ROLES, NEED_STATUS, PROVINCES, ADMIN_ROLES, isValidVnPhone, normalizePhone } from '@shared/constants.js';
import { Avatar, Field, Msg, VoiceInput } from '../components/ui.jsx';
import LinkPhone from '../components/LinkPhone.jsx';

const EDITABLE = ['display_name', 'phone', 'show_phone', 'province', 'ward', 'area_note', 'bio', 'roles', 'need_status',
  'active_status', 'lat', 'lng', 'show_location', 'adult_confirmed', 'notify_connections', 'notify_replies', 'notify_support', 'avatar_url'];

export default function Me() {
  const { user, profile, refresh, signOut, isStaff } = useAuth();
  const [f, setF] = useState(null);
  const [state, setState] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (profile) setF(Object.fromEntries(EDITABLE.map((k) => [k, profile[k]]))); }, [profile]);
  if (!f) return <p className="muted">Đang tải…</p>;

  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const toggleRole = (r) => set('roles', f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r]);

  const save = async (e) => {
    e?.preventDefault();
    if (f.phone && !isValidVnPhone(f.phone)) return setState({ error: { message: 'Số điện thoại chưa đúng (ví dụ: 0912345678).' } });
    setBusy(true);
    const payload = { ...f, phone: f.phone ? normalizePhone(f.phone) : null };
    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
    setBusy(false);
    setState(error ? { error } : { ok: 'Đã lưu hồ sơ.' });
    if (!error) refresh();
  };

  const useGps = async () => {
    setState({ ok: 'Đang lấy vị trí…' });
    const p = await getPosition();
    if (!p) return setState({ error: { message: 'Không lấy được vị trí. Hãy bật GPS và cho phép ứng dụng dùng vị trí.' } });
    setF((o) => ({ ...o, lat: p.lat, lng: p.lng, show_location: true }));
    setState({ ok: 'Đã lấy vị trí. Bấm "Lưu hồ sơ" để cập nhật.' });
  };

  const upload = async (file) => {
    if (!file) return;
    if (file.size > 1024 * 1024) return setState({ error: { message: 'Ảnh tối đa 1 MB.' } });
    const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (error) return setState({ error });
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    set('avatar_url', data.publicUrl);
    setState({ ok: 'Đã tải ảnh. Bấm "Lưu hồ sơ".' });
  };

  const deleteAccount = async () => {
    if (!confirm('Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu của bạn? Không thể khôi phục.')) return;
    // Xóa ảnh đại diện đã tải lên trước (bảng dữ liệu được xóa theo tài khoản ở phía server)
    const { data: files } = await supabase.storage.from('avatars').list(user.id, { limit: 100 });
    if (files?.length) await supabase.storage.from('avatars').remove(files.map((f) => `${user.id}/${f.name}`));
    const { error } = await supabase.rpc('delete_my_account');
    if (error) return setState({ error });
    await signOut();
  };

  return (
    <form onSubmit={save}>
      <div className="card list-item">
        <Avatar url={f.avatar_url} />
        <div className="grow">
          <b>{profile.display_name}</b><div className="small muted">{user.email || (user.phone ? '+' + user.phone : '')}</div>
          {profile.admin_role !== 'member' && <span className="tag">{ADMIN_ROLES[profile.admin_role]}</span>}
        </div>
      </div>
      {isStaff && <Link className="btn block green" to="/admin" style={{ margin: '10px 0' }}>🛠️ Mở trang quản trị</Link>}

      <div className="row" style={{ margin: '10px 0' }}>
        <Link className="btn secondary grow" to="/diem-cua-toi">📍 Điểm bán / đại lý của tôi</Link>
        <Link className="btn secondary grow" to="/ket-noi">👥 Kết nối</Link>
      </div>

      {!f.adult_confirmed && (
        <div className="notice"><label className="check"><input type="checkbox" checked={f.adult_confirmed} onChange={(e) => set('adult_confirmed', e.target.checked)} />
          Tôi xác nhận đã đủ 18 tuổi (bắt buộc để xuất hiện trong cộng đồng).</label></div>
      )}

      <h2>Hồ sơ</h2>
      <div className="card">
        <Field label="Ảnh đại diện"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files[0])} /></Field>
        <Field label="Tên hiển thị"><VoiceInput value={f.display_name} onChange={(v) => set('display_name', v)} maxLength={60} required /></Field>
        <Field label="Tôi là (chọn một hoặc nhiều)">
          <div className="chips">{Object.entries(ROLES).map(([k, v]) => (
            <button type="button" key={k} className={'chip' + (f.roles.includes(k) ? ' on' : '')} onClick={() => toggleRole(k)}>{v}</button>
          ))}</div>
        </Field>
        <Field label="Tình trạng">
          <div className="chips">{Object.entries(NEED_STATUS).map(([k, v]) => (
            <button type="button" key={k} className={'chip' + (f.need_status === k ? ' on' : '')} onClick={() => set('need_status', k)}>{v}</button>
          ))}</div>
        </Field>
        <Field label="Trạng thái hoạt động">
          <select value={f.active_status} onChange={(e) => set('active_status', e.target.value)}>
            <option value="active">Đang hoạt động</option><option value="busy">Bận</option><option value="away">Tạm vắng</option>
          </select>
        </Field>
        <Field label="Tỉnh/thành">
          <select value={f.province || ''} onChange={(e) => set('province', e.target.value)}>
            <option value="">-- Chọn --</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Phường/xã"><VoiceInput value={f.ward || ''} onChange={(v) => set('ward', v)} maxLength={80} /></Field>
        <Field label="Khu vực hoạt động" hint="Ví dụ: Quanh chợ Thủ Dầu Một, bến xe"><VoiceInput value={f.area_note || ''} onChange={(v) => set('area_note', v)} maxLength={150} /></Field>
        <Field label="Giới thiệu ngắn"><VoiceInput multiline value={f.bio || ''} onChange={(v) => set('bio', v)} maxLength={500} /></Field>
      </div>

      <h2>Liên hệ &amp; quyền riêng tư</h2>
      <div className="card">
        <Field label="Số điện thoại"><input type="tel" inputMode="tel" value={f.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="0912345678" /></Field>
        <label className="check"><input type="checkbox" checked={f.show_phone} onChange={(e) => set('show_phone', e.target.checked)} />
          Cho mọi người thấy số điện thoại của tôi (nếu không chọn, không ai thấy số của tôi).</label>
        <label className="check"><input type="checkbox" checked={f.show_location} onChange={(e) => set('show_location', e.target.checked)} />
          Hiện tôi trên bản đồ cộng đồng (vị trí làm tròn khoảng 100–500 m).</label>
        <button type="button" className="btn secondary block" onClick={useGps}>📍 Cập nhật vị trí hiện tại của tôi</button>
        {f.lat && <p className="small muted">Đã có vị trí. Bạn có thể tắt hiển thị bất cứ lúc nào.</p>}
      </div>

      <h2>Thông báo</h2>
      <div className="card">
        <label className="check"><input type="checkbox" checked={f.notify_connections} onChange={(e) => set('notify_connections', e.target.checked)} />Yêu cầu kết nối</label>
        <label className="check"><input type="checkbox" checked={f.notify_replies} onChange={(e) => set('notify_replies', e.target.checked)} />Có người phản hồi bài của tôi</label>
        <label className="check"><input type="checkbox" checked={f.notify_support} onChange={(e) => set('notify_support', e.target.checked)} />Có người cần hỗ trợ trong tỉnh của tôi</label>
      </div>

      <div style={{ position: 'sticky', bottom: 80, marginTop: 12 }}>
        <Msg {...state} />
        <button className="btn block" disabled={busy} style={{ marginTop: 8 }}>{busy ? 'Đang lưu…' : '💾 Lưu hồ sơ'}</button>
      </div>

      <h2>Tài khoản</h2>
      <div className="stack">
        <LinkPhone />
        {user.email && <Link className="btn secondary block" to="/doi-mat-khau">🔑 Đổi mật khẩu</Link>}
        <Link className="btn ghost block" to="/gioi-thieu">ℹ️ Giới thiệu &amp; Quy định</Link>
        <button type="button" className="btn ghost block" onClick={signOut}>Đăng xuất</button>
        <button type="button" className="btn ghost block" style={{ color: 'var(--red)' }} onClick={deleteAccount}>Xóa tài khoản của tôi</button>
      </div>
    </form>
  );
}
