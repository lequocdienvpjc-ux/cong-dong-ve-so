// Đọc nội dung bằng giọng nói và nhập liệu bằng giọng nói (nếu thiết bị hỗ trợ)

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text) {
  if (!canSpeak() || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'vi-VN';
  u.rate = 0.95;
  const vi = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith('vi'));
  if (vi) u.voice = vi;
  window.speechSynthesis.speak(u);
}

export function stopSpeak() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

export function canListen() {
  return typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function listen(onText, onEnd) {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R) return null;
  const r = new R();
  r.lang = 'vi-VN';
  r.interimResults = false;
  r.maxAlternatives = 1;
  r.onresult = (e) => onText(e.results[0][0].transcript);
  r.onend = () => onEnd && onEnd();
  r.onerror = () => onEnd && onEnd();
  r.start();
  return r;
}
