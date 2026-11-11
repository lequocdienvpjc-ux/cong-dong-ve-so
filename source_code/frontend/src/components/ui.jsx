import { useEffect, useRef, useState } from 'react';
import { supabase, errText } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { canListen, startListening, voiceErrorText, canSpeak, speak, stopSpeak } from '../lib/voice.js';
import { REPORT_REASONS, MAP_KINDS } from '@shared/constants.js';

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <div className="small muted" style={{ fontWeight: 400, marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

// Ô nhập có nút micro để nói thay vì gõ. Chữ nói ra được thêm vào ô để người dùng xem lại, sửa trước khi gửi.
export function VoiceInput({ value, onChange, multiline, ...rest }) {
  const [on, setOn] = useState(false);
  const [status, setStatus] = useState({ text: '', err: false });
  const valRef = useRef(value);
  const stopRef = useRef(null);
  const inputRef = useRef(null);
  valRef.current = value;
  useEffect(() => () => stopRef.current?.(), []);
  useEffect(() => { if (!value) setStatus((st) => (st.err ? st : { text: '', err: false })); }, [value]);
  const Tag = multiline ? 'textarea' : 'input';
  const max = rest.maxLength || Infinity;

  const toggle = () => {
    if (on) { stopRef.current?.(); return; }
    setStatus({ text: canListen() ? '🎙️ Đang nghe… Hãy nói, nói xong bấm lại 🎤 hoặc chờ vài giây.' : '', err: false });
    setOn(true);
    stopRef.current = startListening({
      onPartial: (t) => setStatus({ text: '🎙️ ' + t, err: false }),
      onFinal: (t) => {
        const cur = valRef.current || '';
        onChange((cur ? cur.replace(/\s+$/, '') + ' ' : '') + t.slice(0, Math.max(0, max - cur.length - 1)));
        setStatus({ text: '✅ Đã nhập. Bạn có thể xem lại và sửa trước khi gửi.', err: false });
        setTimeout(() => inputRef.current?.focus(), 50);
      },
      onError: (code) => { const t = voiceErrorText(code); if (t) setStatus({ text: t, err: true }); },
      onEnd: () => { setOn(false); stopRef.current = null; },
    });
  };

  return (
    <div>
      <div className="row" style={{ alignItems: 'stretch', flexWrap: 'nowrap' }}>
        <Tag ref={inputRef} className="grow" value={value} onChange={(e) => onChange(e.target.value)} type={multiline ? undefined : 'text'} {...rest} />
        <button type="button" className={'btn secondary' + (on ? ' mic-on' : '')} onClick={toggle}
          aria-label={on ? 'Dừng nghe' : 'Bấm để nói thay vì gõ'} aria-pressed={on} style={{ minWidth: 56 }}>
          {on ? '⏹' : '🎤'}
        </button>
      </div>
      {status.text && <div className={'voice-status' + (status.err ? ' err' : '')} role="status">{status.text}</div>}
    </div>
  );
}

export function SpeakButton({ text }) {
  const [on, setOn] = useState(false);
  if (!canSpeak()) return null;
  return (
    <button type="button" className="btn sm secondary" onClick={() => {
      if (on) { stopSpeak(); setOn(false); } else { speak(text); setOn(true); setTimeout(() => setOn(false), 15000); }
    }}>{on ? '⏹ Dừng đọc' : '🔊 Đọc cho tôi nghe'}</button>
  );
}

export function Avatar({ url, kind }) {
  return <div className="av">{url ? <img src={url} alt="" /> : (MAP_KINDS[kind]?.icon || '👤')}</div>;
}

export function Msg({ error, ok }) {
  if (error) return <div className="error" role="alert">{errText(error)}</div>;
  if (ok) return <div className="ok" role="status">{ok}</div>;
  return null;
}

export function ReportButton({ type, id }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('lua_dao');
  const [detail, setDetail] = useState('');
  const [state, setState] = useState({});
  if (!user) return null;
  const send = async () => {
    const { error } = await supabase.from('reports').insert({ reporter_id: user.id, target_type: type, target_id: id, reason, detail });
    setState(error ? { error } : { ok: 'Đã gửi báo cáo. Cảm ơn bạn!' });
    if (!error) setTimeout(() => setOpen(false), 1500);
  };
  if (!open) return <button className="btn sm ghost" onClick={() => setOpen(true)}>⚠️ Báo cáo vi phạm</button>;
  return (
    <div className="card" style={{ marginTop: 10 }}>
      <Field label="Lý do">
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          {Object.entries(REPORT_REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Field>
      <Field label="Mô tả thêm (không bắt buộc)">
        <textarea value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={1000} style={{ minHeight: 80 }} />
      </Field>
      <Msg {...state} />
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn danger" onClick={send}>Gửi báo cáo</button>
        <button className="btn ghost" onClick={() => setOpen(false)}>Hủy</button>
      </div>
    </div>
  );
}

export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'vừa xong';
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}
