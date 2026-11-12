import { SpeakButton } from '../components/ui.jsx';

// =====================================================================
// TIẾP SỨC CÙNG CỘNG ĐỒNG MƯU SINH — trang giới thiệu định hướng (chỉ giới thiệu).
// Phiên bản hiện tại KHÔNG có: quyên góp, chuyển tiền, đăng ký nhận/hỗ trợ,
// hay hiển thị thông tin người khó khăn. Nội dung giữ đúng văn bản đã duyệt.
// =====================================================================

const INTRO = 'CỘNG ĐỒNG MƯU SINH định hướng mở rộng khu vực kết nối các công ty xổ số, doanh nghiệp, mạnh thường quân với những người bán vé số có hoàn cảnh khó khăn, bệnh hiểm nghèo, tai nạn hoặc khuyết tật.';
const PLAN = 'Chức năng này sẽ được nghiên cứu và triển khai trong giai đoạn nâng cấp tiếp theo, sau khi hoàn thiện việc đánh giá các quy định pháp luật và quy chế vận hành phù hợp.';
const NOTE1 = 'Đơn vị sáng lập và vận hành CỘNG ĐỒNG MƯU SINH hiện tại không làm trung gian tiếp nhận, giữ, chuyển giao hoặc phân phối bất kỳ khoản tiền hay tài sản hỗ trợ nào.';
const NOTE2 = 'Các hoạt động hỗ trợ trong tương lai được định hướng theo hình thức kết nối trực tiếp giữa đơn vị hỗ trợ và người được hỗ trợ, sau khi hoàn thiện các điều kiện pháp lý và quy chế vận hành.';

// Hình minh họa tự vẽ: hai bàn tay nâng trái tim, mặt trời phía sau
function Illustration() {
  return (
    <svg viewBox="0 0 320 190" role="img" aria-label="Hình minh họa: hai bàn tay nâng đỡ trái tim" className="ts-illus">
      <defs>
        <linearGradient id="tsSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff4cc" /><stop offset="1" stopColor="#fffdf5" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="320" height="190" rx="18" fill="url(#tsSky)" />
      <circle cx="160" cy="92" r="62" fill="#fde68a" />
      {[...Array(12)].map((_, i) => {
        const a = (i * Math.PI) / 6;
        return <line key={i} x1={160 + Math.cos(a) * 72} y1={92 + Math.sin(a) * 72} x2={160 + Math.cos(a) * 86} y2={92 + Math.sin(a) * 86}
          stroke="#f5b301" strokeWidth="5" strokeLinecap="round" />;
      })}
      <path d="M160 118 C128 96 116 74 132 60 C144 50 156 56 160 66 C164 56 176 50 188 60 C204 74 192 96 160 118 Z" fill="#d61f1f" />
      <path d="M142 66 C146 61 151 60 154 62" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".7" />
      <path d="M62 150 C84 120 112 112 140 124 L150 130 C154 133 152 139 147 138 L126 134 C118 133 112 140 120 144 L168 152 L112 170 C92 176 72 170 62 150 Z" fill="#f2b48a" stroke="#c98258" strokeWidth="3" strokeLinejoin="round" />
      <path d="M258 150 C236 120 208 112 180 124 L170 130 C166 133 168 139 173 138 L194 134 C202 133 208 140 200 144 L152 152 L208 170 C228 176 248 170 258 150 Z" fill="#e3a273" stroke="#b5754c" strokeWidth="3" strokeLinejoin="round" />
      <rect x="40" y="168" width="38" height="16" rx="5" fill="#1e40af" transform="rotate(-24 59 176)" />
      <rect x="242" y="168" width="38" height="16" rx="5" fill="#15803d" transform="rotate(24 261 176)" />
    </svg>
  );
}

export default function TiepSuc() {
  const all = ['TIẾP SỨC CÙNG CỘNG ĐỒNG MƯU SINH', INTRO, PLAN, 'Lưu ý quan trọng', NOTE1, NOTE2].join('. ');
  return (
    <article className="doc tiep-suc">
      <Illustration />
      <h1 className="ts-title">TIẾP SỨC CÙNG CỘNG ĐỒNG MƯU SINH</h1>
      <div className="center"><SpeakButton text={all} label="Đọc trang này cho tôi nghe" /></div>

      <p className="ts-lead">{INTRO}</p>

      <div className="notice ts-status" role="note">
        <b>🛠️ Chức năng đang được nghiên cứu</b>
        <p style={{ margin: '6px 0 0' }}>{PLAN}</p>
      </div>

      <section className="ts-warn" aria-labelledby="ts-luu-y">
        <h2 id="ts-luu-y">⚠️ LƯU Ý QUAN TRỌNG</h2>
        <p>{NOTE1}</p>
        <p>{NOTE2}</p>
      </section>

      <p className="footer-note">Hiện tại trang này chỉ để giới thiệu định hướng. Ứng dụng không nhận tiền, không nhận quyên góp
        và không nhận đăng ký hỗ trợ.</p>
    </article>
  );
}
