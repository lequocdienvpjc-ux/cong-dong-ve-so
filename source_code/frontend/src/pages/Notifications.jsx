import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { timeAgo } from '../components/ui.jsx';

const ICON = { connection: '🤝', reply: '💬', message: '✉️', support: '🆘', system: '📢' };

export default function Notifications() {
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const load = () => supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100)
    .then(({ data }) => setList(data || []));
  useEffect(() => { load(); }, []);
  const readAll = async () => { await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null); load(); };
  const open = (n) => { if (!n.read_at) supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id).then(); };
  return (
    <div>
      <div className="row"><h1 className="grow">Thông báo</h1><button className="btn sm secondary" onClick={readAll}>Đánh dấu đã đọc</button></div>
      <p className="small muted">Chọn loại thông báo muốn nhận trong <Link to="/toi">Của tôi</Link>.</p>
      {list === null && <p className="muted">Đang tải…</p>}
      {list?.length === 0 && <p className="muted">Chưa có thông báo.</p>}
      {list?.map((n) => {
        const inner = (<><div style={{ fontWeight: n.read_at ? 500 : 800 }}>{ICON[n.type] || '🔔'} {n.title}</div>
          {n.body && <div className="small">{n.body}</div>}<div className="small muted">{timeAgo(n.created_at)}</div></>);
        return n.link
          ? <Link key={n.id} to={n.link} onClick={() => open(n)} className="card" style={{ display: 'block', color: 'inherit', textDecoration: 'none', background: n.read_at ? '#fff' : '#eef4ff' }}>{inner}</Link>
          : <div key={n.id} className="card" onClick={() => open(n)} style={{ background: n.read_at ? '#fff' : '#eef4ff' }}>{inner}</div>;
      })}
    </div>
  );
}
