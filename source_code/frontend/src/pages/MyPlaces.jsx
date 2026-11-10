import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { getPosition } from '../lib/geo.js';
import { PROVINCES, MAP_KINDS, isValidVnPhone, normalizePhone } from '@shared/constants.js';
import { Field, Msg, VoiceInput } from '../components/ui.jsx';

const EMPTY = { kind: 'diem_ban', name: '', address: '', province: '', phone: '', open_hours: '', note: '', lat: null, lng: null };

export default function MyPlaces() {
  const { user, profile } = useAuth();
  const [list, setList] = useState([]);
  const [f, setF] = useState(null);
  const [state, setState] = useState({});

  const load = () => supabase.from('places').select('*').eq('owner_id', user.id).order('created_at').then(({ data }) => setList(data || []));
  useEffect(() => { load(); }, []);
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));

  const gps = async () => {
    const p = await getPosition();
    if (!p) return setState({ error: { message: 'Không lấy được vị trí. Hãy đứng tại điểm bán, bật GPS rồi thử lại.' } });
    setF((o) => ({ ...o, lat: p.lat, lng: p.lng })); setState({ ok: 'Đã lấy vị trí của điểm.' });
  };

  const save = async (e) => {
    e.preventDefault();
    if (f.phone && !isValidVnPhone(f.phone)) return setState({ error: { message: 'Số điện thoại chưa đúng.' } });
    if (f.lat == null) return setState({ error: { message: 'Hãy bấm "Lấy vị trí" khi đang đứng tại điểm bán.' } });
    const row = { ...f, phone: f.phone ? normalizePhone(f.phone) : null, owner_id: user.id };
    const { id, created_at, updated_at, ...data } = row;
    const { error } = id ? await supabase.from('places').update(data).eq('id', id) : await supabase.from('places').insert(data);
    if (error) return setState({ error });
    setF(null); setState({ ok: 'Đã lưu điểm.' }); load();
  };

  const del = async (id) => { if (confirm('Xóa điểm này?')) { await supabase.from('places').delete().eq('id', id); load(); } };
  const toggle = async (p) => { await supabase.from('places').update({ status: p.status === 'visible' ? 'hidden' : 'visible' }).eq('id', p.id); load(); };

  if (f) return (
    <form onSubmit={save}>
      <h1>{f.id ? 'Sửa điểm' : 'Thêm điểm'}</h1>
      <div className="chips" style={{ marginBottom: 12 }}>
        {['diem_ban', 'dai_ly'].map((k) => <button type="button" key={k} className={'chip' + (f.kind === k ? ' on' : '')} onClick={() => set('kind', k)}>{MAP_KINDS[k].icon} {MAP_KINDS[k].label}</button>)}
      </div>
      <Field label="Tên điểm"><VoiceInput value={f.name} onChange={(v) => set('name', v)} required maxLength={120} placeholder="Ví dụ: Đại lý vé số Cô Ba" /></Field>
      <Field label="Địa chỉ"><VoiceInput value={f.address || ''} onChange={(v) => set('address', v)} maxLength={200} /></Field>
      <Field label="Tỉnh/thành">
        <select value={f.province || profile?.province || ''} onChange={(e) => set('province', e.target.value)} required>
          <option value="">-- Chọn --</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}
        </select>
      </Field>
      <Field label="Số điện thoại của điểm (sẽ hiển thị công khai)"><input type="tel" value={f.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
      <Field label="Giờ mở cửa"><input type="text" value={f.open_hours || ''} onChange={(e) => set('open_hours', e.target.value)} placeholder="6:00 – 18:00" /></Field>
      <Field label="Ghi chú"><VoiceInput multiline value={f.note || ''} onChange={(v) => set('note', v)} maxLength={500} /></Field>
      <button type="button" className="btn secondary block" onClick={gps}>📍 Lấy vị trí (đứng tại điểm bán)</button>
      {f.lat != null && <p className="small muted">Vị trí: {f.lat.toFixed(5)}, {f.lng.toFixed(5)}</p>}
      <p className="small muted">Điểm bán cố định hiển thị đúng vị trí trên bản đồ để người mua tìm tới.</p>
      <Msg {...state} />
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn grow">💾 Lưu</button>
        <button type="button" className="btn ghost" onClick={() => { setF(null); setState({}); }}>Hủy</button>
      </div>
    </form>
  );

  return (
    <div>
      <h1>Điểm bán / đại lý của tôi</h1>
      <Msg {...state} />
      {list.length === 0 && <p className="muted">Bạn chưa có điểm nào. Thêm điểm để người khác tìm thấy trên bản đồ.</p>}
      {list.map((p) => (
        <div className="card" key={p.id}>
          <b>{MAP_KINDS[p.kind].icon} {p.name}</b> {p.status === 'hidden' && <span className="tag gray">Đang ẩn</span>}
          <div className="small muted">{[p.address, p.province].filter(Boolean).join(', ')}</div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn sm secondary" onClick={() => setF(p)}>Sửa</button>
            <button className="btn sm ghost" onClick={() => toggle(p)}>{p.status === 'visible' ? 'Ẩn' : 'Hiện'}</button>
            <button className="btn sm ghost" onClick={() => del(p.id)}>Xóa</button>
          </div>
        </div>
      ))}
      <button className="btn block" style={{ marginTop: 12 }} onClick={() => setF({ ...EMPTY, province: profile?.province || '', phone: profile?.phone || '' })}>➕ Thêm điểm</button>
    </div>
  );
}
