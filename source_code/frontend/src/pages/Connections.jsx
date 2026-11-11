import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { openConversation } from '../lib/messages.js';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { normalizePhone } from '@shared/constants.js';
import { Avatar, timeAgo } from '../components/ui.jsx';

export default function Connections() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const chat = async (other) => { try { nav('/tin-nhan/' + await openConversation(other)); } catch (e) { setErr(e.message); } };

  const load = async () => {
    const { data } = await supabase.from('connections').select('*').or(`from_id.eq.${user.id},to_id.eq.${user.id}`).order('created_at', { ascending: false });
    const ids = [...new Set((data || []).map((c) => (c.from_id === user.id ? c.to_id : c.from_id)))];
    const { data: ps } = ids.length ? await supabase.from('public_profiles').select('id, display_name, avatar_url, province').in('id', ids) : { data: [] };
    const m = Object.fromEntries((ps || []).map((p) => [p.id, p]));
    const withPhone = await Promise.all((data || []).map(async (c) => {
      const other = c.from_id === user.id ? c.to_id : c.from_id;
      let phone = null;
      if (c.status === 'accepted') phone = (await supabase.rpc('contact_of', { p_user: other })).data;
      return { ...c, other, person: m[other], phone };
    }));
    setRows(withPhone);
  };
  useEffect(() => { load(); }, []);

  const respond = async (id, status) => {
    await supabase.from('connections').update({ status, responded_at: new Date().toISOString() }).eq('id', id); load();
  };
  const remove = async (id) => { await supabase.from('connections').delete().eq('id', id); load(); };

  if (rows === null) return <p className="muted">Đang tải…</p>;
  const incoming = rows.filter((r) => r.status === 'pending' && r.to_id === user.id);
  const accepted = rows.filter((r) => r.status === 'accepted');
  const sent = rows.filter((r) => r.status === 'pending' && r.from_id === user.id);

  const Person = ({ r, children }) => (
    <div className="card list-item">
      <Avatar url={r.person?.avatar_url} />
      <div className="grow">
        <Link className="name" to={`/thanh-vien/${r.other}`}>{r.person?.display_name || 'Thành viên'}</Link>
        <div className="small muted">{r.person?.province || ''} · {timeAgo(r.created_at)}</div>
        {r.message && <div className="small">“{r.message}”</div>}
        <div className="row" style={{ marginTop: 8 }}>{children}</div>
      </div>
    </div>
  );

  return (
    <div>
      <h1>Kết nối</h1>
      <h2>Lời mời đến ({incoming.length})</h2>
      {incoming.length === 0 && <p className="muted">Không có lời mời mới.</p>}
      {incoming.map((r) => <Person key={r.id} r={r}>
        <button className="btn sm green" onClick={() => respond(r.id, 'accepted')}>✅ Đồng ý</button>
        <button className="btn sm ghost" onClick={() => respond(r.id, 'declined')}>Từ chối</button>
      </Person>)}
      <h2>Đã kết nối ({accepted.length})</h2>
      {accepted.length === 0 && <p className="muted">Hãy tìm người cùng khu vực trên <Link to="/ban-do">bản đồ</Link> và gửi lời kết nối.</p>}
      {err && <div className="error">{err}</div>}
      {accepted.map((r) => <Person key={r.id} r={r}>
        <button className="btn sm" onClick={() => chat(r.other)}>💬 Nhắn tin</button>
        {r.phone && <a className="btn sm call" href={`tel:${normalizePhone(r.phone)}`}>📞 Gọi</a>}
        <button className="btn sm ghost" onClick={() => remove(r.id)}>Hủy kết nối</button>
      </Person>)}
      {sent.length > 0 && <h2>Đã gửi, đang chờ ({sent.length})</h2>}
      {sent.map((r) => <Person key={r.id} r={r}><button className="btn sm ghost" onClick={() => remove(r.id)}>Rút lại</button></Person>)}
    </div>
  );
}
