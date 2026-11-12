import { useEffect, useRef } from 'react';
import { SpeakButton } from '../components/ui.jsx';
import FounderCard from '../components/Founder.jsx';

// Lấy chữ của một mục (từ tiêu đề đến trước tiêu đề kế tiếp) để đọc thành tiếng
const sectionText = (id) => {
  const h = document.getElementById(id); if (!h) return '';
  let t = h.innerText + '. '; let el = h.nextElementSibling;
  while (el && !/^H[23]$/.test(el.tagName)) { if (!el.classList.contains('speak-wrap')) t += el.innerText + ' '; el = el.nextElementSibling; }
  return t;
};

// =====================================================================
// GIỚI THIỆU + QUY ĐỊNH CỘNG ĐỒNG & QUYỀN RIÊNG TƯ
// Nội dung chính thức – Phiên bản V01 (23:00, 09/11/2026); Phần I điều chỉnh theo thông điệp giới thiệu chính thức ngày 11/11/2026.
// Giữ nguyên văn, không tự ý sửa.
// =====================================================================

const logo = import.meta.env.BASE_URL + 'logo.png';

const TOC = [
  ['p1', 'PHẦN I. GIỚI THIỆU', [
    ['p1-1', '1. Cộng Đồng Mưu Sinh là gì?'],
    ['p1-2', '2. Vì sao chúng tôi xây dựng cộng đồng này?'],
    ['p1-3', '3. Cộng đồng giúp mọi người như thế nào?'],
    ['p1-4', '4. Ứng dụng miễn phí – Không thu phí kết nối'],
    ['p1-5', '5. Người sáng lập và đơn vị hỗ trợ vận hành'],
    ['p1-6', '6. Mong muốn của chúng tôi'],
  ]],
  ['p2', 'PHẦN II. QUY ĐỊNH CỘNG ĐỒNG & QUYỀN RIÊNG TƯ', [
    ['p2-1', '1. Ứng dụng là gì?'],
    ['p2-2', '2. Điều kiện tham gia'],
    ['p2-3', '3. Những nội dung và hành vi không được phép'],
    ['p2-4', '4. Quyền riêng tư và bảo vệ dữ liệu cá nhân'],
    ['p2-5', '5. Liên hệ và tiếp nhận phản ánh'],
    ['p2-6', '6. Cam kết chung'],
  ]],
];

const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export default function Rules({ part }) {
  const top = useRef(null);
  useEffect(() => {
    if (part === 2) setTimeout(() => go('p2'), 50);
    else if (part === 'lien-he') setTimeout(() => go('nguoi-sang-lap'), 50);
    else window.scrollTo(0, 0);
  }, [part]);

  return (
    <article className="doc" ref={top}>
      <header className="doc-head">
        <img className="page-logo" src={logo} alt="Logo Cộng Đồng Mưu Sinh" />
        <h1>CỘNG ĐỒNG MƯU SINH</h1>
        <p className="doc-slogan">KẾT NỐI BẰNG CÔNG NGHỆ – CHIA SẺ BẰNG TÌNH NGƯỜI</p>
      </header>

      <nav className="doc-toc card" aria-label="Mục lục">
        <b>Mục lục</b>
        {TOC.map(([id, title, items]) => (
          <div key={id}>
            <button type="button" className="toc-part" onClick={() => go(id)}>{title}</button>
            <ul>{items.map(([sid, st]) => <li key={sid}><button type="button" onClick={() => go(sid)}>{st}</button></li>)}</ul>
          </div>
        ))}
      </nav>

      {/* ======================= PHẦN I ======================= */}
      <section id="p1" className="doc-part">
        <h2 className="part-title">PHẦN I. GIỚI THIỆU</h2>

        <h3 id="p1-1">1. Cộng Đồng Mưu Sinh là gì?</h3>
        <SpeakButton label="Đọc mục này" text={() => sectionText('p1-1')} />
        <p>Công nghệ ngày càng phát triển, nhiều ứng dụng ra đời để phục vụ cuộc sống. Nhưng vẫn còn rất nhiều người, đặc biệt là người bán vé số dạo, người khuyết tật, người lớn tuổi và những người có hoàn cảnh khó khăn, chưa có nhiều cơ hội tiếp cận những tiện ích đó.</p>
        <p><b>CỘNG ĐỒNG MƯU SINH mong muốn tạo ra một nơi để mọi người có thể tìm thấy nhau, kết nối với nhau và cùng tạo ra những giá trị tốt đẹp trong cuộc sống.</b></p>
        <p>Trọng tâm của cộng đồng vẫn là kết nối đại lý vé số với người bán vé số dạo, giúp người bán tìm nguồn vé, tìm đại lý phù hợp và giúp các đại lý kết nối với người cần hỗ trợ bán vé.</p>
        <p>Đây là một cộng đồng miễn phí, nơi mọi người có thể đăng tải nhu cầu, tìm kiếm người hỗ trợ, tìm việc làm nhỏ và chia sẻ những điều mình có với những người đang cần.</p>

        <h3 id="p1-2">2. Vì sao chúng tôi xây dựng cộng đồng này?</h3>
        <SpeakButton label="Đọc mục này" text={() => sectionText('p1-2')} />
        <p>Nhiều ngành nghề truyền thống như xe ôm, giao hàng, vận chuyển đã có những nền tảng công nghệ giúp người lao động kết nối với khách hàng và tìm kiếm công việc dễ dàng hơn.</p>
        <p>Trong khi đó, phần lớn người bán vé số dạo vẫn phải tự đi khắp nơi tìm khách, tự liên hệ đại lý để lấy vé và tự xoay xở với những khó khăn mỗi ngày.</p>
        <p>Có người bán hết vé sớm nhưng không biết tìm ai đang cần hỗ trợ. Có người gần đến giờ xổ số vẫn còn nhiều vé chưa bán được. Có đại lý gặp khó khăn khi lượng vé còn nhiều và cần tìm kiếm sự hỗ trợ từ những đại lý khác.</p>
        <p>Những khó khăn ấy thường được mỗi người tự giải quyết, trong khi xung quanh có thể có nhiều người sẵn sàng giúp đỡ nếu có cơ hội kết nối.</p>
        <p>Chúng tôi nghĩ rằng những người lao động bình dân, đặc biệt là người lớn tuổi, người khuyết tật và người có hoàn cảnh khó khăn, cũng xứng đáng được tiếp cận với công nghệ để có thêm cơ hội cải thiện công việc và cuộc sống.</p>

        <h3 id="p1-3">3. Cộng đồng giúp mọi người như thế nào?</h3>
        <SpeakButton label="Đọc mục này" text={() => sectionText('p1-3')} />
        <p>Chúng tôi mong muốn xây dựng một mạng lưới tương trợ hai chiều:</p>
        <ul>
          <li><b>Người bán vé số hỗ trợ người bán vé số:</b> Người bán hết vé sớm có thể tìm kiếm những người xung quanh đang cần giúp đỡ.</li>
          <li><b>Người cần hỗ trợ có thể lên tiếng:</b> Thành viên có thể chia sẻ khó khăn để cộng đồng biết và hỗ trợ phù hợp.</li>
          <li><b>Đại lý kết nối với đại lý:</b> Tìm kiếm, liên hệ và chia sẻ kinh nghiệm với những đại lý khác.</li>
          <li><b>Đại lý và người bán vé số kết nối với nhau:</b> Giúp mọi người mở rộng mạng lưới quan hệ.</li>
          <li><b>Cộng đồng cùng giúp đỡ người khó khăn:</b> Tạo cơ hội để cá nhân, tổ chức và những người có điều kiện cùng chung tay hỗ trợ.</li>
        </ul>
        <p><b>Nhưng cộng đồng không chỉ dừng lại ở vé số.</b></p>
        <p>Bạn cần người giao đồ ăn, giao hàng, chở đi đâu đó, đi chợ hoặc phụ giúp một công việc nhỏ?</p>
        <p>Một cửa hàng cần người phụ bán vài tiếng? Một quán ăn cần người hỗ trợ đóng gói? Một người đang có thời gian rảnh muốn tìm việc làm thêm?</p>
        <p>Bạn có quần áo, đồ dùng còn tốt muốn tặng? Bạn là chủ tiệm tạp hóa có hàng muốn bán giá rẻ? Bạn có những phần ăn còn bảo đảm an toàn muốn chia sẻ với người cần?</p>
        <p><b>Tất cả đều có thể đăng tải nhu cầu lên CỘNG ĐỒNG MƯU SINH để mọi người tìm thấy nhau.</b> Chỉ cần dùng chức năng đăng bài trên Bảng tương trợ.</p>
        <p>Có thể một người đang cần giúp đỡ, nhưng ở gần đó lại có người đang có thời gian, có phương tiện hoặc có khả năng giúp đỡ. Có thể một cửa hàng đang cần người phụ việc, trong khi một người khác đang cần một công việc nhỏ để kiếm thêm thu nhập.</p>
        <p>Chúng tôi mong muốn tạo thêm cơ hội cho người yếu thế, người khuyết tật, người lớn tuổi và những người đang gặp khó khăn có thể tham gia vào các hoạt động phù hợp, chủ động tìm kiếm việc làm và cải thiện cuộc sống.</p>
        <p>Đối với thực phẩm, hàng hóa và công việc có điều kiện an toàn hoặc cần giấy phép riêng, người đăng phải tuân thủ quy định hiện hành.</p>
        <p>Ứng dụng tập trung vào kết nối, chia sẻ thông tin và hỗ trợ cộng đồng; không trực tiếp mua bán, đặt vé, thanh toán, giao nhận hoặc phân phối vé số. Các hoạt động liên quan đến chuyển giao hoặc bán vé thay cho người khác không phải chức năng được ứng dụng tổ chức.</p>

        <h3 id="p1-4">4. Ứng dụng miễn phí – Không thu phí kết nối</h3>
        <SpeakButton label="Đọc mục này" text={() => sectionText('p1-4')} />
        <ul>
          <li>Không thu phí đăng ký.</li>
          <li>Không thu phí đăng tin.</li>
          <li>Không thu phí tìm kiếm.</li>
          <li>Không thu hoa hồng kết nối.</li>
          <li>Không thu phần trăm từ công việc do mọi người tự kết nối.</li>
          <li>Không bắt buộc đóng góp để được sử dụng ứng dụng.</li>
        </ul>
        <p>CỘNG ĐỒNG MƯU SINH không đứng ra nhận tiền, thanh toán, điều phối công việc hoặc bảo đảm giao dịch giữa các bên. Ứng dụng chỉ cung cấp không gian để mọi người đăng nhu cầu, tìm thấy nhau và chủ động liên hệ, tự thỏa thuận với nhau.</p>
        <p><b>Chúng tôi không mong muốn kiếm lợi nhuận từ những người đang cần giúp đỡ. Chúng tôi mong muốn tạo ra một cộng đồng mà ở đó, mỗi người đều có thể tìm thấy một cơ hội hoặc trao đi một sự giúp đỡ.</b></p>
        <p>Chi phí vận hành, bảo trì và phát triển có thể được hỗ trợ thông qua những đóng góp tự nguyện từ các đại lý, cá nhân và tổ chức. Việc đóng góp hoàn toàn tùy tâm, không phải điều kiện để tham gia cộng đồng.</p>

        <h3 id="p1-5">5. Người sáng lập và đơn vị hỗ trợ vận hành</h3>
        <SpeakButton label="Đọc mục này" text={() => sectionText('p1-5')} />
        <FounderCard id="nguoi-sang-lap" />
        <div className="contact-box">
          <p><b>ĐẠI LÝ VÉ SỐ 779</b></p>
          <ul>
            <li>Địa chỉ: Đường N14, khu phố An Hòa, phường Hòa Lợi, TP. Hồ Chí Minh.</li>
            <li>Điện thoại liên hệ: <b><a href="tel:0931814779">0931814779</a></b>.</li>
          </ul>
        </div>
        <p>Đại lý vé số 779 là đơn vị sáng lập và hỗ trợ vận hành nền tảng CỘNG ĐỒNG MƯU SINH.</p>
        <p>Với kinh nghiệm hoạt động trong ngành vé số, chúng tôi thấu hiểu những thuận lợi và khó khăn của các đại lý cũng như người bán vé số, đặc biệt là những người bán vé số dạo.</p>
        <p>Chúng tôi xây dựng nền tảng này với mong muốn tạo ra một công cụ đơn giản, dễ sử dụng, giúp những người cùng nghề có thể kết nối và hỗ trợ lẫn nhau.</p>
        <p>Đại lý vé số 779 không đứng ra bảo đảm hoặc chịu trách nhiệm thay cho các hoạt động riêng của thành viên.</p>

        <h3 id="p1-6">6. Mong muốn của chúng tôi</h3>
        <SpeakButton label="Đọc mục này" text={() => sectionText('p1-6')} />
        <p>Chúng tôi không thể giúp mọi người bán hết tất cả vé số, cũng không thể giải quyết mọi khó khăn của từng thành viên.</p>
        <p>Nhưng chúng tôi hy vọng có thể giúp mọi người có thêm cơ hội tìm thấy nhau, biết ai đang cần giúp đỡ và ai có thể hỗ trợ, thay vì phải đơn độc xoay xở mỗi ngày.</p>
        <p>Một người giúp một người, nhiều người cùng giúp nhiều người. Những sự hỗ trợ nhỏ khi được kết nối có thể tạo nên những giá trị lớn cho cộng đồng.</p>
        <p><b>Công nghệ không chỉ dành cho những ngành nghề lớn hay những người có điều kiện. Những người lao động bình dân cũng xứng đáng có một công cụ hỗ trợ công việc và kết nối cộng đồng.</b></p>
        <p>Đôi khi, một công việc chỉ vài chục nghìn đồng, một món đồ cũ còn tốt, một phần ăn được chia sẻ hay một chuyến xe giúp người khác cũng có thể tạo nên ý nghĩa lớn.</p>
        <p>Xin cảm ơn tất cả các đại lý, người bán vé số, người mua vé số và những tấm lòng thiện nguyện đã cùng tham gia, chia sẻ và xây dựng cộng đồng này.</p>
        <p><b>CỘNG ĐỒNG MƯU SINH – KẾT NỐI BẰNG CÔNG NGHỆ, CHIA SẺ BẰNG TÌNH NGƯỜI.</b></p>
      </section>

      <hr className="doc-sep" />

      {/* ======================= PHẦN II ======================= */}
      <section id="p2" className="doc-part">
        <h2 className="part-title">PHẦN II. QUY ĐỊNH CỘNG ĐỒNG &amp; QUYỀN RIÊNG TƯ</h2>

        <h3 id="p2-1">1. Ứng dụng là gì?</h3>
        <SpeakButton label="Đọc mục này" text={() => sectionText('p2-1')} />
        <p>CỘNG ĐỒNG MƯU SINH là nền tảng miễn phí giúp đại lý, người bán vé số, người mua và người muốn giúp đỡ tìm thấy và hỗ trợ nhau; đồng thời là nơi mọi người đăng nhu cầu, tìm việc làm nhỏ và chia sẻ với người đang cần.</p>
        <p>Ứng dụng <b>không mua bán, không đặt vé, không thanh toán, không giao vé và không phân phối vé số</b>. Ứng dụng không đứng ra làm trung gian cho các giao dịch vé số giữa các thành viên.</p>
        <p>Thành viên tự chịu trách nhiệm về các hoạt động của mình và phải tuân thủ quy định pháp luật hiện hành.</p>

        <h3 id="p2-2">2. Điều kiện tham gia</h3>
        <SpeakButton label="Đọc mục này" text={() => sectionText('p2-2')} />
        <ul>
          <li>Người dùng <b>từ đủ 18 tuổi</b> có thể tự đăng ký và sử dụng ứng dụng.</li>
          <li>Người <b>dưới 18 tuổi</b> chỉ được tham gia khi có sự đồng ý, hỗ trợ hoặc giám hộ hợp pháp theo quy định pháp luật áp dụng. Hiện ứng dụng <b>chưa mở đăng ký trực tuyến</b> cho người dưới 18 tuổi; người giám hộ vui lòng liên hệ người sáng lập theo thông tin ở mục Liên hệ.</li>
          <li>Người thân hoặc người hỗ trợ có thể giúp người khuyết tật thao tác đăng ký, với sự đồng ý của chính người được hỗ trợ (hoặc người đại diện hợp pháp khi cần). Tài khoản thuộc về người sử dụng thực tế; người thao tác giúp không được tự động có quyền truy cập tài khoản.</li>
          <li>Cung cấp thông tin trung thực, không giả mạo người khác.</li>
          <li>Tự chịu trách nhiệm về thông tin, nội dung và hành vi của mình.</li>
          <li>Tôn trọng các thành viên khác và tuân thủ quy định cộng đồng.</li>
        </ul>

        <h3 id="p2-3">3. Những nội dung và hành vi không được phép</h3>
        <SpeakButton label="Đọc mục này" text={() => sectionText('p2-3')} />
        <p>Thành viên không được đăng tải, chia sẻ hoặc thực hiện các hành vi sau:</p>
        <ul>
          <li>Dự đoán kết quả xổ số, soi cầu, chốt số, lô đề hoặc nội dung liên quan đến cờ bạc trái pháp luật.</li>
          <li>Rao mua bán, đặt vé, mua hộ, giao vé, chuyển nhượng hoặc tổ chức phân phối vé số.</li>
          <li>Lừa đảo, giả mạo đại lý, xin chuyển tiền, đăng số tài khoản ngân hàng nhằm mục đích lừa đảo hoặc lợi dụng lòng tin của thành viên.</li>
          <li>Đăng thông tin sai sự thật, xúc phạm, đe dọa, quấy rối hoặc phân biệt đối xử.</li>
          <li>Đăng nội dung vi phạm pháp luật, phát tán mã độc, spam hoặc lợi dụng ứng dụng cho mục đích không phù hợp.</li>
        </ul>
        <p><b>Xử lý vi phạm:</b></p>
        <p>Quản trị viên có quyền xem xét, cảnh báo, ẩn hoặc gỡ nội dung vi phạm, tạm khóa hoặc khóa tài khoản tùy theo mức độ và tính chất vi phạm.</p>
        <p>Khi phát hiện nội dung xấu hoặc hành vi đáng ngờ, thành viên vui lòng sử dụng chức năng <b>⚠️ Báo cáo vi phạm</b> để thông báo cho quản trị viên.</p>

        <h3 id="p2-4">4. Quyền riêng tư và bảo vệ dữ liệu cá nhân</h3>
        <SpeakButton label="Đọc mục này" text={() => sectionText('p2-4')} />
        <h4>4.1. Thông tin có thể được thu thập</h4>
        <p>Tùy theo chức năng sử dụng, ứng dụng có thể thu thập:</p>
        <ul>
          <li>Email đăng ký.</li>
          <li>Tên hiển thị và ảnh đại diện.</li>
          <li>Số điện thoại.</li>
          <li>Tỉnh, phường và vai trò của thành viên.</li>
          <li>Vị trí địa lý khi thành viên cho phép sử dụng quyền truy cập vị trí.</li>
          <li>Thông tin và nội dung do thành viên chủ động đăng tải.</li>
          <li>Dữ liệu kỹ thuật cần thiết để vận hành, bảo mật và cải thiện ứng dụng.</li>
        </ul>
        <h4>4.2. Mục đích sử dụng thông tin</h4>
        <p>Thông tin được sử dụng nhằm:</p>
        <ul>
          <li>Tạo và quản lý tài khoản.</li>
          <li>Hiển thị hồ sơ thành viên theo thiết lập quyền riêng tư.</li>
          <li>Hỗ trợ tìm kiếm và kết nối giữa các thành viên.</li>
          <li>Tiếp nhận báo cáo, xử lý vi phạm và bảo vệ cộng đồng.</li>
          <li>Bảo đảm an toàn, vận hành và cải thiện ứng dụng.</li>
          <li>Thực hiện nghĩa vụ theo quy định pháp luật khi cần thiết.</li>
        </ul>
        <p>Chúng tôi không bán dữ liệu cá nhân và không sử dụng dữ liệu thành viên để chia sẻ cho bên thứ ba nhằm mục đích quảng cáo.</p>
        <p>Các nhà cung cấp dịch vụ kỹ thuật có thể xử lý dữ liệu trong phạm vi cần thiết để vận hành ứng dụng và phải tuân thủ các yêu cầu bảo vệ dữ liệu phù hợp.</p>
        <h4>4.3. Quyền kiểm soát thông tin</h4>
        <ul>
          <li>Số điện thoại chỉ hiển thị khi thành viên chủ động bật chức năng cho phép hiển thị.</li>
          <li>Vị trí chỉ được sử dụng khi thành viên cấp quyền truy cập.</li>
          <li>Vị trí hiển thị cho cộng đồng được làm tròn trong khoảng 100–500 m nhằm hạn chế việc tiết lộ vị trí chính xác.</li>
          <li>Thành viên có thể xem, chỉnh sửa hoặc ẩn các thông tin được ứng dụng hỗ trợ trong mục <b>Của tôi</b>.</li>
        </ul>
        <h4>4.4. Xóa tài khoản và dữ liệu</h4>
        <p>Thành viên có thể yêu cầu xóa tài khoản và dữ liệu cá nhân thông qua chức năng được cung cấp trong ứng dụng hoặc liên hệ quản trị viên.</p>
        <p>Việc xóa dữ liệu được thực hiện theo quy trình của hệ thống, phù hợp với quy định pháp luật và các nghĩa vụ lưu trữ cần thiết. Một số dữ liệu có thể còn tồn tại trong bản sao lưu trong thời gian lưu trữ kỹ thuật trước khi được xóa theo chu kỳ.</p>
        <h4>4.5. Lưu trữ dữ liệu</h4>
        <p>Dữ liệu ứng dụng được lưu trữ trên hệ thống máy chủ sử dụng dịch vụ Supabase. Khu vực lưu trữ và xử lý dữ liệu phụ thuộc vào cấu hình dự án thực tế.</p>
        <p>Chúng tôi áp dụng các biện pháp kỹ thuật phù hợp nhằm bảo vệ dữ liệu, hạn chế truy cập trái phép và giảm thiểu nguy cơ mất mát thông tin.</p>

        <h3 id="p2-5">5. Liên hệ và tiếp nhận phản ánh</h3>
        <SpeakButton label="Đọc mục này" text={() => sectionText('p2-5')} />
        <p>Mọi thắc mắc, khiếu nại về nội dung cộng đồng, tài khoản hoặc dữ liệu cá nhân, thành viên có thể gửi thông qua chức năng <b>Báo cáo vi phạm</b> hoặc liên hệ:</p>
        <ul>
          <li>Người sáng lập: <b>Lê Quốc Diễn</b> – điện thoại <b><a href="tel:0931814779">0931814779</a></b>, <b><a href="tel:0902338885">0902338885</a></b> – email <b><a href="mailto:dienlq779@gmail.com">dienlq779@gmail.com</a></b>.</li>
        </ul>
        <div className="contact-box">
          <p><b>ĐẠI LÝ VÉ SỐ 779</b></p>
          <ul>
            <li>Địa chỉ: Số 38 đường N14, khu phố An Hòa, phường Hòa Lợi, TP. Hồ Chí Minh.</li>
            <li>Điện thoại: <b><a href="tel:0931814779">0931814779</a></b>.</li>
          </ul>
        </div>

        <h3 id="p2-6">6. Cam kết chung</h3>
        <SpeakButton label="Đọc mục này" text={() => sectionText('p2-6')} />
        <p>Khi tham gia CỘNG ĐỒNG MƯU SINH, thành viên được khuyến khích kết nối, chia sẻ và hỗ trợ nhau trên tinh thần tự nguyện, tôn trọng và tuân thủ pháp luật.</p>
        <p>Chúng tôi mong muốn xây dựng một cộng đồng văn minh, minh bạch, an toàn và có ích cho tất cả mọi người.</p>
      </section>

      <hr className="doc-sep" />
      <footer className="doc-foot">
        <p className="doc-name">CỘNG ĐỒNG MƯU SINH</p>
        <p className="doc-slogan">KẾT NỐI BẰNG CÔNG NGHỆ – CHIA SẺ BẰNG TÌNH NGƯỜI</p>
        <p><i>Phiên bản V01 – 23:00, ngày 09/11/2026</i></p>
        <button type="button" className="btn sm secondary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑ Lên đầu trang</button>
      </footer>
    </article>
  );
}
