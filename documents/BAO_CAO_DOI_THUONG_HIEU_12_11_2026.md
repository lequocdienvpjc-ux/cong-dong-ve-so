# Báo cáo chỉnh sửa – CỘNG ĐỒNG MƯU SINH (12/11/2026)

Bản làm việc riêng. **Chưa đưa lên web, APK hay database thật.** Bản ZIP bàn giao gốc giữ nguyên.
Lịch sử thay đổi nằm trong git của bản làm việc (3 lần lưu: bản gốc → thương hiệu → đăng ký). Muốn quay lại bản gốc: `git checkout <mã lần lưu đầu>`.

## 1. Đã làm

### Thương hiệu
- Đổi toàn bộ tên hiển thị "Cộng Đồng Vé Số" thành **Cộng Đồng Mưu Sinh** (và dạng chữ in hoa) ở: thanh tiêu đề, trang chủ, đăng nhập, trang quản trị, Giới thiệu/Quy định, Tiếp sức, Cài ứng dụng, thông báo micro, tiêu đề trang, mô tả (metadata), PWA manifest (name, short_name), tên ứng dụng Android (`appName`), tên bản phát hành APK.
- Mô tả trang (metadata) viết lại theo định hướng mới: người lao động tự do, người bán vé số và đại lý, người khó khăn.
- Tên tệp APK: thêm `CongDongMuuSinh.apk`, **vẫn phát hành kèm** `CongDongVeSo.apk` để đường link tải cũ không bị hỏng.
- Trang Cài ứng dụng: bỏ tên tệp cũ, ghi chung "tệp .apk vừa tải về".
- Thanh tiêu đề: chỉnh cỡ chữ để tên mới nằm gọn trên một dòng (điện thoại 390px).
- **Không đổi** các định danh kỹ thuật: `appId vn.congdongveso.app`, Supabase project, địa chỉ web `.../cong-dong-ve-so/`, kho GitHub, bí danh khóa ký, tên gói npm, định dạng tệp sao lưu.
- Cụm "người bán vé số", "Tiếp sức cùng người bán vé số", "Đại lý vé số 779" là nội dung nghiệp vụ, không phải tên thương hiệu nên giữ nguyên.

### Logo
- Chỉnh trên chính logo hiện có: giữ hình hai người nắm tay, vòng xanh, ngôi sao, ruy băng vàng, trái tim. Chỉ thay chữ:
  - Vòng trên: **CỘNG ĐỒNG MƯU SINH**
  - Ruy băng: **Kết nối bằng công nghệ – Chia sẻ bằng tình người**
- Tạo lại toàn bộ biểu tượng: logo trong app, favicon, icon PWA 192/512/maskable, apple-touch-icon, icon Android, màn hình chờ.
- Logo cũ cất ở `logo/cu/`. Script tạo lại logo: `deployment/doi_chu_logo.py`, rồi chạy `deployment/tao_icon_tu_logo.py`.
- Hạn chế: logo gốc là ảnh nhỏ (167px) được phóng to, nên phần hình minh họa vẫn hơi mờ như trước. Nếu có file logo gốc chất lượng cao (AI/PSD/PNG lớn) thì làm lại sẽ nét hơn.

### Thông tin người sáng lập
- Thêm thẻ **Người sáng lập** vào trang Giới thiệu (mục 5) và trang mới **Liên hệ** (`#/lien-he`, có link ở chân trang chủ). Bấm số để gọi, bấm email để gửi thư.
- Thông tin chỉ nằm ở trang Giới thiệu/Liên hệ và mục Liên hệ của Quy định, không hiện trên các màn hình khác, không ghi vào dữ liệu đăng ký.

### Đăng ký
- Chọn **✉️ Bằng email** hoặc **📱 Bằng số điện thoại**, ở cả đăng nhập lẫn đăng ký. Đăng ký bằng email giữ nguyên như cũ.
- **Số điện thoại + OTP:** dùng chức năng OTP có sẵn của Supabase (`signInWithOtp` → `verifyOtp`). Ứng dụng **không tự tạo mã, không lưu mã, không ghi mã ra nhật ký**. Supabase lo việc kiểm tra mã, hết hạn và giới hạn gửi.
  - Ứng dụng tự hỏi máy chủ xem đã bật đăng nhập bằng điện thoại chưa. **Hiện CHƯA bật**, nên mục điện thoại hiện thông báo "đang hoàn thiện, chưa sử dụng được, vui lòng dùng email". Không thể bỏ qua bước xác minh.
  - Khi bật xong: nhập số → gửi mã → nhập mã 6 số → vào app. Có nút gửi lại (đếm ngược 60 giây) và nút đổi số. Lỗi hiện bằng tiếng Việt dễ hiểu.
  - Đăng nhập bằng số chưa đăng ký sẽ **không tự tạo tài khoản**.
  - **Hồ sơ của tôi → Thêm số điện thoại để đăng nhập:** gắn số vào tài khoản email đang có (xác minh bằng OTP), tránh một người có 2 tài khoản.
- **Điều kiện độ tuổi:** hiện nguyên văn nội dung anh yêu cầu, kèm 2 lựa chọn.
  - Chọn "chưa đủ 18 tuổi…" thì **không đăng ký được** (nút bị khóa). App giải thích chưa có cách xác nhận người giám hộ trực tuyến và hiện số điện thoại, email người sáng lập để người giám hộ liên hệ. Trẻ vị thành niên không tự "xác nhận có người giám hộ" được.
  - Trang Quy định mục 2 cập nhật theo nội dung mới.
- **Đăng ký hỗ trợ người khuyết tật:** ô chọn "Tôi đang thao tác hoặc đăng ký thay cho người khuyết tật cần hỗ trợ."
  - Khi chọn: hiện hướng dẫn (có nút đọc to), nhãn ghi rõ "Tên hiển thị / Email **của người sử dụng tài khoản**".
  - Thông tin người thao tác giúp: họ tên (không bắt buộc) và quan hệ. Bắt buộc xác nhận người được hỗ trợ (hoặc người đại diện hợp pháp) đã đồng ý.
  - **Không** hỏi loại khuyết tật, **không** cấp quyền truy cập cho người thao tác giúp.
  - Ghi vào thông tin tài khoản (user metadata): `assisted_signup` gồm quan hệ, tên người giúp (nếu có), xác nhận đồng ý, thời điểm. **Không đổi database.**

## 2. Kiểm thử đã chạy
| Nội dung | Kết quả |
|---|---|
| `npm test` (5 bài, có bài mới đổi số sang +84) | Đạt |
| `npm run build` | Đạt |
| Xem giao diện trên trình duyệt mô phỏng điện thoại 390px, dữ liệu rỗng: trang chủ, đăng ký email, đăng ký điện thoại (bật/tắt), chọn hỗ trợ người khuyết tật, chọn dưới 18 tuổi, trang Liên hệ | Hiển thị đúng; tên trên thanh tiêu đề nằm 1 dòng |
| Tìm tên cũ trong mã giao diện | Không còn (chỉ còn định danh kỹ thuật cố ý giữ) |

## 3. Chưa kiểm chứng được
- **Gửi và xác minh OTP thật:** chưa có nhà cung cấp SMS, chưa bật Phone trong Supabase. **Chức năng OTP chưa hoạt động thực tế.**
- Đăng ký email với dữ liệu mới (người hỗ trợ, độ tuổi) trên Supabase thật: không thử, để tránh tạo tài khoản trên database thật.
- APK và iPhone với logo, icon mới: cần build qua GitHub Actions sau khi anh duyệt.

## 4. Cấu hình còn thiếu để OTP chạy thật
1. **Chọn nhà cung cấp SMS:**
   - Supabase hỗ trợ sẵn Twilio, MessageBird, Vonage, Textlocal.
   - Hoặc dùng "Send SMS Hook" để nối nhà cung cấp Việt Nam (eSMS, VietGuys…). Cách này cần viết thêm một Edge Function nhỏ.
2. **Tại Việt Nam, gửi OTP cần đăng ký tên thương hiệu (brandname) với nhà mạng.** Riêng eSMS ghi thời gian đăng ký brandname chăm sóc khách hàng khoảng 5–7 ngày làm việc.
3. **Chi phí tham khảo:**
   - Tin brandname trong nước khoảng 650–900 đồng/tin, tùy nhà mạng và loại tin.
   - Twilio sang Việt Nam khoảng 0,186 USD/tin (giá niêm yết đầu 2025).
   - Cần xin báo giá chính thức.
   - Lưu ý: mỗi lần đăng nhập bằng điện thoại là 1 tin.
4. **Trong Supabase → Authentication:**
   - Bật Phone provider và nhập khóa API của nhà cung cấp.
   - Mẫu tin: "Ma xac minh Cong Dong Muu Sinh: {{ .Code }}".
   - Thời gian hết hạn mã: đề nghị 300 giây.
   - Giới hạn gửi OTP: mặc định 30 tin/giờ cho cả dự án, mỗi số tối đa 1 lần/60 giây. Nên bật CAPTCHA để chống spam.
5. **Thử nghiệm không tốn SMS:** Supabase có chức năng "số điện thoại thử nghiệm" cố định mã. Chỉ dùng khi anh đồng ý, và phải xóa trước khi chạy thật.
6. **Không gửi SMS thật cho tới khi anh cho phép.**

## 5. Cần anh duyệt
1. **Luồng kiểm duyệt viên đăng ký hộ:** chưa làm vì cần thêm bảng và hàm trong database. Phương án đề xuất:
   - Kiểm duyệt viên (đã được SUPER ADMIN cấp quyền) bấm "Tạo mã hỗ trợ đăng ký" trong trang quản trị. Hệ thống sinh mã 6 ký tự, dùng 1 lần, hết hạn sau 30 phút. Database chỉ lưu dạng băm của mã.
   - Người được hỗ trợ đăng ký **trên tài khoản của chính họ** (email/điện thoại của họ), nhập mã ở ô "Mã hỗ trợ của kiểm duyệt viên".
   - Sau khi tài khoản được tạo, hàm phía database kiểm tra mã. Đúng thì ghi `registration_assists` (người dùng, kiểm duyệt viên, thời gian) và nhật ký `admin_audit`. Không cho tự nhập tên kiểm duyệt viên.
   - Quản trị viên xem danh sách "đăng ký được hỗ trợ" và lọc theo kiểm duyệt viên. Trang Thành viên có nhãn "Tự đăng ký / Được hỗ trợ".
   - Kiểm duyệt viên **không** có quyền đăng nhập hay xem mật khẩu tài khoản người khác.
   - Cần 1 migration mới, kiểm thử bảo mật và kịch bản gỡ bỏ (rollback).
2. **Người dưới 18 tuổi:** hiện chặn đăng ký trực tuyến và hướng dẫn liên hệ. Nếu muốn mở, cần quyết định cách xác nhận người giám hộ và nên hỏi ý kiến người có chuyên môn pháp lý trước.
3. **Đại lý Vé số 779** trong trang Giới thiệu/Liên hệ: giữ nguyên làm "đơn vị hỗ trợ vận hành" hay bỏ?
4. **Lỗi tiềm ẩn database:** hàm `try_bootstrap_super_admin` không chặn email rỗng (tài khoản đăng ký bằng điện thoại không có email).
   - Hiện **không nguy hiểm** vì việc cấp SUPER ADMIN đã khóa sau lần đầu.
   - Đề nghị thêm 1 migration nhỏ (`if p_email is null then return;`) trước khi bật đăng nhập bằng điện thoại.
5. **Đổi ở nơi khác (ngoài mã nguồn):**
   - Mô tả kho GitHub.
   - Tiêu đề và nội dung email xác minh trong Supabase (Authentication → Emails), nếu có ghi tên cũ.
   - Thông báo (`announcement`) trong Quản trị → Cài đặt.
   - Sau khi APK mới phát hành: đổi link tải trong Quản trị → Cài đặt sang `.../CongDongMuuSinh.apk` (không bắt buộc) và sửa số phiên bản.

## 6. Hướng dẫn kiểm thử trên điện thoại (sau khi duyệt đưa lên)
**Android (APK):**
1. Cài đè lên bản cũ. Nếu báo xung đột chữ ký thì phải gỡ bản cũ (xem mục khóa ký trong hồ sơ bàn giao).
2. Kiểm tra tên dưới biểu tượng ngoài màn hình chính, icon mới, màn hình chờ.
3. Vào Giới thiệu → bấm số điện thoại xem có mở trình gọi không, bấm email xem có mở ứng dụng thư không.
4. Đăng ký → thử chọn "chưa đủ 18 tuổi" (phải bị chặn) → thử bật "đăng ký thay người khuyết tật" (đọc hướng dẫn bằng loa).
5. Chọn "Bằng số điện thoại": phải báo "đang hoàn thiện" cho tới khi bật nhà cung cấp SMS.

**iPhone (Safari → Thêm vào MH chính):**
1. Xóa biểu tượng cũ trên màn hình chính rồi thêm lại để nhận tên và icon mới.
2. Kiểm tra lại các bước 3–5 như trên Android.

## 7. Video giới thiệu CỘNG ĐỒNG MƯU SINH
- **Tệp:** `CongDongMuuSinh_GioiThieu.mp4`, kèm ảnh bìa và phụ đề `.srt`.
- **Định dạng:** dọc 1080×1920, dài 2 phút 54 giây.
- **Đã đổi:**
  - Tên, logo và khẩu hiệu mới ở tất cả các cảnh.
  - Thêm thẻ **người sáng lập** (Lê Quốc Diễn, 2 số điện thoại, email); thông tin này cũng có ở thẻ kết.
  - Thêm chữ "Người lao động tự do…" và "Ai cũng có thể tham gia, đóng góp và nhận hỗ trợ".
  - Thêm **Bước 2: Đăng ký**, ghi rõ: đăng ký bằng số điện thoại + OTP **đang hoàn thiện, chưa sử dụng được**; có thể giúp người khuyết tật đăng ký khi họ đồng ý; xác nhận độ tuổi.
  - **Không** giới thiệu luồng kiểm duyệt viên (chưa làm).
- **Hình app:** quay lại toàn bộ trên app mới, dữ liệu thử nghiệm (có ghi chú trên hình). Màn hình app đặt trong khung, phụ đề nằm ở dải riêng bên dưới, không chồng lên app. Bỏ cảnh bản đồ vì máy làm việc không tải được bản đồ OpenStreetMap.
- **Giọng đọc:** giữ giọng cũ, tách từ video cũ.
  - Chữ "Vé Số" trong tên được thay bằng "mưu sinh" ghép từ chính giọng đó (4 chỗ: 0:28, 1:07, 2:18, 2:46). **Cần anh nghe kiểm tra 4 chỗ ghép này.**
  - Đoạn đăng ký và đoạn người sáng lập chưa có lời đọc, chỉ có chữ. Có mô hình giọng hoặc bản thu của anh thì em bổ sung được.
- **Còn lưu ý:** đường link trên thẻ kết vẫn là `…github.io/cong-dong-ve-so`. Đây là địa chỉ kỹ thuật đang chạy; muốn đổi thì phải đổi tên kho GitHub (cần anh quyết định).
- Công cụ dựng: `cong_cu_phu_tro/san_xuat_video_muu_sinh/`.
