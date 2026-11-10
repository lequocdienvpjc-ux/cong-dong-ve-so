import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { VoiceInput } from '../components/ui.jsx';

const logo = import.meta.env.BASE_URL + 'logo.png';

export default function Home() {
  const nav = useNavigate();
  const { user, profile } = useAuth();
  const [q, setQ] = useState('');
  return (
    <div>
      <div className="home-hero">
        <img src={logo} alt="Logo Cộng Đồng Vé Số" />
        <p className="slogan">HỖ TRỢ LẪN NHAU – VƯỢT QUA KHÓ KHĂN</p>
        {user && <p className="muted" style={{ margin: '4px 0 0' }}>Xin chào, <b>{profile?.display_name}</b></p>}
      </div>

      <div className="big-grid">
        <Link className="big-btn b1" to="/ban-do?loai=dai_ly"><span className="ico">🏪</span>TÌM ĐẠI LÝ GẦN TÔI</Link>
        <Link className="big-btn b2" to="/ban-do?loai=nguoi_ban"><span className="ico">🚶</span>TÌM NGƯỜI BÁN</Link>
        <Link className="big-btn b3" to="/ho-tro?tab=can_giup"><span className="ico">🆘</span>TÔI CẦN HỖ TRỢ</Link>
        <Link className="big-btn b4" to="/ban-do?loai=diem_ban"><span className="ico">📍</span>TÌM ĐIỂM BÁN</Link>
      </div>

      <form className="search" onSubmit={(e) => { e.preventDefault(); nav('/tim?q=' + encodeURIComponent(q)); }}>
        <div className="grow"><VoiceInput value={q} onChange={setQ} placeholder="Tìm tên, phường/xã, tỉnh…" aria-label="Tìm kiếm" /></div>
        <button className="btn" type="submit">Tìm</button>
      </form>

      <div className="row" style={{ marginTop: 14 }}>
        <Link className="btn secondary grow" to="/ban-do">🗺️ Bản đồ cộng đồng</Link>
        <Link className="btn secondary grow" to="/ho-tro">🤝 Bảng tương trợ</Link>
      </div>

      {!user && (
        <div className="card" style={{ marginTop: 14 }}>
          <b>Tham gia cộng đồng miễn phí</b>
          <p className="muted" style={{ margin: '6px 0 10px' }}>Đăng ký để có hồ sơ trên bản đồ, đăng tin cần giúp và kết nối với mọi người.</p>
          <Link className="btn block" to="/dang-nhap?dk=1">Đăng ký / Đăng nhập</Link>
        </div>
      )}

      <div className="notice" style={{ marginTop: 14 }}>
        <b>Lưu ý:</b> Ứng dụng chỉ kết nối và chia sẻ thông tin. <b>Không mua bán, đặt, giao vé số</b> qua ứng dụng.
        Không đăng dự đoán kết quả xổ số.
      </div>
      <p className="footer-note">
        <Link to="/gioi-thieu">Giới thiệu</Link> · <Link to="/quy-dinh">Quy định &amp; quyền riêng tư</Link> · <Link to="/cai-dat-app">Cài ứng dụng</Link>
      </p>
    </div>
  );
}
