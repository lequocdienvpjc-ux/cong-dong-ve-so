// Thông tin giới thiệu và liên hệ người sáng lập.
// Chỉ hiển thị ở trang Giới thiệu / Liên hệ, không hiện ở các màn hình khác.
export const FOUNDER = {
  name: 'Lê Quốc Diễn',
  phones: ['0931814779', '0902338885'],
  email: 'dienlq779@gmail.com',
};

const spaced = (p) => p.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');

export default function FounderCard({ id }) {
  return (
    <div className="founder-card" id={id}>
      <p className="founder-brand">CỘNG ĐỒNG MƯU SINH</p>
      <p className="founder-desc">
        Ứng dụng kết nối cộng đồng, hỗ trợ người lao động tự do, người có hoàn cảnh khó khăn và tất cả những ai có nhu cầu
        tìm kiếm cơ hội, công việc hoặc hỗ trợ trong cuộc sống.
      </p>
      <dl className="founder-info">
        <dt>Người sáng lập</dt>
        <dd><b>{FOUNDER.name}</b></dd>
        <dt>Điện thoại</dt>
        <dd className="founder-links">
          {FOUNDER.phones.map((p) => (
            <a key={p} className="btn sm secondary" href={`tel:${p}`} aria-label={`Gọi số ${p}`}>📞 {spaced(p)}</a>
          ))}
        </dd>
        <dt>Email</dt>
        <dd><a className="btn sm secondary" href={`mailto:${FOUNDER.email}`} aria-label={`Gửi thư tới ${FOUNDER.email}`}>✉️ {FOUNDER.email}</a></dd>
        <dt>Khẩu hiệu</dt>
        <dd>Kết nối bằng công nghệ – Chia sẻ bằng tình người.</dd>
      </dl>
    </div>
  );
}
