import { useEffect, useState } from 'react';
import { supabase, errText } from '../lib/supabase.js';
import { fmtDate } from './Admin.jsx';

export default function Audit() {
  const [rows, setRows] = useState([]);
  const [names, setNames] = useState({});
  const [err, setErr] = useState('');
  useEffect(() => {
    supabase.from('admin_audit').select('*').order('created_at', { ascending: false }).limit(300).then(async ({ data, error }) => {
      if (error) return setErr(errText(error));
      setRows(data || []);
      const ids = [...new Set((data || []).map((r) => r.actor_id).filter(Boolean))];
      if (ids.length) {
        const { data: ps } = await supabase.from('profiles').select('id, display_name').in('id', ids);
        setNames(Object.fromEntries((ps || []).map((p) => [p.id, p.display_name])));
      }
    });
  }, []);
  return (
    <div>
      <h1>Nhật ký quản trị</h1>
      {err && <div className="error">{err} (chỉ Quản trị viên trở lên xem được)</div>}
      <table className="tbl">
        <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Thao tác</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id}><td className="small">{fmtDate(r.created_at)}</td><td>{names[r.actor_id] || r.actor_id}</td><td>{r.action}</td>
            <td className="small">{r.target}</td><td className="small"><code>{JSON.stringify(r.detail)}</code></td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}
