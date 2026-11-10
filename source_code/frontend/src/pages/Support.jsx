import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { POST_KINDS, PROVINCES } from '@shared/constants.js';
import { timeAgo } from '../components/ui.jsx';

export async function attachAuthors(rows) {
  const ids = [...new Set(rows.map((r) => r.author_id))];
  if (!ids.length) return rows;
  const { data } = await supabase.from('public_profiles').select('id, display_name, avatar_url').in('id', ids);
  const m = Object.fromEntries((data || []).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, author: m[r.author_id] }));
}

export default function Support() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') || '';
  const { user, profile } = useAuth();
  const [province, setProvince] = useState(sp.get('tinh') || '');
  const [posts, setPosts] = useState(null);

  useEffect(() => { if (!sp.get('tinh') && profile?.province) setProvince(profile.province); }, [profile]);

  useEffect(() => {
    let q = supabase.from('posts').select('*').eq('status', 'visible').order('created_at', { ascending: false }).limit(50);
    if (tab) q = q.eq('kind', tab);
    if (province) q = q.eq('province', province);
    q.then(async ({ data }) => setPosts(await attachAuthors(data || [])));
  }, [tab, province]);

  const setTab = (k) => { const n = new URLSearchParams(sp); if (k) n.set('tab', k); else n.delete('tab'); setSp(n, { replace: true }); };

  return (
    <div>
      <h1>Bảng tương trợ</h1>
      <div className="row" style={{ marginBottom: 10 }}>
        <Link className="btn danger grow" to="/dang-bai?loai=can_giup">🆘 Tôi cần giúp đỡ</Link>
        <Link className="btn green grow" to="/dang-bai?loai=muon_giup">🤝 Tôi muốn giúp</Link>
      </div>
      {!user && <p className="small muted">Bạn cần đăng nhập để đăng bài.</p>}
      <div className="tabs">
        <button className={'chip' + (!tab ? ' on' : '')} onClick={() => setTab('')}>Tất cả</button>
        {Object.entries(POST_KINDS).map(([k, v]) => (
          <button key={k} className={'chip' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>
      <select style={{ margin: '10px 0' }} value={province} onChange={(e) => setProvince(e.target.value)} aria-label="Tỉnh/thành">
        <option value="">Mọi tỉnh/thành</option>
        {PROVINCES.map((p) => <option key={p}>{p}</option>)}
      </select>
      {posts === null && <p className="muted">Đang tải…</p>}
      {posts?.length === 0 && <p className="muted">Chưa có bài nào. Hãy là người đầu tiên chia sẻ.</p>}
      {posts?.map((p) => (
        <Link key={p.id} to={`/bai/${p.id}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <span className={'tag ' + (p.kind === 'can_giup' ? 'red' : p.kind === 'muon_giup' ? 'green' : '')}>{POST_KINDS[p.kind]}</span>
          {p.resolved && <span className="tag gray">Đã được giúp</span>}
          <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: 4 }}>{p.title}</div>
          <div className="small muted">{p.author?.display_name || 'Thành viên'} · {p.province || 'Toàn quốc'} · {timeAgo(p.created_at)}</div>
        </Link>
      ))}
    </div>
  );
}
