import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { supabase, redirectUrl } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { Field, Msg, VoiceInput } from '../components/ui.jsx';

export default function Auth() {
  const [sp] = useSearchParams();
  const { user } = useAuth();
  const [mode, setMode] = useState(sp.get('dk') ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adult, setAdult] = useState(false);
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={sp.get('tiep') || '/'} replace />;

  const run = async (fn) => { setBusy(true); setState({}); try { await fn(); } finally { setBusy(false); } };

  const login = (e) => { e.preventDefault(); run(async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setState({ error });
  }); };

  const register = (e) => { e.preventDefault(); run(async () => {
    if (!adult) return setState({ error: { message: 'Ứng dụng chỉ dành cho người từ 18 tuổi trở lên.' } });
    if (!agree) return setState({ error: { message: 'Bạn cần đồng ý quy định cộng đồng và chính sách quyền riêng tư.' } });
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { emailRedirectTo: redirectUrl('/toi'), data: { display_name: name.trim(), adult_confirmed: true } },
    });
    if (error) return setState({ error });
    if (data.session) return;
    setState({ ok: `Đã gửi thư xác minh tới ${email}. Hãy mở hộp thư (kể cả mục Spam/Quảng cáo) và bấm vào đường link để hoàn tất.` });
  }); };

  const forgot = (e) => { e.preventDefault(); run(async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl('/doi-mat-khau') });
    setState(error ? { error } : { ok: 'Đã gửi thư đặt lại mật khẩu. Hãy mở hộp thư và bấm vào đường link.' });
  }); };

  return (
    <div>
      <img className="page-logo" src={import.meta.env.BASE_URL + 'logo.png'} alt="Logo Cộng Đồng Vé Số" />
      <h1 className="center">{mode === 'login' ? 'Đăng nhập' : mode === 'register' ? 'Đăng ký thành viên' : 'Quên mật khẩu'}</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className={'btn sm ' + (mode === 'login' ? '' : 'secondary')} onClick={() => setMode('login')}>Đăng nhập</button>
        <button className={'btn sm ' + (mode === 'register' ? '' : 'secondary')} onClick={() => setMode('register')}>Đăng ký</button>
      </div>
      <form className="card" onSubmit={mode === 'login' ? login : mode === 'register' ? register : forgot}>
        {mode === 'register' && (
          <Field label="Tên hiển thị"><VoiceInput value={name} onChange={setName} required maxLength={60} autoComplete="name" /></Field>
        )}
        <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" inputMode="email" /></Field>
        {mode !== 'forgot' && (
          <Field label="Mật khẩu" hint={mode === 'register' ? 'Ít nhất 6 ký tự.' : null}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </Field>
        )}
        {mode === 'register' && (
          <>
            <label className="check"><input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />Tôi xác nhận đã đủ 18 tuổi.</label>
            <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>Tôi đồng ý <Link to="/quy-dinh">quy định cộng đồng và chính sách quyền riêng tư</Link>, và cho phép ứng dụng xử lý thông tin tôi cung cấp để kết nối cộng đồng.</span></label>
          </>
        )}
        <Msg {...state} />
        <button className="btn block" disabled={busy} style={{ marginTop: 10 }}>
          {busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : mode === 'register' ? 'Đăng ký' : 'Gửi thư đặt lại mật khẩu'}
        </button>
        {mode === 'login' && <button type="button" className="btn ghost block" style={{ marginTop: 10 }} onClick={() => setMode('forgot')}>Quên mật khẩu?</button>}
      </form>
    </div>
  );
}
