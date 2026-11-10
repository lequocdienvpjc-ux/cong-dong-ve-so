import { useEffect, useState } from 'react';
import { supabase, errText } from '../lib/supabase.js';
import { POST_KINDS, PROVINCES } from '@shared/constants.js';
import { fmtDate } from './Admin.jsx';

export default function Posts({ helpOnly }) {
  const [rows, setRows] = useState([]);
  const [kind, setKind] = useState('');
  const [status, setStatus] = useState(helpOnly ? 'open' : '');
  const [province, setProvince] = useState('');
  const [msg, setMsg] = useState('');
  const [names, setNames] = useState({});

  const load = async () => {
    let r = supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(200);
    if (helpOnly) r = r.eq('kind', 'can_giup'); else if (kind) r = r.eq('kind', kind);
    if (status === 'open') r = r.eq('resolved', false).eq('status', 'visible');
    else if (status === 'resolved') r = r.eq('resolved', true);
    else if (status) r = r.eq('status', status);
    if (province) r = r.eq('province', province);
    const { data, error } = await r;
    if (error) return setMsg(errText(error));
    setRows(data || []);
    const ids = [...new Set((data || []).map((p) => p.author_id))];
    if (ids.length) {
      const { data: ps } = await supabase.from('profiles').select('id, display_name').in('id', ids);
      setNames(Object.fromEntries((ps || []).map((p) => [p.id, p.display_name])));
    }
  };
  useEffect(() => { load(); }, [kind, status, province, helpOnly]);

  const update = async (p, patch, action) => {
    const { error } = await supabase.from('posts').update(patch).eq('id', p.id);
    if (!error) await supabase.rpc('log_admin', { p_action: action, p_target: p.id, p_detail: { title: p.title } });
    setMsg(error ? errText(error) : 'Đã cập nhật.'); load();
  };

  return (
    <div>
      <h1>{helpOnly ? 'Yêu cầu hỗ trợ' : 'Quản lý bài đăng'}</h1>
      <div className="filters">
        {!helpOnly && <select value={kind} onChange={(e) => setKind(e.target.value)}><option value="">Mọi loại</option>{Object.entries(POST_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Mọi trạng thái</option><option value="open">Chưa được giúp</option><option value="resolved">Đã được giúp</option>
          <option value="visible">Đang hiển thị</option><option value="hidden">Đã ẩn</option><option value="removed">Đã gỡ</option>
        </select>
        <select value={province} onChange={(e) => setProvince(e.target.value)}><option value="">Mọi tỉnh</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
      </div>
      {msg && <div className="notice">{msg}</div>}
      <table className="tbl">
        <thead><tr><th>Bài</th><th>Người đăng</th><th>Tỉnh</th><th>Thời gian</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>{rows.map((p) => (
          <tr key={p.id}>
            <td style={{ maxWidth: 380 }}><span className="tag">{POST_KINDS[p.kind]}</span> <b>{p.title}</b>
              <div className="small" style={{ whiteSpace: 'pre-wrap', maxHeight: 90, overflow: 'auto' }}>{p.body}</div>
              <a className="small" href={`#/bai/${p.id}`} target="_blank" rel="noreferrer">Mở bài</a></td>
            <td className="small"><a href={`#/thanh-vien/${p.author_id}`} target="_blank" rel="noreferrer">{names[p.author_id] || '…'}</a></td>
            <td>{p.province}</td><td className="small">{fmtDate(p.created_at)}</td>
            <td>{p.status === 'visible' ? <span className="tag green">Hiển thị</span> : <span className="tag red">{p.status === 'hidden' ? 'Ẩn' : 'Đã gỡ'}</span>}
              {p.resolved && <div className="tag gray">Đã được giúp</div>}</td>
            <td><div className="row">
              {p.status !== 'visible' && <button className="btn green" onClick={() => update(p, { status: 'visible' }, 'post_show')}>Hiện</button>}
              {p.status === 'visible' && <button className="btn secondary" onClick={() => update(p, { status: 'hidden' }, 'post_hide')}>Ẩn</button>}
              {p.status !== 'removed' && <button className="btn danger" onClick={() => update(p, { status: 'removed' }, 'post_remove')}>Gỡ vi phạm</button>}
              {p.kind === 'can_giup' && <button className="btn secondary" onClick={() => update(p, { resolved: !p.resolved }, 'post_resolved')}>{p.resolved ? 'Mở lại' : 'Đã giúp xong'}</button>}
            </div></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
