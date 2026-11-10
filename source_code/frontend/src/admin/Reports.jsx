import { useEffect, useState } from 'react';
import { supabase, errText } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { REPORT_REASONS } from '@shared/constants.js';
import { fmtDate } from './Admin.jsx';

const LINK = { post: (id) => `#/bai/${id}`, profile: (id) => `#/thanh-vien/${id}` };
const TYPE = { post: 'Bài đăng', comment: 'Phản hồi', profile: 'Hồ sơ', place: 'Điểm bán' };

export default function Reports() {
  const { user, isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('open');
  const [msg, setMsg] = useState('');
  const [preview, setPreview] = useState({});

  const load = async () => {
    let r = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(200);
    if (status) r = r.eq('status', status);
    const { data, error } = await r;
    if (error) return setMsg(errText(error));
    setRows(data || []);
    const pv = {};
    for (const rp of data || []) {
      const t = rp.target_type === 'profile' ? 'profiles' : rp.target_type + 's';
      const col = { posts: 'title, body, author_id, status', comments: 'body, author_id, status, post_id', profiles: 'display_name, bio, is_locked', places: 'name, note, owner_id, status' }[t];
      const { data: d } = await supabase.from(t).select(col).eq('id', rp.target_id).maybeSingle();
      pv[rp.id] = d;
    }
    setPreview(pv);
  };
  useEffect(() => { load(); }, [status]);

  const close = async (rp, st) => {
    const { error } = await supabase.from('reports').update({ status: st, handled_by: user.id, handled_at: new Date().toISOString() }).eq('id', rp.id);
    setMsg(error ? errText(error) : 'Đã xử lý báo cáo.'); load();
  };
  const takeDown = async (rp) => {
    const t = rp.target_type;
    let error;
    if (t === 'post' || t === 'comment') ({ error } = await supabase.from(t + 's').update({ status: 'removed' }).eq('id', rp.target_id));
    else if (t === 'place') ({ error } = await supabase.from('places').update({ status: 'hidden' }).eq('id', rp.target_id));
    else if (t === 'profile') ({ error } = await supabase.rpc('set_user_lock', { p_user: rp.target_id, p_locked: true, p_reason: 'Vi phạm: ' + REPORT_REASONS[rp.reason] }));
    if (error) return setMsg(errText(error));
    await supabase.rpc('log_admin', { p_action: 'takedown_' + t, p_target: rp.target_id, p_detail: { report: rp.id } });
    close(rp, 'resolved');
  };

  return (
    <div>
      <h1>Báo cáo vi phạm</h1>
      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="open">Chờ xử lý</option><option value="resolved">Đã xử lý</option><option value="dismissed">Bỏ qua</option><option value="">Tất cả</option>
        </select>
      </div>
      {msg && <div className="notice">{msg}</div>}
      <table className="tbl">
        <thead><tr><th>Thời gian</th><th>Đối tượng</th><th>Lý do</th><th>Nội dung bị báo cáo</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>{rows.map((rp) => {
          const p = preview[rp.id];
          return (
            <tr key={rp.id}>
              <td className="small">{fmtDate(rp.created_at)}</td>
              <td>{TYPE[rp.target_type]}<br />
                {rp.target_type === 'comment' && p?.post_id ? <a className="small" href={`#/bai/${p.post_id}`} target="_blank" rel="noreferrer">Mở</a>
                  : LINK[rp.target_type] && <a className="small" href={LINK[rp.target_type](rp.target_id)} target="_blank" rel="noreferrer">Mở</a>}</td>
              <td><b>{REPORT_REASONS[rp.reason]}</b><div className="small">{rp.detail}</div></td>
              <td className="small" style={{ maxWidth: 360 }}>{p ? (p.title || p.display_name || p.name || '') + ' — ' + (p.body || p.bio || p.note || '').slice(0, 200) : <i>Đã bị xóa</i>}</td>
              <td>{rp.status === 'open' ? <span className="tag red">Chờ xử lý</span> : rp.status === 'resolved' ? <span className="tag green">Đã xử lý</span> : <span className="tag gray">Bỏ qua</span>}</td>
              <td>{rp.status === 'open' && <div className="row">
                {(rp.target_type !== 'profile' || isAdmin) && <button className="btn danger" onClick={() => takeDown(rp)}>{rp.target_type === 'profile' ? 'Khóa tài khoản' : 'Gỡ / ẩn'}</button>}
                <button className="btn secondary" onClick={() => close(rp, 'dismissed')}>Bỏ qua</button>
              </div>}</td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}
