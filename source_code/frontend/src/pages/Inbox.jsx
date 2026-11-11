import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { otherOf, isUnread } from '../lib/messages.js';
import { Avatar, timeAgo } from '../components/ui.jsx';

// Hộp thư: danh sách các cuộc trò chuyện riêng
export default function Inbox() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);

  const load = async () => {
    const { data } = await supabase.from('conversations').select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false }).limit(200);
    const list = data || [];
    const ids = [...new Set(list.map((c) => otherOf(c, user.id)))];
    const { data: ps } = ids.length
      ? await supabase.from('public_profiles').select('id, display_name, avatar_url, province').in('id', ids) : { data: [] };
    const m = Object.fromEntries((ps || []).map((p) => [p.id, p]));
    setRows(list.map((c) => ({ ...c, person: m[otherOf(c, user.id)] })));
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('inbox-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, load).subscribe();
    const t = setInterval(load, 20000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, []);

  return (
    <div>
      <h1>💬 Tin nhắn</h1>
      <p className="small muted">Chỉ bạn và người được nhắn mới xem được nội dung. Bạn có thể nhắn tin với người đã kết nối.</p>
      {rows === null && <p className="muted">Đang tải…</p>}
      {rows?.length === 0 && (
        <div className="card">
          <p style={{ marginTop: 0 }}>Bạn chưa có cuộc trò chuyện nào.</p>
          <p className="muted small">Vào <Link to="/ket-noi">Kết nối</Link>, chọn một người đã kết nối rồi bấm <b>💬 Nhắn tin</b>.</p>
        </div>
      )}
      {rows?.map((c) => {
        const unread = isUnread(c, user.id);
        return (
          <Link key={c.id} to={`/tin-nhan/${c.id}`} className="card list-item"
            style={{ color: 'inherit', textDecoration: 'none', background: unread ? '#eef4ff' : '#fff' }}>
            <Avatar url={c.person?.avatar_url} />
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <span className="name grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.person?.display_name || 'Thành viên'}
                </span>
                {c.last_message_at && <span className="small muted" style={{ flex: 'none' }}>{timeAgo(c.last_message_at)}</span>}
              </div>
              <div className="small" style={{ fontWeight: unread ? 800 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.last_preview ? (c.last_sender === user.id ? 'Bạn: ' : '') + c.last_preview : <span className="muted">Chưa có tin nhắn</span>}
              </div>
            </div>
            {unread && <span className="dot-unread" aria-label="Có tin chưa đọc" />}
          </Link>
        );
      })}
    </div>
  );
}
