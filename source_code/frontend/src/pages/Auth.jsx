import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { supabase, redirectUrl } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { phoneAuthEnabled, sendPhoneOtp, verifyPhoneOtp } from '../lib/phoneAuth.js';
import { Field, Msg, SpeakButton, VoiceInput } from '../components/ui.jsx';
import { FOUNDER } from '../components/Founder.jsx';

const RESEND_SECONDS = 60;

const ASSIST_GUIDE =
  'Hướng dẫn đăng ký hỗ trợ. Hãy nhập thông tin của chính người sẽ sử dụng tài khoản: tên, email hoặc số điện thoại của họ. ' +
  'Mã xác minh sẽ gửi về email hoặc điện thoại của người đó. Tài khoản thuộc về người sử dụng; người thao tác giúp không giữ mật khẩu hay mã để tự dùng. ' +
  'Không cần khai báo loại khuyết tật. Người được hỗ trợ vẫn tự quyết định việc tham gia.';

const UNDER18_TEXT =
  'Hiện ứng dụng chưa có cách xác nhận người giám hộ trực tuyến, nên chưa thể tự hoàn tất đăng ký cho người dưới 18 tuổi. ' +
  'Người giám hộ hợp pháp vui lòng liên hệ người sáng lập để được hướng dẫn.';

// ---------- Điều kiện độ tuổi ----------
function AgeChoice({ value, onChange }) {
  return (
    <fieldset className="choice-box">
      <legend>Điều kiện tham gia</legend>
      <p className="small" style={{ margin: '0 0 6px' }}>
        Người dùng từ đủ 18 tuổi có thể tự đăng ký và sử dụng ứng dụng. Người dưới 18 tuổi chỉ được tham gia khi có sự đồng ý,
        hỗ trợ hoặc giám hộ hợp pháp theo quy định pháp luật áp dụng.
      </p>
      <label className="check"><input type="radio" name="age" checked={value === 'adult'} onChange={() => onChange('adult')} />Tôi đã đủ 18 tuổi.</label>
      <label className="check"><input type="radio" name="age" checked={value === 'minor'} onChange={() => onChange('minor')} />
        <span>Tôi chưa đủ 18 tuổi và có người giám hộ hợp pháp đồng ý/hỗ trợ theo quy định.</span></label>
      {value === 'minor' && (
        <div className="notice" role="status">
          <p style={{ margin: '0 0 6px' }}>{UNDER18_TEXT}</p>
          <div className="row">
            {FOUNDER.phones.map((p) => <a key={p} className="btn sm secondary" href={`tel:${p}`}>📞 {p}</a>)}
            <a className="btn sm secondary" href={`mailto:${FOUNDER.email}`}>✉️ Gửi email</a>
          </div>
        </div>
      )}
    </fieldset>
  );
}

// ---------- Đăng ký hỗ trợ cho người khuyết tật ----------
function AssistBox({ a, setA }) {
  const set = (k, v) => setA((o) => ({ ...o, [k]: v }));
  return (
    <div className="choice-box">
      <label className="check"><input type="checkbox" checked={a.on} onChange={(e) => set('on', e.target.checked)} />
        <span>Tôi đang thao tác hoặc đăng ký thay cho người khuyết tật cần hỗ trợ.</span></label>
      {a.on && (
        <div className="assist-guide">
          <p style={{ margin: '0 0 6px' }}><b>Hướng dẫn đăng ký hỗ trợ</b></p>
          <SpeakButton label="Đọc hướng dẫn" text={ASSIST_GUIDE} />
          <ul className="small" style={{ margin: '6px 0' }}>
            <li>Nhập <b>thông tin của chính người sẽ dùng tài khoản</b> (tên, email hoặc số điện thoại của họ). Mã xác minh gửi về cho họ.</li>
            <li>Tài khoản thuộc về người sử dụng. Người thao tác giúp <b>không</b> giữ mật khẩu hay mã để tự dùng tài khoản.</li>
            <li><b>Không cần</b> khai báo loại khuyết tật. Người được hỗ trợ vẫn tự quyết định việc tham gia.</li>
            <li>Nếu người cần hỗ trợ không thể tự thao tác và không có người thân giúp, vui lòng liên hệ người sáng lập để được hướng dẫn.</li>
          </ul>
          <Field label="Họ tên người đang thao tác giúp (không bắt buộc)">
            <VoiceInput value={a.helper} onChange={(v) => set('helper', v)} maxLength={60} autoComplete="off" />
          </Field>
          <Field label="Quan hệ với người sử dụng tài khoản">
            <select value={a.relation} onChange={(e) => set('relation', e.target.value)}>
              <option value="nguoi_than">Người thân trong gia đình</option>
              <option value="ban_be">Bạn bè, hàng xóm</option>
              <option value="nguoi_ho_tro">Người hỗ trợ khác / người được ủy quyền</option>
            </select>
          </Field>
          <label className="check"><input type="checkbox" checked={a.consent} onChange={(e) => set('consent', e.target.checked)} />
            <span>Người sử dụng tài khoản (hoặc người đại diện hợp pháp của họ khi cần) <b>đã đồng ý</b> cho tôi giúp đăng ký, và tài khoản này thuộc về họ.</span></label>
        </div>
      )}
    </div>
  );
}

const emptyAssist = { on: false, helper: '', relation: 'nguoi_than', consent: false };

// Thông tin ghi kèm tài khoản (user metadata). Không ghi loại khuyết tật, không ghi giấy tờ.
function signupMeta(name, assist, method) {
  const meta = { display_name: name.trim(), adult_confirmed: true, signup_method: method, age_confirmation: 'adult_18_plus' };
  if (assist.on) {
    meta.assisted_signup = {
      type: 'nguoi_than_ho_tro',
      relation: assist.relation,
      helper_name: assist.helper.trim() || null,
      user_consent_confirmed: true,
      at: new Date().toISOString(),
    };
  }
  return meta;
}

function checkRegister(age, agree, assist) {
  if (age !== 'adult') return age === 'minor' ? UNDER18_TEXT : 'Vui lòng chọn điều kiện độ tuổi.';
  if (assist.on && !assist.consent) return 'Cần xác nhận người sử dụng tài khoản đã đồng ý cho bạn giúp đăng ký.';
  if (!agree) return 'Bạn cần đồng ý quy định cộng đồng và chính sách quyền riêng tư.';
  return null;
}

// ---------- Đăng nhập / đăng ký bằng số điện thoại ----------
function PhoneForm({ mode, name, age, agree, assist, extra }) {
  const [available, setAvailable] = useState(null);
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone'); // phone | code
  const [e164, setE164] = useState('');
  const [code, setCode] = useState('');
  const [wait, setWait] = useState(0);
  const [state, setState] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { phoneAuthEnabled().then(setAvailable); }, []);
  useEffect(() => { if (wait <= 0) return undefined; const t = setTimeout(() => setWait((w) => w - 1), 1000); return () => clearTimeout(t); }, [wait]);

  const send = async (e) => {
    e?.preventDefault();
    setState({});
    if (mode === 'register') {
      const msg = checkRegister(age, agree, assist);
      if (msg) return setState({ error: { message: msg } });
      if (!name.trim()) return setState({ error: { message: 'Vui lòng nhập tên hiển thị.' } });
    }
    setBusy(true);
    const r = await sendPhoneOtp(phone, { createUser: mode === 'register', data: signupMeta(name, assist, 'phone') });
    setBusy(false);
    if (r.error) return setState({ error: r.error });
    setE164(r.e164); setStep('code'); setCode(''); setWait(RESEND_SECONDS);
    setState({ ok: `Đã gửi mã xác minh 6 số tới ${phone}. Mã chỉ có hiệu lực trong thời gian ngắn.` });
  };

  const verify = async (e) => {
    e.preventDefault();
    setBusy(true); setState({});
    const { error } = await verifyPhoneOtp(e164, code);
    setBusy(false);
    if (error) setState({ error });
    // Thành công: Supabase tạo phiên đăng nhập, trang tự chuyển đi.
  };

  if (available === null) return <div className="card"><p className="muted">Đang kiểm tra…</p></div>;
  if (!available) {
    return (
      <div className="card">
        <div className="notice" role="status">
          📱 <b>Đăng ký/đăng nhập bằng số điện thoại đang hoàn thiện</b> và <b>chưa sử dụng được</b>.
          Vui lòng dùng <b>Email</b> trong lúc chờ. Chúng tôi sẽ thông báo khi chức năng này hoạt động.
        </div>
      </div>
    );
  }

  return step === 'phone' ? (
    <form className="card" onSubmit={send}>
      {extra}
      <Field label="Số điện thoại" hint={mode === 'register' ? 'Số điện thoại của người sẽ sử dụng tài khoản. Hệ thống gửi mã xác minh qua tin nhắn.' : 'Hệ thống gửi mã xác minh qua tin nhắn.'}>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" autoComplete="tel" placeholder="Ví dụ: 0912345678" />
      </Field>
      <Msg {...state} />
      <button className="btn block" disabled={busy || wait > 0} style={{ marginTop: 10 }}>
        {busy ? 'Đang gửi…' : wait > 0 ? `Gửi lại sau ${wait} giây` : '📩 Gửi mã xác minh'}
      </button>
    </form>
  ) : (
    <form className="card" onSubmit={verify}>
      <Field label="Nhập mã xác minh (6 số)">
        <input className="otp-input" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
          required inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" aria-label="Mã xác minh" />
      </Field>
      <Msg {...state} />
      <button className="btn block" disabled={busy} style={{ marginTop: 10 }}>{busy ? 'Đang kiểm tra…' : '✅ Xác minh'}</button>
      <div className="row" style={{ marginTop: 10 }}>
        <button type="button" className="btn ghost grow" onClick={() => { setStep('phone'); setState({}); }}>← Đổi số</button>
        <button type="button" className="btn secondary grow" disabled={busy || wait > 0} onClick={send}>
          {wait > 0 ? `Gửi lại mã (${wait}s)` : '🔁 Gửi lại mã'}
        </button>
      </div>
    </form>
  );
}

export default function Auth() {
  const [sp] = useSearchParams();
  const { user } = useAuth();
  const [mode, setMode] = useState(sp.get('dk') ? 'register' : 'login');
  const [method, setMethod] = useState('email'); // email | phone
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [agree, setAgree] = useState(false);
  const [assist, setAssist] = useState(emptyAssist);
  const [state, setState] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={sp.get('tiep') || '/'} replace />;

  const run = async (fn) => { setBusy(true); setState({}); try { await fn(); } finally { setBusy(false); } };

  const login = (e) => { e.preventDefault(); run(async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setState({ error });
  }); };

  const register = (e) => { e.preventDefault(); run(async () => {
    const msg = checkRegister(age, agree, assist);
    if (msg) return setState({ error: { message: msg } });
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { emailRedirectTo: redirectUrl('/toi'), data: signupMeta(name, assist, 'email') },
    });
    if (error) return setState({ error });
    if (data.session) return;
    setState({ ok: `Đã gửi thư xác minh tới ${email}. Hãy mở hộp thư (kể cả mục Spam/Quảng cáo) và bấm vào đường link để hoàn tất.` });
  }); };

  const forgot = (e) => { e.preventDefault(); run(async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl('/doi-mat-khau') });
    setState(error ? { error } : { ok: 'Đã gửi thư đặt lại mật khẩu. Hãy mở hộp thư và bấm vào đường link.' });
  }); };

  const switchMode = (m) => { setMode(m); setState({}); };
  const reg = mode === 'register';
  const minorBlocked = reg && age === 'minor';

  // Phần đăng ký dùng chung cho email và số điện thoại
  const registerTop = reg && (
    <>
      <AssistBox a={assist} setA={setAssist} />
      <Field label={assist.on ? 'Tên hiển thị của người sử dụng tài khoản' : 'Tên hiển thị'}>
        <VoiceInput value={name} onChange={setName} required maxLength={60} autoComplete="name" />
      </Field>
    </>
  );
  const registerBottom = reg && (
    <>
      <AgeChoice value={age} onChange={setAge} />
      <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>Tôi đồng ý <Link to="/quy-dinh">quy định cộng đồng và chính sách quyền riêng tư</Link>, và cho phép ứng dụng xử lý thông tin tôi cung cấp để kết nối cộng đồng.</span></label>
    </>
  );

  return (
    <div>
      <img className="page-logo" src={import.meta.env.BASE_URL + 'logo.png'} alt="Logo Cộng Đồng Mưu Sinh" />
      <h1 className="center">{mode === 'login' ? 'Đăng nhập' : reg ? 'Đăng ký thành viên' : 'Quên mật khẩu'}</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className={'btn sm ' + (mode === 'login' ? '' : 'secondary')} onClick={() => switchMode('login')}>Đăng nhập</button>
        <button className={'btn sm ' + (reg ? '' : 'secondary')} onClick={() => switchMode('register')}>Đăng ký</button>
      </div>

      {mode !== 'forgot' && (
        <div className="method-tabs" role="tablist" aria-label="Cách đăng nhập">
          <button type="button" role="tab" aria-selected={method === 'email'} className={method === 'email' ? 'on' : ''} onClick={() => { setMethod('email'); setState({}); }}>✉️ Bằng email</button>
          <button type="button" role="tab" aria-selected={method === 'phone'} className={method === 'phone' ? 'on' : ''} onClick={() => { setMethod('phone'); setState({}); }}>📱 Bằng số điện thoại</button>
        </div>
      )}

      {method === 'phone' && mode !== 'forgot' ? (
        <>
          {reg && (
            <form className="card" onSubmit={(e) => e.preventDefault()}>
              {registerTop}
              {registerBottom}
            </form>
          )}
          {!minorBlocked && <PhoneForm mode={mode} name={name} age={age} agree={agree} assist={assist} />}
          {reg && <p className="small muted" style={{ marginTop: 8 }}>Đã có tài khoản bằng email? Hãy đăng nhập bằng email rồi thêm số điện thoại trong <b>Hồ sơ của tôi</b>, để không tạo 2 tài khoản.</p>}
        </>
      ) : (
        <form className="card" onSubmit={mode === 'login' ? login : reg ? register : forgot}>
          {registerTop}
          <Field label={assist.on && reg ? 'Email của người sử dụng tài khoản' : 'Email'}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" inputMode="email" />
          </Field>
          {mode !== 'forgot' && (
            <Field label="Mật khẩu" hint={reg ? 'Ít nhất 6 ký tự.' : null}>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </Field>
          )}
          {registerBottom}
          <Msg {...state} />
          <button className="btn block" disabled={busy || minorBlocked} style={{ marginTop: 10 }}>
            {busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : reg ? 'Đăng ký' : 'Gửi thư đặt lại mật khẩu'}
          </button>
          {mode === 'login' && <button type="button" className="btn ghost block" style={{ marginTop: 10 }} onClick={() => setMode('forgot')}>Quên mật khẩu?</button>}
        </form>
      )}
    </div>
  );
}
