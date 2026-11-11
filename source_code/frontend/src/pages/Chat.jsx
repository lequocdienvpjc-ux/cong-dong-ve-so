import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { otherOf } from '../lib/messages.js';
import { Avatar, Msg, VoiceInput } from '../components/ui.jsx';

const fmtTime = (iso) => {
  const d = new Date(iso); const today = new Date();
  const hm = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === today.toDateString() ? hm : `${hm} · ${d.toLocaleDateString('vi-VN')}`;
};

// Màn hình trò chuyện riêng giữa 2 thành viên
export default function Chat() {
  const { id } = useParams();
  const { user } = useAuth();
  const [conv, setConv] = useState(undefined);
  const [person, setPerson] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [state, setState] = useState({});
  const [connected, setConnected] = useState(true);
  const endRef = useRef(null);

  const markRead = () => {
    supabase.rpc('mark_conversation_read', { p_conv: id }).then(() => window.dispatchEvent(new Event('tin-nhan-da-doc')));
    supabase.from('notifications').update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id).eq('link', `/tin-nhan/${id}`).is('read_at', null).then();
  };

  const loadMsgs = async () => {
    const { data } = await supabase.from('messages').select('id, sender_id, body, created_at')
      .eq('conversation_id', id).order('created_at', { ascending: false }).limit(300);
    setMsgs((data || []).reverse());
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: c } = await supabase.from('conversations').select('*').eq('id', id).maybeSingle();
      if (!alive) return;
      setConv(c);
      if (!c) return;
      const other = otherOf(c, user.id);
      const { data: p } = await supabase.from('public_profiles').select('id, display_name, avatar_url, province').eq('id', other).maybeSingle();
      if (alive) setPerson(p || { id: other });
      const { data: ok } = await supabase.rpc('are_connected', { a: user.id, b: other });
      if (alive) setConnected(!!ok);
      await loadMsgs();
      markRead();
    })();
    // Nhận tin mới tức thời; dự phòng tải lại mỗi 8 giây nếu mạng chập chờn
    const ch = supabase.channel('chat-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        (e) => { setMsgs((cur) => (cur.some((m) => m.id === e.new.id) ? cur : [...cur, e.new])); markRead(); })
      .subscribe();
    const t = setInterval(loadMsgs, 8000);
    return () => { alive = false; supabase.removeChannel(ch); clearInterval(t); };
  }, [id]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);

  const send = async (e) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true); setState({});
    const { data, error } = await supabase.from('messages')
      .insert({ conversation_id: id, sender_id: user.id, body }).select('id, sender_id, body, created_at').single();
    setSending(false);
    if (error) { setState({ error }); return; }
    setText('');
    setMsgs((cur) => (cur.some((m) => m.id === data.id) ? cur : [...cur, data]));
  };

  if (conv === undefined) return <p className="muted">Đang tải…</p>;
  if (!conv) return <div className="error">Không tìm thấy cuộc trò chuyện hoặc bạn không có quyền xem.</div>;

  return (
    <div className="chat">
      <div className="card list-item chat-head">
        <Link to="/tin-nhan" className="btn sm ghost" aria-label="Quay lại hộp thư">←</Link>
        <Avatar url={person?.avatar_url} />
        <div className="grow">
          <Link className="name" to={`/thanh-vien/${person?.id || ''}`}>{person?.display_name || 'Thành viên'}</Link>
          {person?.province && <div className="small muted">{person.province}</div>}
        </div>
      </div>

      <div className="chat-list" aria-live="polite">
        {msgs.length === 0 && <p className="muted center">Chưa có tin nhắn. Hãy gửi lời chào!</p>}
        {msgs.map((m) => (
          <div key={m.id} className={'bubble ' + (m.sender_id === user.id ? 'mine' : 'theirs')}>
            <div className="post-body">{m.body}</div>
            <div className="time">{fmtTime(m.created_at)}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {connected ? (
        <form className="chat-send" onSubmit={send}>
          <div className="grow">
            <VoiceInput multiline rows={2} value={text} onChange={setText} maxLength={2000}
              placeholder="Nhập tin nhắn hoặc bấm 🎤 để nói…" aria-label="Nội dung tin nhắn"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 800) send(e); }} />
          </div>
          <button className="btn" type="submit" disabled={sending || !text.trim()}>{sending ? '…' : 'Gửi'}</button>
        </form>
      ) : (
        <div className="notice">Hai bạn không còn kết nối nên không gửi được tin mới. Bạn vẫn xem lại được lịch sử trò chuyện.</div>
      )}
      <Msg {...state} />
      <p className="footer-note">Không chia sẻ số tài khoản, mật khẩu, mã OTP. Ứng dụng không hỗ trợ mua bán, giao vé qua tin nhắn.</p>
    </div>
  );
}
