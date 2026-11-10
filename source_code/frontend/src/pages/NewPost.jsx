import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { POST_KINDS, PROVINCES, findBanned } from '@shared/constants.js';
import { Field, Msg, VoiceInput } from '../components/ui.jsx';

export default function NewPost() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { user, profile } = useAuth();
  const [kind, setKind] = useState(sp.get('loai') || 'can_giup');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [province, setProvince] = useState(profile?.province || '');
  const [state, setState] = useState({});
  const [busy, setBusy] = useState(false);

  if (profile && !profile.adult_confirmed) {
    return <div className="notice">Bạn cần xác nhận đủ 18 tuổi trong <a href="#/toi">hồ sơ</a> trước khi đăng bài.</div>;
  }

  const submit = async (e) => {
    e.preventDefault();
    const bad = findBanned(title + ' ' + body);
    if (bad) return setState({ error: { message: `Không được dùng cụm từ "${bad}". Ứng dụng không cho phép dự đoán số hoặc mua bán vé.` } });
    setBusy(true);
    const { data, error } = await supabase.from('posts').insert({ author_id: user.id, kind, title: title.trim(), body: body.trim(), province: province || null })
      .select('id').single();
    setBusy(false);
    if (error) return setState({ error });
    nav(`/bai/${data.id}`, { replace: true });
  };

  return (
    <form onSubmit={submit}>
      <h1>Đăng bài</h1>
      <div className="chips" style={{ marginBottom: 12 }}>
        {Object.entries(POST_KINDS).map(([k, v]) => (
          <button type="button" key={k} className={'chip' + (kind === k ? ' on' : '')} onClick={() => setKind(k)}>{v}</button>
        ))}
      </div>
      <Field label="Tiêu đề ngắn">
        <VoiceInput value={title} onChange={setTitle} maxLength={150} required
          placeholder={kind === 'can_giup' ? 'Ví dụ: Cần người chở đi khám bệnh' : 'Ví dụ: Tôi có thể sửa xe lăn miễn phí'} />
      </Field>
      <Field label="Nội dung" hint="Bấm 🎤 để nói thay vì gõ. Không ghi số tài khoản ngân hàng.">
        <VoiceInput multiline value={body} onChange={setBody} maxLength={3000} required />
      </Field>
      <Field label="Tỉnh/thành">
        <select value={province} onChange={(e) => setProvince(e.target.value)}>
          <option value="">Toàn quốc</option>
          {PROVINCES.map((p) => <option key={p}>{p}</option>)}
        </select>
      </Field>
      <Msg {...state} />
      <button className="btn block" disabled={busy} style={{ marginTop: 10 }}>{busy ? 'Đang đăng…' : 'Đăng bài'}</button>
    </form>
  );
}
