import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { ROLES, NEED_STATUS, MAP_KINDS, normalizePhone } from '@shared/constants.js';
import { Avatar, Msg, ReportButton, Field, SpeakButton } from '../components/ui.jsx';

export default function Member() {
  const { id } = useParams();
  const { user } = useAuth();
  const [p, setP] = useState(undefined);
  const [places, setPlaces] = useState([]);
  const [conn, setConn] = useState(null);
  const [phone, setPhone] = useState(null);
  const [msg, setMsg] = useState('');
  const [state, setState] = useState({});

  const load = async () => {
    const { data } = await supabase.from('public_profiles').select('*').eq('id', id).maybeSingle();
    setP(data);
    const { data: pl } = await supabase.from('places').select('*').eq('owner_id', id).eq('status', 'visible');
    setPlaces(pl || []);
    if (user && user.id !== id) {
      const { data: c } = await supabase.from('connections').select('*')
        .or(`and(from_id.eq.${user.id},to_id.eq.${id}),and(from_id.eq.${id},to_id.eq.${user.id})`).maybeSingle();
      setConn(c);
      const { data: ph } = await supabase.rpc('contact_of', { p_user: id });
      setPhone(ph);
    }
  };
  useEffect(() => { load(); }, [id, user]);

  if (p === undefined) return <p className="muted">Đang tải…</p>;
  if (!p) return <div className="error">Không tìm thấy thành viên (có thể đã bị khóa hoặc chưa hoàn tất hồ sơ).</div>;

  const callNum = normalizePhone(phone || p.phone || '');
  const sendConn = async () => {
    const { error } = await supabase.from('connections').insert({ from_id: user.id, to_id: id, message: msg || null });
    setState(error ? { error } : { ok: 'Đã gửi yêu cầu kết nối.' });
    load();
  };
  const summary = `${p.display_name}. ${(p.roles || []).map((r) => ROLES[r]).join(', ')}. ${p.ward || ''} ${p.province || ''}. ${p.bio || ''}`;

  return (
    <div>
      <div className="card list-item">
        <Avatar url={p.avatar_url} kind={p.need_status !== 'none' ? p.need_status : undefined} />
        <div className="grow">
          <h1 style={{ margin: 0 }}>{p.display_name}</h1>
          <div className="small muted">{[p.ward, p.province].filter(Boolean).join(', ') || 'Chưa ghi khu vực'}</div>
        </div>
      </div>

      <div className="card">
        <div>{(p.roles || []).map((r) => <span key={r} className="tag">{ROLES[r]}</span>)}
          {p.need_status !== 'none' && <span className={'tag ' + (p.need_status === 'can_ho_tro' ? 'red' : 'green')}>{NEED_STATUS[p.need_status]}</span>}
          {p.active_status === 'away' && <span className="tag gray">Tạm vắng</span>}
        </div>
        {p.area_note && <p><b>Khu vực hoạt động:</b> {p.area_note}</p>}
        {p.bio && <p className="post-body">{p.bio}</p>}
        <SpeakButton text={summary} />
      </div>

      <div className="card stack">
        {callNum ? <a className="btn block call" href={`tel:${callNum}`}>📞 Gọi {callNum}</a>
          : <p className="muted" style={{ margin: 0 }}>Thành viên chưa bật hiển thị số điện thoại. Bạn có thể gửi yêu cầu kết nối kèm lời nhắn để làm quen.</p>}
        {!user && <Link className="btn block secondary" to="/dang-nhap">Đăng nhập để kết nối</Link>}
        {user && user.id !== id && !conn && (
          <>
            <Field label="Lời nhắn (không bắt buộc)"><input type="text" value={msg} maxLength={300} onChange={(e) => setMsg(e.target.value)} placeholder="Ví dụ: Tôi bán vé gần chợ, muốn làm quen" /></Field>
            <button className="btn block" onClick={sendConn}>🤝 Gửi yêu cầu kết nối</button>
          </>
        )}
        {conn && <p style={{ margin: 0 }}>Kết nối: <b>{conn.status === 'accepted' ? 'Đã kết nối ✅' : conn.status === 'pending' ? 'Đang chờ đồng ý' : 'Đã từ chối'}</b></p>}
        <Msg {...state} />
      </div>

      {places.length > 0 && <h2>Điểm của thành viên</h2>}
      {places.map((pl) => (
        <div className="card" key={pl.id}>
          <b>{MAP_KINDS[pl.kind]?.icon} {pl.name}</b> <span className="tag">{MAP_KINDS[pl.kind]?.label}</span>
          {pl.address && <div>{pl.address}{pl.province ? `, ${pl.province}` : ''}</div>}
          {pl.open_hours && <div className="small muted">Giờ mở cửa: {pl.open_hours}</div>}
          {pl.note && <div className="small">{pl.note}</div>}
          <div className="row" style={{ marginTop: 8 }}>
            {pl.phone && <a className="btn sm call" href={`tel:${normalizePhone(pl.phone)}`}>📞 Gọi</a>}
            {pl.lat && <a className="btn sm secondary" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${pl.lat},${pl.lng}`}>🗺️ Xem bản đồ</a>}
          </div>
          <div style={{ marginTop: 8 }}><ReportButton type="place" id={pl.id} /></div>
        </div>
      ))}
      <div style={{ marginTop: 12 }}><ReportButton type="profile" id={id} /></div>
      <p className="footer-note">Thông tin do thành viên tự khai, ứng dụng không xác nhận tư cách đại lý.</p>
    </div>
  );
}
