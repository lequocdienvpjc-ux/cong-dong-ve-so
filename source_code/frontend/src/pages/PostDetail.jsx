import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { POST_KINDS, findBanned } from '@shared/constants.js';
import { Msg, ReportButton, SpeakButton, VoiceInput, timeAgo } from '../components/ui.jsx';
import { attachAuthors } from './Support.jsx';

export default function PostDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, isStaff } = useAuth();
  const [post, setPost] = useState(undefined);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [state, setState] = useState({});

  const load = async () => {
    const { data } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
    setPost(data ? (await attachAuthors([data]))[0] : null);
    const { data: cs } = await supabase.from('comments').select('*').eq('post_id', id).eq('status', 'visible').order('created_at');
    setComments(await attachAuthors(cs || []));
  };
  useEffect(() => { load(); }, [id]);

  if (post === undefined) return <p className="muted">Đang tải…</p>;
  if (!post) return <div className="error">Bài viết không tồn tại hoặc đã bị gỡ.</div>;

  const send = async (e) => {
    e.preventDefault();
    const bad = findBanned(text);
    if (bad) return setState({ error: { message: `Không được dùng cụm từ "${bad}".` } });
    const { error } = await supabase.from('comments').insert({ post_id: id, author_id: user.id, body: text.trim() });
    if (error) return setState({ error });
    setText(''); setState({}); load();
  };
  const mine = user?.id === post.author_id;
  const toggleResolved = async () => { await supabase.from('posts').update({ resolved: !post.resolved }).eq('id', id); load(); };
  const remove = async () => {
    if (!confirm('Xóa bài này?')) return;
    await supabase.from('posts').delete().eq('id', id); nav('/ho-tro');
  };

  return (
    <div>
      <div className="card">
        <span className={'tag ' + (post.kind === 'can_giup' ? 'red' : post.kind === 'muon_giup' ? 'green' : '')}>{POST_KINDS[post.kind]}</span>
        {post.resolved && <span className="tag gray">Đã được giúp</span>}
        <h1 style={{ marginTop: 6 }}>{post.title}</h1>
        <div className="small muted">
          <Link to={`/thanh-vien/${post.author_id}`}>{post.author?.display_name || 'Thành viên'}</Link> · {post.province || 'Toàn quốc'} · {timeAgo(post.created_at)}
        </div>
        <p className="post-body">{post.body}</p>
        <div className="row">
          <SpeakButton text={post.title + '. ' + post.body} />
          <Link className="btn sm secondary" to={`/thanh-vien/${post.author_id}`}>👤 Liên hệ người đăng</Link>
        </div>
        {mine && (
          <div className="row" style={{ marginTop: 10 }}>
            {post.kind === 'can_giup' && <button className="btn sm green" onClick={toggleResolved}>{post.resolved ? 'Đánh dấu chưa được giúp' : '✅ Đã được giúp'}</button>}
            <button className="btn sm danger" onClick={remove}>Xóa bài</button>
          </div>
        )}
        {!mine && <div style={{ marginTop: 10 }}><ReportButton type="post" id={id} /></div>}
        {isStaff && <p className="small muted">Bạn là quản trị: xử lý bài trong <Link to="/admin/bai-dang">trang quản trị</Link>.</p>}
      </div>

      <h2>Phản hồi ({comments.length})</h2>
      {comments.map((c) => (
        <div className="card" key={c.id}>
          <div className="small muted"><Link to={`/thanh-vien/${c.author_id}`}>{c.author?.display_name || 'Thành viên'}</Link> · {timeAgo(c.created_at)}</div>
          <div className="post-body">{c.body}</div>
          {user && user.id !== c.author_id && <ReportButton type="comment" id={c.id} />}
          {user && user.id === c.author_id && (
            <button className="btn sm ghost" onClick={async () => { await supabase.from('comments').delete().eq('id', c.id); load(); }}>Xóa</button>
          )}
        </div>
      ))}
      {user ? (
        <form onSubmit={send} className="card stack">
          <VoiceInput multiline value={text} onChange={setText} placeholder="Viết phản hồi, lời động viên hoặc đề nghị giúp…" maxLength={1000} required />
          <Msg {...state} />
          <button className="btn block" disabled={!text.trim()}>Gửi phản hồi</button>
        </form>
      ) : <Link className="btn block secondary" to="/dang-nhap">Đăng nhập để phản hồi</Link>}
    </div>
  );
}
