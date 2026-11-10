import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import { supabase, errText } from '../lib/supabase.js';
import { getPosition, PROVINCE_CENTER, VN_CENTER } from '../lib/geo.js';
import { MAP_KINDS, PROVINCES, formatKm, normalizePhone } from '@shared/constants.js';
import { Avatar } from '../components/ui.jsx';

// Nhóm bộ lọc hiển thị cho người dùng
const FILTERS = {
  '': { label: 'Tất cả', kinds: null },
  dai_ly: { label: 'Đại lý', kinds: ['dai_ly'] },
  nguoi_ban: { label: 'Người bán', kinds: ['ban_dao', 'ban_co_dinh'] },
  diem_ban: { label: 'Điểm bán', kinds: ['diem_ban', 'ban_co_dinh'] },
  can_ho_tro: { label: 'Cần hỗ trợ', kinds: ['can_ho_tro'] },
  muon_ho_tro: { label: 'Muốn hỗ trợ', kinds: ['muon_ho_tro'] },
};
const RADII = [2, 5, 10, 20, 50];

function pinIcon(kind) {
  const k = MAP_KINDS[kind] || MAP_KINDS.thanh_vien;
  return L.divIcon({ className: '', html: `<div class="pin" style="background:${k.color}">${k.icon}</div>`, iconSize: [38, 38], iconAnchor: [19, 19] });
}

export default function MapPage() {
  const [sp, setSp] = useSearchParams();
  const filter = sp.get('loai') || '';
  const [view, setView] = useState(sp.get('xem') || 'map');
  const [radius, setRadius] = useState(10);
  const [province, setProvince] = useState('');
  const [me, setMe] = useState(null);
  const [gpsAsked, setGpsAsked] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const mapEl = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);

  useEffect(() => {
    getPosition().then((p) => { setMe(p); setGpsAsked(true); });
  }, []);

  useEffect(() => {
    if (!gpsAsked) return;
    let alive = true;
    setLoading(true);
    const useGps = me && !province;
    supabase.rpc('nearby', {
      p_lat: useGps ? me.lat : null, p_lng: useGps ? me.lng : null, p_radius_km: radius,
      p_kind: null, p_province: province || null, p_limit: 300,
    }).then(({ data, error }) => {
      if (!alive) return;
      setLoading(false);
      if (error) { setError(errText(error)); return; }
      setError('');
      setItems(data || []);
    });
    return () => { alive = false; };
  }, [me, radius, province, gpsAsked]);

  const shown = useMemo(() => {
    const ks = FILTERS[filter]?.kinds;
    return ks ? items.filter((i) => ks.includes(i.kind)) : items;
  }, [items, filter]);

  // Khởi tạo bản đồ
  useEffect(() => {
    if (view !== 'map' || !mapEl.current || map.current) return;
    map.current = L.map(mapEl.current, { zoomControl: true }).setView(VN_CENTER, 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; };
  }, [view]);

  // Vẽ điểm
  useEffect(() => {
    if (view !== 'map' || !map.current) return;
    layer.current.clearLayers();
    const pts = [];
    if (me && !province) {
      L.marker([me.lat, me.lng], { icon: L.divIcon({ className: '', html: '<div class="me-pin"></div>', iconSize: [22, 22] }) })
        .bindPopup('Vị trí của bạn').addTo(layer.current);
      pts.push([me.lat, me.lng]);
    }
    shown.forEach((i) => {
      if (i.lat == null) return;
      const phone = i.phone ? normalizePhone(i.phone) : '';
      const html = `<b>${escapeHtml(i.name)}</b><br>${MAP_KINDS[i.kind]?.label || ''}${i.distance_km != null ? ' · ' + formatKm(i.distance_km) : ''}` +
        (i.address ? `<br>${escapeHtml(i.address)}` : '') +
        (phone ? `<br><a href="tel:${phone}" style="font-size:1.1em;font-weight:700">📞 Gọi ${phone}</a>` : '') +
        `<br><a href="#/thanh-vien/${i.owner_id}">Xem hồ sơ</a>`;
      L.marker([i.lat, i.lng], { icon: pinIcon(i.kind) }).bindPopup(html).addTo(layer.current);
      pts.push([i.lat, i.lng]);
    });
    if (pts.length > 1) map.current.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
    else if (pts.length === 1) map.current.setView(pts[0], 14);
    else if (province && PROVINCE_CENTER[province]) map.current.setView(PROVINCE_CENTER[province], 11);
  }, [shown, me, province, view]);

  const setFilter = (k) => { const n = new URLSearchParams(sp); if (k) n.set('loai', k); else n.delete('loai'); setSp(n, { replace: true }); };

  return (
    <div>
      <h1>{filter === 'dai_ly' ? 'Đại lý gần tôi' : filter === 'nguoi_ban' ? 'Người bán gần tôi' : filter === 'diem_ban' ? 'Điểm bán gần tôi' : 'Bản đồ cộng đồng'}</h1>

      <div className="tabs" role="tablist" aria-label="Loại">
        {Object.entries(FILTERS).map(([k, v]) => (
          <button key={k} className={'chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{v.label}</button>
        ))}
      </div>

      <div className="row" style={{ margin: '10px 0' }}>
        <select value={province} onChange={(e) => setProvince(e.target.value)} aria-label="Tỉnh/thành" style={{ flex: 2 }}>
          <option value="">{me ? 'Gần vị trí của tôi' : 'Chọn tỉnh/thành'}</option>
          {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {me && !province && (
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} aria-label="Khoảng cách" style={{ flex: 1 }}>
            {RADII.map((r) => <option key={r} value={r}>Trong {r} km</option>)}
          </select>
        )}
      </div>

      {gpsAsked && !me && !province && (
        <div className="notice" style={{ marginBottom: 10 }}>
          Chưa lấy được vị trí. Hãy bật định vị (GPS) và cho phép ứng dụng dùng vị trí, hoặc chọn tỉnh/thành ở trên.
          <div style={{ marginTop: 8 }}><button className="btn sm" onClick={() => getPosition().then(setMe)}>📍 Thử lại</button></div>
        </div>
      )}
      {error && <div className="error">{error}</div>}

      <div className="row" style={{ marginBottom: 10 }}>
        <button className={'btn sm ' + (view === 'map' ? '' : 'secondary')} onClick={() => setView('map')}>🗺️ Bản đồ</button>
        <button className={'btn sm ' + (view === 'list' ? '' : 'secondary')} onClick={() => setView('list')}>📋 Danh sách ({shown.length})</button>
        {loading && <span className="muted small">Đang tải…</span>}
      </div>

      {view === 'map' ? <div ref={mapEl} className="map" /> : (
        <div>
          {shown.length === 0 && !loading && <p className="muted">Chưa có ai trong khu vực này. Hãy mở rộng khoảng cách hoặc chọn tỉnh khác.</p>}
          {shown.map((i) => <ResultCard key={i.item_type + i.id} i={i} />)}
        </div>
      )}
      <p className="footer-note">Vị trí thành viên được làm tròn khoảng 100–500 m để bảo vệ quyền riêng tư. Thông tin do thành viên tự khai.</p>
    </div>
  );
}

export function ResultCard({ i }) {
  const phone = i.phone ? normalizePhone(i.phone) : '';
  return (
    <div className="card list-item">
      <Avatar kind={i.kind} />
      <div className="grow">
        <div className="name">{i.name}</div>
        <div className="small muted">
          <span className="tag">{MAP_KINDS[i.kind]?.label || 'Thành viên'}</span>
          {i.distance_km != null && <b> {formatKm(i.distance_km)}</b>}
          {i.address && <> · {i.address}</>}{i.province && <> · {i.province}</>}
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          {phone && <a className="btn sm call" href={`tel:${phone}`}>📞 Gọi</a>}
          <Link className="btn sm secondary" to={`/thanh-vien/${i.owner_id}`}>Xem hồ sơ</Link>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
