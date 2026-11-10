# Ghi chú nâng cấp V3 — Chuyển bản đồ sang Google Maps

**Trạng thái:** TẠM HOÃN theo quyết định của anh Lê Quốc Diễn (10/11/2026). Bản V2 dùng OpenStreetMap.

## Đã có sẵn trong mã nguồn (chưa bật)
- `source_code/frontend/src/components/MapView.jsx` đã hỗ trợ Google Maps JavaScript API (`language=vi&region=VN`).
- Khi khóa trống hoặc Google báo lỗi khóa/thanh toán, ứng dụng tự dùng OpenStreetMap.
- Dữ liệu thành viên, địa điểm và tọa độ không cần thay đổi khi chuyển.
- Nút "Xem trên Google Maps" ở trang thành viên chỉ mở liên kết tìm kiếm. Nút này không cần khóa và không phát sinh chi phí.

## Việc cần làm khi lên V3
1. **Chủ tài khoản tự thực hiện:**
   - Tạo dự án Google Cloud.
   - Bật thanh toán.
   - Bật **Maps JavaScript API**.
   - Tạo khóa API.
2. **Giới hạn khóa:**
   - HTTP referrer: `https://lequocdienvpjc-ux.github.io/*` và `https://localhost/*`.
   - Chỉ cho phép Maps JavaScript API.
   - Đặt hạn mức theo ngày và cảnh báo ngân sách.
3. **Gắn khóa:**
   - Điền khóa vào `PUBLIC_GOOGLE_MAPS_KEY` trong `config.public.js`, hoặc đặt biến build `VITE_GOOGLE_MAPS_KEY`.
   - Build lại web và APK.
4. **Kiểm tra trước khi bàn giao:**
   - Chụp màn hình bản đồ nhúng tại khu vực Hoàng Sa và Trường Sa.
   - Đối chiếu với yêu cầu pháp lý. Không tự khẳng định bản đồ đáp ứng đầy đủ pháp luật Việt Nam.
5. **Rà lại chi phí** theo số người dùng thực tế. Xem `DICH_VU_VA_CHI_PHI.md`.
