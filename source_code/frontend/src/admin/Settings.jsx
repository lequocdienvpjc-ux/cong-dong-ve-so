import { useEffect, useState } from 'react';
import { supabase, errText } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';

const BACKUP_TABLES = ['app_config', 'profiles', 'places', 'posts', 'comments', 'connections', 'reports', 'banned_words', 'admin_audit'];

async function exportAll(setMsg) {
  setMsg('Đang sao lưu…');
  const out = { exported_at: new Date().toISOString(), app: 'cong-dong-ve-so', tables: {} };
  for (const t of BACKUP_TABLES) {
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from(t).select('*').range(from, from + 999);
      if (error) { setMsg(`Lỗi khi sao lưu bảng ${t}: ${errText(error)}`); return; }
      rows.push(...data);
      if (data.length < 1000) break;
    }
    out.tables[t] = rows;
  }
  const blob = new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `cong-dong-ve-so-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  await supabase.rpc('log_admin', { p_action: 'export_backup', p_target: 'all', p_detail: Object.fromEntries(Object.entries(out.tables).map(([k, v]) => [k, v.length])) });
  setMsg('Đã tải bản sao lưu.');
}

export default function Settings() {
  const { isAdmin } = useAuth();
  const [cfg, setCfg] = useState(null);
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [bc, setBc] = useState({ title: '', body: '' });
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data } = await supabase.from('app_config').select('*').eq('id', 1).maybeSingle();
    setCfg(data);
    const { data: w } = await supabase.from('banned_words').select('word').order('word');
    setWords((w || []).map((x) => x.word));
  };
  useEffect(() => { load(); }, []);
  if (!cfg) return <p>Đang tải…</p>;

  const save = async () => {
    const { announcement, android_version, android_apk_url, registration_open } = cfg;
    const { error } = await supabase.from('app_config').update({ announcement, android_version, android_apk_url, registration_open }).eq('id', 1);
    if (!error) await supabase.rpc('log_admin', { p_action: 'update_config', p_target: 'app_config', p_detail: { android_version, registration_open } });
    setMsg(error ? errText(error) : 'Đã lưu cấu hình.');
  };
  const addWord = async () => {
    const w = newWord.trim().toLowerCase(); if (!w) return;
    const { error } = await supabase.from('banned_words').insert({ word: w });
    setMsg(error ? errText(error) : 'Đã thêm từ khóa.'); setNewWord(''); load();
  };
  const delWord = async (w) => { await supabase.from('banned_words').delete().eq('word', w); load(); };
  const broadcast = async () => {
    if (!bc.title.trim() || !confirm('Gửi thông báo tới toàn bộ thành viên?')) return;
    const { data, error } = await supabase.rpc('broadcast', { p_title: bc.title.trim(), p_body: bc.body.trim() || null });
    setMsg(error ? errText(error) : `Đã gửi tới ${data} thành viên.`); setBc({ title: '', body: '' });
  };
  const ro = !isAdmin;

  return (
    <div style={{ maxWidth: 760 }}>
      <h1>Cấu hình hệ thống</h1>
      {msg && <div className="notice">{msg}</div>}
      {ro && <p className="muted">Kiểm duyệt viên chỉ được xem cấu hình.</p>}
      <div className="card">
        <label className="field"><span>Thông báo hiển thị đầu ứng dụng (để trống nếu không có)</span>
          <textarea disabled={ro} value={cfg.announcement || ''} onChange={(e) => setCfg({ ...cfg, announcement: e.target.value })} style={{ minHeight: 70 }} /></label>
        <label className="check"><input disabled={ro} type="checkbox" checked={cfg.registration_open} onChange={(e) => setCfg({ ...cfg, registration_open: e.target.checked })} />Đang mở đăng ký thành viên mới (hiển thị)</label>
        <div className="row">
          <label className="field grow"><span>Phiên bản Android mới nhất</span>
            <input disabled={ro} type="text" value={cfg.android_version || ''} onChange={(e) => setCfg({ ...cfg, android_version: e.target.value })} /></label>
          <label className="field" style={{ flex: 3 }}><span>Link tải APK</span>
            <input disabled={ro} type="text" value={cfg.android_apk_url || ''} onChange={(e) => setCfg({ ...cfg, android_apk_url: e.target.value })} /></label>
        </div>
        {!ro && <button className="btn" onClick={save}>Lưu cấu hình</button>}
        <p className="small muted">Khởi tạo SUPER ADMIN: {cfg.bootstrap_locked ? `đã khóa (${new Date(cfg.bootstrapped_at).toLocaleString('vi-VN')})` : 'chưa hoàn tất'}.</p>
      </div>

      <h2>Từ khóa bị chặn trong bài đăng/phản hồi</h2>
      <div className="card">
        <div className="chips">{words.map((w) => <span key={w} className="tag">{w} {!ro && <a href="#" onClick={(e) => { e.preventDefault(); delWord(w); }}>×</a>}</span>)}</div>
        {!ro && <div className="row" style={{ marginTop: 10 }}><input type="text" value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="Thêm từ khóa…" style={{ maxWidth: 300 }} /><button className="btn" onClick={addWord}>Thêm</button></div>}
      </div>

      {!ro && <>
        <h2>Sao lưu dữ liệu</h2>
        <div className="card">
          <p className="small">Tải toàn bộ dữ liệu (thành viên, điểm bán, bài đăng, phản hồi, kết nối, báo cáo, cấu hình) về máy tính thành 1 tệp JSON.
            Nên lưu vào thư mục <code>database\backup</code> mỗi tuần.</p>
          <button className="btn" onClick={() => exportAll(setMsg)}>⬇️ Tải bản sao lưu</button>
        </div>
        <h2>Gửi thông báo hệ thống</h2>
        <div className="card">
          <input type="text" placeholder="Tiêu đề" value={bc.title} onChange={(e) => setBc({ ...bc, title: e.target.value })} style={{ marginBottom: 8 }} />
          <textarea placeholder="Nội dung" value={bc.body} onChange={(e) => setBc({ ...bc, body: e.target.value })} style={{ minHeight: 70 }} />
          <button className="btn" style={{ marginTop: 8 }} onClick={broadcast}>Gửi tới toàn bộ thành viên</button>
        </div>
      </>}
    </div>
  );
}
