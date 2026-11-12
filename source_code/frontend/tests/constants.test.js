import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findBanned, normalizePhone, isValidVnPhone, toE164Vn, formatKm, PROVINCES, ROLES } from '../../shared/constants.js';

test('chặn nội dung dự đoán số / mua bán vé', () => {
  assert.equal(findBanned('Hôm nay SOI CẦU miền Nam'), 'soi cầu');
  assert.equal(findBanned('Nhận mua hộ vé số'), 'mua hộ vé');
  assert.equal(findBanned('Cần người giúp sửa xe lăn'), null);
});

test('chuẩn hóa và kiểm tra số điện thoại Việt Nam', () => {
  assert.equal(normalizePhone('+84 912 345 678'), '0912345678');
  assert.equal(normalizePhone('84912345678'), '0912345678');
  assert.ok(isValidVnPhone('0912345678'));
  assert.ok(isValidVnPhone('0358 123 456'));
  assert.ok(!isValidVnPhone('0123'));
  assert.ok(!isValidVnPhone('0212345678'));
});

test('định dạng khoảng cách', () => {
  assert.equal(formatKm(0.35), '350 m');
  assert.equal(formatKm(2.345), '2.3 km');
});

test('danh mục', () => {
  assert.equal(PROVINCES.length, 34);
  assert.equal(new Set(PROVINCES).size, 34);
  assert.equal(Object.keys(ROLES).length, 6);
});

test('đổi số điện thoại sang dạng quốc tế cho OTP', () => {
  assert.equal(toE164Vn('0912 345 678'), '+84912345678');
  assert.equal(toE164Vn('+84 358123456'), '+84358123456');
  assert.equal(toE164Vn('0123'), null);
  assert.equal(toE164Vn(''), null);
});
