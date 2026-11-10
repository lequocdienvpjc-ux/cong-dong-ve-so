import { useEffect, useState } from 'react';
import { supabase, errText } from '../lib/supabase.js';

const LABELS = [
  ['members', 'Thành viên'], ['new_7d', 'Mới 7 ngày'], ['locked', 'Đang khóa'], ['dai_ly', 'Đại lý'],
  ['ban_dao', 'Người bán dạo'], ['ban_co_dinh', 'Bán cố định'], ['nguoi_mua', 'Người mua'], ['ho_tro', 'Muốn hỗ trợ'],
  ['can_ho_tro', 'Cần hỗ trợ'], ['places', 'Điểm bán/đại lý'], ['posts', 'Bài đăng'], ['posts_7d', 'Bài 7 ngày'],
  ['help_open', 'Yêu cầu hỗ trợ đang mở'], ['comments', 'Phản hồi'], ['connections', 'Kết nối thành công'], ['reports_open', 'Báo cáo chờ xử lý'],
];

function Bars({ data, title }) {
  const entries = Object.entries(data || {});
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div className="card">
      <b>{title}</b>
      {entries.length === 0 && <p className="muted">Chưa có dữ liệu.</p>}
      <table style={{ width: '100%', marginTop: 8 }}><tbody>
        {entries.map(([k, v]) => (
          <tr key={k}><td style={{ width: 150, fontSize: '.8rem' }}>{k}</td>
            <td><div className="bar" style={{ width: `${(v / max) * 100}%`, minWidth: 4 }} /></td>
            <td style={{ width: 40, textAlign: 'right' }}>{v}</td></tr>
        ))}
      </tbody></table>
    </div>
  );
}

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { supabase.rpc('admin_stats').then(({ data, error }) => error ? setErr(errText(error)) : setS(data)); }, []);
  if (err) return <div className="error">{err}</div>;
  if (!s) return <p>Đang tải…</p>;
  return (
    <div>
      <h1>Thống kê</h1>
      <div className="stat-grid">{LABELS.map(([k, l]) => <div className="stat" key={k}>{l}<b>{s[k]}</b></div>)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 12, marginTop: 14 }}>
        <Bars title="Thành viên theo tỉnh (top 20)" data={s.by_province} />
        <Bars title="Đăng ký mới 30 ngày qua" data={s.signups_by_day} />
      </div>
    </div>
  );
}
