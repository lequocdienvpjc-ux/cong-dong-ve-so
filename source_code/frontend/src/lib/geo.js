// Lấy vị trí hiện tại (GPS). Trả về null nếu người dùng từ chối hoặc máy không hỗ trợ.
export function getPosition(timeout = 12000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 60000 }
    );
  });
}

// Tâm tỉnh/thành (xấp xỉ) để mở bản đồ khi không có GPS
export const PROVINCE_CENTER = {
  'Hà Nội': [21.028, 105.854], 'TP. Hồ Chí Minh': [10.776, 106.701], 'Đà Nẵng': [16.054, 108.202],
  'Hải Phòng': [20.845, 106.688], 'Cần Thơ': [10.045, 105.747], 'Huế': [16.463, 107.59],
  'Đồng Nai': [10.957, 106.843], 'Tây Ninh': [11.31, 106.098], 'An Giang': [10.386, 105.435],
  'Cà Mau': [9.177, 105.15], 'Vĩnh Long': [10.254, 105.972], 'Đồng Tháp': [10.46, 105.636],
  'Khánh Hòa': [12.238, 109.196], 'Lâm Đồng': [11.94, 108.458], 'Đắk Lắk': [12.666, 108.038],
  'Gia Lai': [13.983, 108.0], 'Quảng Ngãi': [15.12, 108.792], 'Quảng Trị': [16.75, 107.19],
  'Nghệ An': [18.679, 105.681], 'Thanh Hóa': [19.807, 105.776], 'Hà Tĩnh': [18.343, 105.906],
  'Ninh Bình': [20.25, 105.975], 'Hưng Yên': [20.646, 106.051], 'Bắc Ninh': [21.186, 106.076],
  'Quảng Ninh': [20.959, 107.042], 'Thái Nguyên': [21.594, 105.848], 'Phú Thọ': [21.322, 105.402],
  'Lào Cai': [22.486, 103.97], 'Tuyên Quang': [21.823, 105.214], 'Cao Bằng': [22.666, 106.258],
  'Lạng Sơn': [21.853, 106.761], 'Sơn La': [21.326, 103.914], 'Điện Biên': [21.386, 103.023],
  'Lai Châu': [22.396, 103.459],
};
export const VN_CENTER = [14.5, 107.5];
