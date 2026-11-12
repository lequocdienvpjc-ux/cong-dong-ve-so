import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function Install() {
  const [apk, setApk] = useState(null);
  useEffect(() => { supabase.from('public_config').select('android_version, android_apk_url').maybeSingle().then(({ data }) => setApk(data)); }, []);
  return (
    <div className="stack">
      <h1>Cài ứng dụng</h1>
      <div className="notice">
        ⏳ <b>Ứng dụng đang chờ duyệt để đưa lên cửa hàng ứng dụng</b> cho mọi người tiện tải về.
        Hiện tại, để tải, làm theo hướng dẫn bên dưới.
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>🤖 Điện thoại Android</h2>
        {apk?.android_apk_url ? <a className="btn block green" href={apk.android_apk_url}>⬇️ Tải ứng dụng (APK) – bản {apk.android_version}</a>
          : <p className="muted">Đường link tải sẽ được cập nhật sớm.</p>}
        <ol>
          <li>Bấm nút tải ở trên, chờ tải xong.</li>
          <li>Mở tệp <b>.apk</b> vừa tải về (trong mục Tải xuống). Nếu máy hỏi, chọn <b>Cho phép cài từ nguồn này</b>.</li>
          <li>Bấm <b>Cài đặt</b>. Nếu Google Play Protect cảnh báo, chọn <b>Vẫn cài đặt</b>.</li>
        </ol>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>🍎 iPhone</h2>
        <ol>
          <li>Mở trang này bằng <b>Safari</b>.</li>
          <li>Bấm nút <b>Chia sẻ</b> (hình vuông có mũi tên lên) ở dưới màn hình.</li>
          <li>Chọn <b>Thêm vào MH chính</b> rồi bấm <b>Thêm</b>.</li>
          <li>Biểu tượng Cộng Đồng Mưu Sinh xuất hiện trên màn hình như một ứng dụng.</li>
        </ol>
      </div>
    </div>
  );
}
