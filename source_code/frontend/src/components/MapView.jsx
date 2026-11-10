import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MAP_KINDS, formatKm, normalizePhone } from '@shared/constants.js';
import { PROVINCE_CENTER, VN_CENTER } from '../lib/geo.js';
import { GOOGLE_MAPS_KEY } from '../lib/supabase.js';

// =====================================================================
// Bản đồ cộng đồng: dùng Google Maps (Maps JavaScript API) khi đã cấu hình khóa;
// nếu chưa có khóa hoặc Google báo lỗi khóa/thanh toán thì TỰ ĐỘNG dùng lại
// bản đồ OpenStreetMap cũ (phương án quay lại). Dữ liệu tọa độ không thay đổi:
// cả hai nền bản đồ đều dùng cùng hệ tọa độ WGS84 (vĩ độ, kinh độ) lưu trong Supabase.
// =====================================================================

const validCoord = (lat, lng) =>
  typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) &&
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0);

export function popupHtml(i) {
  const phone = i.phone ? normalizePhone(i.phone) : '';
  return `<div style="font-size:15px;line-height:1.45;max-width:240px"><b>${esc(i.name)}</b><br>${MAP_KINDS[i.kind]?.label || ''}` +
    `${i.distance_km != null ? ' · ' + formatKm(i.distance_km) : ''}` +
    (i.address ? `<br>${esc(i.address)}` : '') +
    (phone ? `<br><a href="tel:${phone}" style="font-size:1.1em;font-weight:700">📞 Gọi ${phone}</a>` : '') +
    `<br><a href="#/thanh-vien/${i.owner_id}">Xem hồ sơ</a></div>`;
}

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Nạp Google Maps JavaScript API một lần ----------
let gmPromise = null;
function loadGoogleMaps(key) {
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (gmPromise) return gmPromise;
  gmPromise = new Promise((resolve, reject) => {
    const cb = '__cdvsGmReady';
    window[cb] = () => resolve(window.google.maps);
    // Google gọi hàm này khi khóa sai, chưa bật thanh toán hoặc tên miền không được phép
    window.gm_authFailure = () => { window.__gmAuthFailed = true; window.dispatchEvent(new Event('gm-auth-failure')); };
    const s = document.createElement('script');
    // language=vi: nhãn tiếng Việt; region=VN: hiển thị theo khu vực Việt Nam
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&language=vi&region=VN&loading=async&callback=${cb}`;
    s.async = true;
    s.onerror = () => reject(new Error('Không tải được Google Maps'));
    document.head.appendChild(s);
    setTimeout(() => reject(new Error('Google Maps tải quá lâu')), 15000);
  });
  return gmPromise;
}

function svgPin(kind) {
  const k = MAP_KINDS[kind] || MAP_KINDS.thanh_vien;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="17" fill="${k.color}" stroke="#fff" stroke-width="3"/><text x="20" y="26" font-size="17" text-anchor="middle">${k.icon}</text></svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

export default function MapView({ items, me, province }) {
  const el = useRef(null);
  const [engine, setEngine] = useState(GOOGLE_MAPS_KEY ? 'google' : 'osm');
  const [note, setNote] = useState('');
  const state = useRef({});

  // Nếu Google báo lỗi khóa/thanh toán -> chuyển về OSM
  useEffect(() => {
    const fail = () => { setNote('Google Maps chưa sẵn sàng (khóa API hoặc thanh toán) — đang dùng bản đồ dự phòng.'); setEngine('osm'); };
    window.addEventListener('gm-auth-failure', fail);
    if (window.__gmAuthFailed) fail();
    return () => window.removeEventListener('gm-auth-failure', fail);
  }, []);

  // Khởi tạo bản đồ
  useEffect(() => {
    if (!el.current) return;
    let cancelled = false;
    const s = state.current;
    if (engine === 'google') {
      loadGoogleMaps(GOOGLE_MAPS_KEY).then((gm) => {
        if (cancelled || !el.current) return;
        s.gm = gm;
        s.map = new gm.Map(el.current, {
          center: { lat: VN_CENTER[0], lng: VN_CENTER[1] }, zoom: 6,
          mapTypeControl: true, streetViewControl: false, fullscreenControl: false,
          gestureHandling: 'greedy', clickableIcons: false,
        });
        s.info = new gm.InfoWindow();
        s.markers = [];
        s.ready = true;
        draw();
      }).catch((e) => { if (!cancelled) { setNote(e.message + ' — đang dùng bản đồ dự phòng.'); setEngine('osm'); } });
    } else {
      s.map = L.map(el.current).setView(VN_CENTER, 6);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(s.map);
      s.layer = L.layerGroup().addTo(s.map);
      s.ready = true;
      draw();
    }
    return () => {
      cancelled = true;
      if (engine === 'osm') s.map?.remove();
      else { (s.markers || []).forEach((m) => m.setMap(null)); }
      state.current = {};
    };
  }, [engine]);

  useEffect(() => { draw(); }, [items, me, province, engine]);

  function draw() {
    const s = state.current;
    if (!s.ready) return;
    const pts = [];
    const valid = (items || []).filter((i) => validCoord(i.lat, i.lng));
    if (engine === 'google' && s.gm) {
      const gm = s.gm;
      s.markers.forEach((m) => m.setMap(null));
      s.markers = [];
      const bounds = new gm.LatLngBounds();
      if (me && !province) {
        const m = new gm.Marker({ position: { lat: me.lat, lng: me.lng }, map: s.map, title: 'Vị trí của bạn',
          icon: { path: gm.SymbolPath.CIRCLE, scale: 9, fillColor: '#2563eb', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 } });
        s.markers.push(m); bounds.extend(m.getPosition()); pts.push(1);
      }
      valid.forEach((i) => {
        const m = new gm.Marker({ position: { lat: i.lat, lng: i.lng }, map: s.map, title: i.name,
          icon: { url: svgPin(i.kind), scaledSize: new gm.Size(40, 40), anchor: new gm.Point(20, 20) } });
        m.addListener('click', () => { s.info.setContent(popupHtml(i)); s.info.open({ map: s.map, anchor: m }); });
        s.markers.push(m); bounds.extend(m.getPosition()); pts.push(1);
      });
      if (pts.length > 1) { s.map.fitBounds(bounds, 40); gm.event.addListenerOnce(s.map, 'idle', () => { if (s.map.getZoom() > 15) s.map.setZoom(15); }); }
      else if (pts.length === 1) { s.map.setCenter(bounds.getCenter()); s.map.setZoom(14); }
      else if (province && PROVINCE_CENTER[province]) { s.map.setCenter({ lat: PROVINCE_CENTER[province][0], lng: PROVINCE_CENTER[province][1] }); s.map.setZoom(11); }
    } else if (engine === 'osm' && s.layer) {
      s.layer.clearLayers();
      const ll = [];
      if (me && !province) {
        L.marker([me.lat, me.lng], { icon: L.divIcon({ className: '', html: '<div class="me-pin"></div>', iconSize: [22, 22] }) })
          .bindPopup('Vị trí của bạn').addTo(s.layer);
        ll.push([me.lat, me.lng]);
      }
      valid.forEach((i) => {
        const k = MAP_KINDS[i.kind] || MAP_KINDS.thanh_vien;
        L.marker([i.lat, i.lng], { icon: L.divIcon({ className: '', html: `<div class="pin" style="background:${k.color}">${k.icon}</div>`, iconSize: [38, 38], iconAnchor: [19, 19] }) })
          .bindPopup(popupHtml(i)).addTo(s.layer);
        ll.push([i.lat, i.lng]);
      });
      if (ll.length > 1) s.map.fitBounds(ll, { padding: [30, 30], maxZoom: 15 });
      else if (ll.length === 1) s.map.setView(ll[0], 14);
      else if (province && PROVINCE_CENTER[province]) s.map.setView(PROVINCE_CENTER[province], 11);
    }
  }

  const skipped = (items || []).length - (items || []).filter((i) => validCoord(i.lat, i.lng)).length;
  return (
    <div>
      <div key={engine} ref={el} className="map" role="application" aria-label="Bản đồ cộng đồng" />
      {note && <p className="small muted" style={{ marginTop: 6 }}>{note}</p>}
      {skipped > 0 && <p className="small muted">{skipped} mục chưa có vị trí hợp lệ nên chỉ hiện trong Danh sách.</p>}
      <p className="small muted" style={{ marginTop: 4 }}>Nền bản đồ: {engine === 'google' ? 'Google Maps' : 'OpenStreetMap'}</p>
    </div>
  );
}
