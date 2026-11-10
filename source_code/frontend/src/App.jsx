import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout.jsx';
import { configured } from './lib/supabase.js';
import { useAuth } from './lib/auth.jsx';
import Home from './pages/Home.jsx';
import MapPage from './pages/MapPage.jsx';
import Search from './pages/Search.jsx';
import Member from './pages/Member.jsx';
import Support from './pages/Support.jsx';
import PostDetail from './pages/PostDetail.jsx';
import NewPost from './pages/NewPost.jsx';
import Auth from './pages/Auth.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Me from './pages/Me.jsx';
import MyPlaces from './pages/MyPlaces.jsx';
import Notifications from './pages/Notifications.jsx';
import Connections from './pages/Connections.jsx';
import Rules from './pages/Rules.jsx';
import Install from './pages/Install.jsx';

const Admin = lazy(() => import('./admin/Admin.jsx'));

export function RequireAuth({ children }) {
  const { user, profile, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <p className="center muted">Đang tải…</p>;
  if (!user) return <Navigate to={'/dang-nhap?tiep=' + encodeURIComponent(loc.pathname)} replace />;
  if (profile?.is_locked) return (
    <div className="error">Tài khoản đang bị khóa{profile.lock_reason ? `: ${profile.lock_reason}` : ''}. Liên hệ quản trị viên.</div>
  );
  return children;
}

export default function App() {
  const { recovery } = useAuth();
  if (!configured) {
    return <div className="page"><div className="error">Ứng dụng chưa được cấu hình máy chủ (thiếu VITE_SUPABASE_URL).</div></div>;
  }
  if (recovery) return <Layout><ResetPassword /></Layout>;
  return (
    <Routes>
      <Route path="/admin/*" element={<Suspense fallback={<p className="center">Đang tải trang quản trị…</p>}><Admin /></Suspense>} />
      <Route path="*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ban-do" element={<MapPage />} />
            <Route path="/tim" element={<Search />} />
            <Route path="/thanh-vien/:id" element={<Member />} />
            <Route path="/ho-tro" element={<Support />} />
            <Route path="/bai/:id" element={<PostDetail />} />
            <Route path="/dang-bai" element={<RequireAuth><NewPost /></RequireAuth>} />
            <Route path="/dang-nhap" element={<Auth />} />
            <Route path="/doi-mat-khau" element={<RequireAuth><ResetPassword /></RequireAuth>} />
            <Route path="/toi" element={<RequireAuth><Me /></RequireAuth>} />
            <Route path="/diem-cua-toi" element={<RequireAuth><MyPlaces /></RequireAuth>} />
            <Route path="/thong-bao" element={<RequireAuth><Notifications /></RequireAuth>} />
            <Route path="/ket-noi" element={<RequireAuth><Connections /></RequireAuth>} />
            <Route path="/gioi-thieu" element={<Rules part={1} />} />
            <Route path="/quy-dinh" element={<Rules part={2} />} />
            <Route path="/cai-dat-app" element={<Install />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  );
}
