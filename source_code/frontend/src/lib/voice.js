// Đọc nội dung bằng giọng nói và NHẬP LIỆU BẰNG GIỌNG NÓI tiếng Việt.
// - Ứng dụng Android (APK): dùng bộ nhận dạng giọng nói của điện thoại qua plugin gốc
//   (WebView Android không hỗ trợ Web Speech API — đây là nguyên nhân micro không chạy trước đây).
// - Trình duyệt (Chrome, Edge, Safari): dùng Web Speech API.
// - Nơi không hỗ trợ: báo rõ cho người dùng và hướng dẫn dùng micro trên bàn phím.
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSR } from '@capacitor-community/speech-recognition';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// ---------- ĐỌC CHO TÔI NGHE (chuyển chữ thành giọng nói tiếng Việt) ----------
// Ứng dụng Android: WebView không có speechSynthesis → dùng bộ đọc của điện thoại (plugin gốc).
// Trình duyệt: dùng speechSynthesis, chọn giọng tiếng Việt; chia câu ngắn để không bị ngắt giữa chừng.
export function canSpeak() {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform() || 'speechSynthesis' in window;
}

function waitVoices(ms = 1500) {
  return new Promise((resolve) => {
    const v = window.speechSynthesis.getVoices();
    if (v.length) return resolve(v);
    const done = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener?.('voiceschanged', done, { once: true });
    setTimeout(done, ms);
  });
}

function chunks(text) {
  const parts = String(text).replace(/\s+/g, ' ').match(/[^.!?;:\n]+[.!?;:]*/g) || [text];
  const out = [];
  let carry = '';
  for (let p of parts) {
    p = (carry + ' ' + p).trim(); carry = '';
    if (!p) continue;
    if (p.length < 16) { carry = p; continue; }   // gộp đoạn quá ngắn (vd: "1.") vào câu sau
    while (p.length > 180) { const i = p.lastIndexOf(' ', 180) > 60 ? p.lastIndexOf(' ', 180) : 180; out.push(p.slice(0, i)); p = p.slice(i).trim(); }
    if (p) out.push(p);
  }
  if (carry) out.push(carry);
  return out;
}

export function speakErrorText(code) {
  if (code === 'no-vi-voice') {
    return Capacitor.isNativePlatform()
      ? 'Điện thoại chưa có giọng đọc tiếng Việt. Vào Cài đặt → Hỗ trợ tiếp cận → Đầu ra chuyển văn bản thành giọng nói → chọn Công cụ của Google → Tải dữ liệu giọng nói → Tiếng Việt.'
      : 'Máy này chưa có giọng đọc tiếng Việt. Hãy mở bằng điện thoại, hoặc dùng trình duyệt Microsoft Edge trên máy tính.';
  }
  if (code === 'unsupported') return 'Thiết bị này chưa hỗ trợ đọc thành tiếng.';
  return 'Chưa đọc được. Bấm 🔊 để thử lại.';
}

// Đọc nội dung. cb: { onEnd, onError(code) }
export async function speak(text, cb = {}) {
  if (!text) return;
  if (Capacitor.isNativePlatform()) {
    try {
      const { supported } = await TextToSpeech.isLanguageSupported({ lang: 'vi-VN' });
      if (!supported) { cb.onError?.('no-vi-voice'); return; }
      await TextToSpeech.speak({ text: String(text), lang: 'vi-VN', rate: 0.9, category: 'playback' });
      cb.onEnd?.();
    } catch { cb.onError?.('unknown'); }
    return;
  }
  if (!('speechSynthesis' in window)) { cb.onError?.('unsupported'); return; }
  window.speechSynthesis.cancel();
  const voices = await waitVoices();
  const vi = voices.find((v) => v.lang?.toLowerCase().replace('_', '-').startsWith('vi'));
  if (!vi) { cb.onError?.('no-vi-voice'); return; }
  const list = chunks(text);
  list.forEach((t, i) => {
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'vi-VN'; u.voice = vi; u.rate = 0.95;
    if (i === list.length - 1) u.onend = () => cb.onEnd?.();
    u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') cb.onError?.('unknown'); };
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeak() {
  if (Capacitor.isNativePlatform()) { TextToSpeech.stop().catch(() => {}); return; }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

const isNative = () => Capacitor.isNativePlatform();
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

export function canListen() {
  if (typeof window === 'undefined') return false;
  return isNative() || !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Lời nhắn lỗi dễ hiểu cho người lớn tuổi
export function voiceErrorText(code) {
  const keyboard = isIOS()
    ? 'Bạn có thể bấm vào ô nhập, rồi bấm nút 🎤 trên bàn phím iPhone (cạnh phím cách) để nói.'
    : 'Bạn có thể bấm vào ô nhập, rồi bấm nút 🎤 trên bàn phím điện thoại để nói.';
  switch (code) {
    case 'not-allowed':
      return isNative()
        ? 'Ứng dụng chưa được phép dùng micro. Hãy bấm "Cho phép" khi điện thoại hỏi, hoặc vào Cài đặt → Ứng dụng → Cộng Đồng Vé Số → Quyền → Micro → Cho phép.'
        : 'Chưa được phép dùng micro. Bấm biểu tượng ổ khóa cạnh địa chỉ web → Micro → Cho phép, rồi bấm 🎤 lại.';
    case 'service-not-allowed':
      return isIOS() && isStandalone()
        ? 'Trên iPhone, chức năng nói để nhập trong ứng dụng cài từ Safari còn hạn chế. ' + keyboard
        : 'Thiết bị chưa cho phép nhận dạng giọng nói. ' + keyboard;
    case 'no-speech': return 'Chưa nghe thấy tiếng nói. Bấm 🎤 rồi nói to, rõ ràng hơn.';
    case 'audio-capture': return 'Không tìm thấy micro trên thiết bị. ' + keyboard;
    case 'network': return 'Cần có mạng Internet để chuyển giọng nói thành chữ. Kiểm tra mạng rồi thử lại.';
    case 'language-not-supported':
      return 'Thiết bị chưa có tiếng Việt cho nhận dạng giọng nói. Vào Cài đặt → Ngôn ngữ → Nhập bằng giọng nói của Google → thêm Tiếng Việt. ' + keyboard;
    case 'unsupported': return 'Trình duyệt này chưa hỗ trợ nói để nhập. ' + keyboard + ' Hoặc mở bằng Chrome.';
    case 'aborted': return '';
    default: return 'Chưa nhận được giọng nói. Bấm 🎤 để thử lại. ' + keyboard;
  }
}

// Bắt đầu nghe. Trả về hàm dừng.
// cb: { onStart, onPartial(text), onFinal(text), onError(code), onEnd }
export function startListening(cb) {
  if (isNative()) return startNative(cb);
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R) { cb.onError?.('unsupported'); cb.onEnd?.(); return () => {}; }
  let r;
  try { r = new R(); } catch { cb.onError?.('unsupported'); cb.onEnd?.(); return () => {}; }
  let finalText = '';
  let errored = false;
  r.lang = 'vi-VN';
  r.interimResults = true;
  r.continuous = false;
  r.maxAlternatives = 1;
  r.onstart = () => cb.onStart?.();
  r.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t; else interim += t;
    }
    if (interim) cb.onPartial?.(interim);
  };
  r.onerror = (e) => { errored = true; cb.onError?.(e.error || 'unknown'); };
  r.onend = () => {
    const t = finalText.trim();
    if (t) cb.onFinal?.(t);
    else if (!errored) cb.onError?.('no-speech');
    cb.onEnd?.();
  };
  try { r.start(); } catch { cb.onError?.('unknown'); cb.onEnd?.(); }
  return () => { try { r.stop(); } catch {} };
}

function startNative(cb) {
  let stopped = false;
  (async () => {
    try {
      const { available } = await NativeSR.available();
      if (!available) { cb.onError?.('service-not-allowed'); return; }
      let perm = await NativeSR.checkPermissions();
      if (perm.speechRecognition !== 'granted') perm = await NativeSR.requestPermissions();
      if (perm.speechRecognition !== 'granted') { cb.onError?.('not-allowed'); return; }
      cb.onStart?.();
      // popup: hiện hộp thoại "Hãy nói" quen thuộc của Google, dễ dùng cho người lớn tuổi
      const res = await NativeSR.start({ language: 'vi-VN', maxResults: 1, prompt: 'Hãy nói nội dung cần nhập', partialResults: false, popup: true });
      const t = (res?.matches?.[0] || '').trim();
      if (stopped) return;
      if (t) cb.onFinal?.(t); else cb.onError?.('no-speech');
    } catch (e) {
      const m = String(e?.message || e).toLowerCase();
      cb.onError?.(m.includes('permission') ? 'not-allowed' : m.includes('match') || m.includes('speech') ? 'no-speech' : m.includes('network') ? 'network' : 'unknown');
    } finally {
      cb.onEnd?.();
    }
  })();
  return () => { stopped = true; NativeSR.stop().catch(() => {}); };
}
