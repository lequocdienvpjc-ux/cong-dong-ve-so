import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { PROVINCES, ROLES } from '@shared/constants.js';
import { VoiceInput } from '../components/ui.jsx';
import { ResultCard } from './MapPage.jsx';

const roleToKind = (roles = [], need) => need === 'can_ho_tro' ? 'can_ho_tro' : need === 'muon_ho_tro' ? 'muon_ho_tro'
  : roles.includes('ban_dao') ? 'ban_dao' : roles.includes('ban_co_dinh') ? 'ban_co_dinh'
  : (roles.includes('dai_ly_lon') || roles.includes('dai_ly_cap_duoi')) ? 'dai_ly' : 'thanh_vien';

export default function Search() {
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') || '');
  const [province, setProvince] = useState(sp.get('tinh') || '');
  const [role, setRole] = useState(sp.get('vt') || '');
  const [res, setRes] = useState(null);

  useEffect(() => {
    const term = (sp.get('q') || '').trim().replace(/[%,()]/g, ' ');
    const prov = sp.get('tinh') || '';
    const vt = sp.get('vt') || '';
    let a = supabase.from('public_profiles').select('*').limit(60);
    let b = supabase.from('places').select('*').eq('status', 'visible').limit(60);
    if (term) {
      a = a.or(`display_name.ilike.%${term}%,ward.ilike.%${term}%,area_note.ilike.%${term}%,province.ilike.%${term}%`);
      b = b.or(`name.ilike.%${term}%,address.ilike.%${term}%,province.ilike.%${term}%`);
    }
    if (prov) { a = a.eq('province', prov); b = b.eq('province', prov); }
    if (vt) a = a.contains('roles', [vt]);
    Promise.all([a, vt ? Promise.resolve({ data: [] }) : b]).then(([pa, pb]) => {
      const people = (pa.data || []).map((p) => ({ item_type: 'member', id: p.id, owner_id: p.id, kind: roleToKind(p.roles, p.need_status),
        name: p.display_name, phone: p.phone, address: [p.ward, p.area_note].filter(Boolean).join(', '), province: p.province }));
      const places = (pb.data || []).map((p) => ({ item_type: 'place', id: p.id, owner_id: p.owner_id, kind: p.kind,
        name: p.name, phone: p.phone, address: p.address, province: p.province }));
      setRes([...places, ...people]);
    });
  }, [sp]);

  const submit = (e) => {
    e.preventDefault();
    const n = new URLSearchParams();
    if (q) n.set('q', q); if (province) n.set('tinh', province); if (role) n.set('vt', role);
    setSp(n);
  };

  return (
    <div>
      <h1>Tìm kiếm</h1>
      <form onSubmit={submit} className="stack">
        <VoiceInput value={q} onChange={setQ} placeholder="Tên, phường/xã, khu vực…" aria-label="Từ khóa" />
        <div className="row">
          <select value={province} onChange={(e) => setProvince(e.target.value)} style={{ flex: 1 }} aria-label="Tỉnh/thành">
            <option value="">Mọi tỉnh/thành</option>
            {PROVINCES.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ flex: 1 }} aria-label="Loại thành viên">
            <option value="">Mọi loại</option>
            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button className="btn block" type="submit">🔍 Tìm</button>
      </form>
      <div style={{ marginTop: 14 }}>
        {res === null ? <p className="muted">Đang tìm…</p> : res.length === 0 ? <p className="muted">Không tìm thấy kết quả.</p>
          : res.map((i) => <ResultCard key={i.item_type + i.id} i={i} />)}
      </div>
    </div>
  );
}
