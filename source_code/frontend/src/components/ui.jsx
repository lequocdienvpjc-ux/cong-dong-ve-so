import { useState } from 'react';
import { supabase, errText } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { canListen, listen, canSpeak, speak, stopSpeak } from '../lib/voice.js';
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

// Ô nhập có nút micro để nói thay vì gõ
export function VoiceInput({ value, onChange, multiline, ...rest }) {
  const [on, setOn] = useState(false);
  const Tag = multiline ? 'textarea' : 'input';
  const start = () => {
    setOn(true);
    listen((t) => onChange((value ? value + ' ' : '') + t), () => setOn(false));
  };
  return (
    <div className="row" style={{ alignItems: 'stretch', flexWrap: 'nowrap' }}>
      <Tag className="grow" value={value} onChange={(e) => onChange(e.target.value)} type={multiline ? undefined : 'text'} {...rest} />
      {canListen() && (
        <button type="button" className="btn secondary" onClick={start} aria-label="Nói để nhập" style={{ minWidth: 56 }}>
          {on ? '…' : '🎤'}
        </button>
      )}
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
