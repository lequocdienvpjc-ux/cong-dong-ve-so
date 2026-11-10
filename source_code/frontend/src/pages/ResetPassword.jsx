import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { Field, Msg } from '../components/ui.jsx';

export default function ResetPassword() {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [state, setState] = useState({});
  const { setRecovery } = useAuth();
  const nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    if (pw !== pw2) return setState({ error: { message: 'Hai mật khẩu không giống nhau.' } });
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setState({ error });
    setState({ ok: 'Đã đổi mật khẩu thành công.' });
    setTimeout(() => { setRecovery(false); nav('/toi'); }, 1200);
  };
  return (
    <form className="card" onSubmit={submit}>
      <h1>Đặt mật khẩu mới</h1>
      <Field label="Mật khẩu mới"><input type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field>
      <Field label="Nhập lại mật khẩu"><input type="password" minLength={6} required value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></Field>
      <Msg {...state} />
      <button className="btn block" style={{ marginTop: 10 }}>Lưu mật khẩu</button>
    </form>
  );
}
