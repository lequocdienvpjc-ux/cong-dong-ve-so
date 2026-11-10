import { useEffect, useState } from 'react';
import { supabase, APP_VERSION } from '../lib/supabase.js';

// So sánh phiên bản dạng 1.2.3
export function newer(a = '0', b = '0') {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

export const isNativeApp = () => Boolean(window.Capacitor?.isNativePlatform?.());

export default function UpdateBanner() {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    if (!isNativeApp()) return;
    supabase.from('public_config').select('android_version, android_apk_url').maybeSingle().then(({ data }) => {
      if (data?.android_version && data.android_apk_url && newer(data.android_version, APP_VERSION)) setInfo(data);
    });
  }, []);
  if (!info) return null;
  return (
    <div className="notice" style={{ borderRadius: 0, borderWidth: '0 0 2px' }}>
      Có phiên bản mới {info.android_version}.{' '}
      <a className="btn sm green" href={info.android_apk_url} target="_blank" rel="noreferrer">⬇️ Cập nhật</a>
    </div>
  );
}
