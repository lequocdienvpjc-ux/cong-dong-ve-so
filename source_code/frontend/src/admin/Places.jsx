import { useEffect, useState } from 'react';
import { supabase, errText } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { MAP_KINDS, PROVINCES } from '@shared/constants.js';
import { fmtDate } from './Admin.jsx';

export default function Places() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [kind, setKind] = useState('');
  const [province, setProvince] = useState('');
  const [msg, setMsg] = useState('');
  const load = async () => {
    let r = supabase.from('places').select('*').order('created_at', { ascending: false }).limit(300);
    if (kind) r = r.eq('kind', kind);
    if (province) r = r.eq('province', province);
    const { data, error } = await r;
    if (error) setMsg(errText(error)); else setRows(data || []);
  };
  useEffect(() => { load(); }, [kind, province]);
  const act = async (p, change) => {
    const { error } = change === 'delete' ? await supabase.from('places').delete().eq('id', p.id)
      : await supabase.from('places').update({ status: change }).eq('id', p.id);
    if (!error) await supabase.rpc('log_admin', { p_action: 'place_' + change, p_target: p.id, p_detail: { name: p.name } });
    setMsg(error ? errText(error) : 'Đã cập nhật.'); load();
  };
  return (
    <div>
      <h1>Điểm bán / đại lý</h1>
      <div className="filters">
        <select value={kind} onChange={(e) => setKind(e.target.value)}><option value="">Mọi loại</option><option value="dai_ly">Đại lý</option><option value="diem_ban">Điểm bán</option></select>
        <select value={province} onChange={(e) => setProvince(e.target.value)}><option value="">Mọi tỉnh</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
      </div>
      {msg && <div className="notice">{msg}</div>}
      <table className="tbl">
        <thead><tr><th>Tên</th><th>Loại</th><th>Địa chỉ</th><th>SĐT</th><th>Tạo lúc</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>{rows.map((p) => (
          <tr key={p.id}>
            <td><b>{p.name}</b><br /><a className="small" href={`#/thanh-vien/${p.owner_id}`} target="_blank" rel="noreferrer">Chủ điểm</a></td>
            <td>{MAP_KINDS[p.kind]?.label}</td><td className="small">{[p.address, p.province].filter(Boolean).join(', ')}</td>
            <td>{p.phone}</td><td className="small">{fmtDate(p.created_at)}</td>
            <td>{p.status === 'visible' ? <span className="tag green">Hiển thị</span> : <span className="tag gray">Ẩn</span>}</td>
            <td className="row">
              {p.status === 'visible' ? <button className="btn secondary" onClick={() => act(p, 'hidden')}>Ẩn</button> : <button className="btn green" onClick={() => act(p, 'visible')}>Hiện</button>}
              {isAdmin && <button className="btn danger" onClick={() => confirm('Xóa điểm?') && act(p, 'delete')}>Xóa</button>}
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
