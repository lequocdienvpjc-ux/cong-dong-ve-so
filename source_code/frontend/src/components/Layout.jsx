import { Link, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { supabase } from '../lib/supabase.js';
import UpdateBanner from './UpdateBanner.jsx';
import { useUnreadMessages } from '../lib/messages.js';

const logo = import.meta.env.BASE_URL + 'logo.png';

export default function Layout({ children }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [announce, setAnnounce] = useState('');
  const unreadMsg = useUnreadMessages(user);

  useEffect(() => {
    supabase.from('public_config').select('announcement').maybeSingle()
      .then(({ data }) => setAnnounce(data?.announcement || ''));
  }, []);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let alive = true;
    const load = () => supabase.from('notifications').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).is('read_at', null).then(({ count }) => alive && setUnread(count || 0));
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, [user]);

  const toggleBig = () => {
    const on = document.documentElement.classList.toggle('big-text');
    try { localStorage.setItem('bigText', on ? '1' : '0'); } catch {}
  };

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/"><img src={logo} alt="Logo Cộng Đồng Vé Số" /></Link>
        <div className="title">Cộng Đồng Vé Số<small>Hỗ trợ lẫn nhau – Vượt qua khó khăn</small></div>
        <button className="icon-btn" onClick={toggleBig} aria-label="Phóng to hoặc thu nhỏ chữ">A±</button>
        {user && (
          <Link to="/tin-nhan" className="icon-btn" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}
            aria-label={`Tin nhắn, ${unreadMsg} cuộc trò chuyện chưa đọc`}>
            💬{unreadMsg > 0 && <span className="badge">{unreadMsg > 99 ? '99+' : unreadMsg}</span>}
          </Link>
        )}
        <Link to="/thong-bao" className="icon-btn" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}
          aria-label={`Thông báo, ${unread} chưa đọc`}>
          🔔{unread > 0 && <span className="badge">{unread > 99 ? '99+' : unread}</span>}
        </Link>
      </header>
      <UpdateBanner />
      {announce && <div className="notice" style={{ borderRadius: 0, borderWidth: '0 0 2px' }}>📢 {announce}</div>}
      <main className="page">{children}</main>
      <nav className="bottom-nav" aria-label="Điều hướng chính">
        <NavLink to="/" end><span className="i">🏠</span>Trang chủ</NavLink>
        <NavLink to="/ban-do"><span className="i">🗺️</span>Bản đồ</NavLink>
        <NavLink to="/ho-tro"><span className="i">🤝</span>Hỗ trợ</NavLink>
        <NavLink to="/ket-noi"><span className="i">👥</span>Kết nối</NavLink>
        <NavLink to="/toi"><span className="i">👤</span>{user ? 'Của tôi' : 'Đăng nhập'}</NavLink>
      </nav>
    </div>
  );
}
