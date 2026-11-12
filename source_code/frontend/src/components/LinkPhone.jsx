import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { phoneAuthEnabled, startLinkPhone, confirmLinkPhone } from '../lib/phoneAuth.js';
import { Field, Msg } from './ui.jsx';

// Gắn số điện thoại đăng nhập vào tài khoản hiện có (xác minh bằng mã OTP),
// để một người không phải tạo 2 tài khoản (email và điện thoại).
// Không dùng thẻ <form> vì nằm trong form Hồ sơ.
export default function LinkPhone() {
  const { user } = useAuth();
  const [available, setAvailable] = useState(null);
  const [phone, setPhone] = useState('');
  const [e164, setE164] = useState('');
  const [code, setCode] = useState('');
  const [state, setState] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { phoneAuthEnabled().then(setAvailable); }, []);

  if (user?.phone) {
    return <div className="card small">📱 Số điện thoại đăng nhập: <b>+{user.phone}</b> (đã xác minh).</div>;
  }
  if (available === null) return null;
  if (!available) {
    return <div className="card small muted">📱 Đăng nhập bằng số điện thoại đang hoàn thiện, chưa sử dụng được.</div>;
  }

  const send = async () => {
    setBusy(true); setState({});
    const r = await startLinkPhone(phone);
    setBusy(false);
    if (r.error) return setState({ error: r.error });
    setE164(r.e164);
    setState({ ok: 'Đã gửi mã xác minh tới số điện thoại. Nhập mã bên dưới.' });
  };
  const confirm = async () => {
    setBusy(true); setState({});
    const { error } = await confirmLinkPhone(e164, code);
    setBusy(false);
    setState(error ? { error } : { ok: 'Đã gắn số điện thoại. Lần sau có thể đăng nhập bằng số này.' });
  };

  return (
    <div className="card">
      <b>📱 Thêm số điện thoại để đăng nhập</b>
      <p className="small muted" style={{ margin: '4px 0 8px' }}>Số này chỉ dùng để đăng nhập, không hiện cho người khác.</p>
      {!e164 ? (
        <>
          <Field label="Số điện thoại"><input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912345678" /></Field>
          <button type="button" className="btn secondary block" disabled={busy || !phone} onClick={send}>📩 Gửi mã xác minh</button>
        </>
      ) : (
        <>
          <Field label="Mã xác minh (6 số)"><input className="otp-input" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 10))} /></Field>
          <button type="button" className="btn block" disabled={busy || code.length < 6} onClick={confirm}>✅ Xác minh</button>
        </>
      )}
      <Msg {...state} />
    </div>
  );
}
