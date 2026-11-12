"""Đổi chữ trên logo hiện có sang thương hiệu CỘNG ĐỒNG MƯU SINH.
Giữ nguyên hình minh họa, vòng xanh, sao, dải ruy băng và trái tim; chỉ xóa chữ cũ và viết chữ mới.
Chạy: python3 deployment/doi_chu_logo.py   (cần Pillow, numpy, opencv-python, font Inter)
Đầu vào : logo/cu/logo_can_giua_trong_suot_1024.png (logo cũ, giữ nguyên)
Đầu ra  : logo/logo_can_giua_trong_suot_1024.png, logo/logo_can_giua_nen_trang_1024.png,
          logo/logo_nguon_tao_icon.webp (nguồn cho tao_icon_tu_logo.py)
"""
import math
from pathlib import Path
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

R = Path(__file__).resolve().parent.parent
SRC = R / 'logo' / 'cu' / 'logo_can_giua_trong_suot_1024.png'
FONT_DIR = Path('/usr/share/fonts/opentype/inter')

TEN = 'CỘNG ĐỒNG MƯU SINH'
KHAU_HIEU = ['Kết nối bằng công nghệ –', 'Chia sẻ bằng tình người']

CX, CY = 512, 506          # tâm vòng tròn
R_IN, R_OUT = 344, 432     # dải xanh chứa tên
A0, A1 = 206, 334          # cung chứa chữ (độ, 270 = đỉnh), tránh 2 ngôi sao
RIB = (230, 714, 800, 875) # vùng chữ trên ruy băng (x0, y0, x1, y1)
XANH_CHU = (18, 62, 150, 255)


def xoa_chu(im):
    a = np.array(im.convert('RGBA'))
    rgb = cv2.cvtColor(a[:, :, :3], cv2.COLOR_RGB2BGR)
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    rr = np.hypot(xx - CX, yy - CY)
    ang = (np.degrees(np.arctan2(yy - CY, xx - CX)) + 360) % 360
    mask = np.zeros((h, w), np.uint8)
    # 1) tên cũ trên vòng xanh: mọi điểm sáng trong cung chứa chữ
    r, g, b = a[:, :, 0].astype(int), a[:, :, 1].astype(int), a[:, :, 2].astype(int)
    # nền vàng của hình tròn giữa (không tô vào), chừa thêm viền trắng mảnh quanh nó
    yellow = ((r > 200) & (g > 150) & (b < 175)).astype(np.uint8)
    yellow = cv2.dilate(yellow, np.ones((15, 15), np.uint8)) > 0
    band = (rr > 296) & (rr < R_OUT - 2) & (ang > A0 - 4) & (ang < A1 + 4) & ~yellow
    light = (r + g + b) > 330
    mask[band & light] = 255
    # 2) khẩu hiệu cũ trên ruy băng: chữ xanh trên nền vàng
    x0, y0, x1, y1 = RIB
    box = np.zeros((h, w), bool); box[y0:y1, x0:x1] = True
    blue = (b > r + 25) | ((r + g + b) < 300)
    mask[box & blue] = 255
    mask = cv2.dilate(mask, np.ones((7, 7), np.uint8), iterations=2)
    out = cv2.inpaint(rgb, mask, 9, cv2.INPAINT_TELEA)
    # làm phẳng vòng xanh trong cung chữ cho sạch vết
    blue_fill = np.array([186, 96, 2], np.uint8)  # BGR
    soft = cv2.GaussianBlur((band * 255).astype(np.uint8), (0, 0), 2.0) / 255.0
    soft = soft[:, :, None]
    out = (out * (1 - soft) + blue_fill * soft).astype(np.uint8)
    a[:, :, :3] = cv2.cvtColor(out, cv2.COLOR_BGR2RGB)
    return Image.fromarray(a, 'RGBA')


def chu_cong(im, text, size, r_base, fill=(255, 255, 255, 255)):
    font = ImageFont.truetype(str(FONT_DIR / 'Inter-Black.otf'), size)
    track = size * 0.06
    widths = [font.getlength(c) + track for c in text]
    total = sum(widths) - track
    span = math.degrees(total / r_base)
    ang = 270 - span / 2
    for c, wch in zip(text, widths):
        mid = ang + math.degrees((wch - track) / 2 / r_base)
        if c != ' ':
            S = size * 3
            tile = Image.new('RGBA', (S, S), (0, 0, 0, 0))
            d = ImageDraw.Draw(tile)
            # bóng nhẹ cho dễ đọc
            d.text((S / 2 + 2, S / 2 + 3), c, font=font, anchor='ms', fill=(0, 30, 90, 120))
            d.text((S / 2, S / 2), c, font=font, anchor='ms', fill=fill)
            tile = tile.rotate(-(mid - 270), resample=Image.BICUBIC)
            px = CX + r_base * math.cos(math.radians(mid))
            py = CY + r_base * math.sin(math.radians(mid))
            im.alpha_composite(tile, (round(px - S / 2), round(py - S / 2)))
        ang += math.degrees(wch / r_base)
    return span


def chu_ruy_bang(im, lines, size):
    font = ImageFont.truetype(str(FONT_DIR / 'Inter-ExtraBold.otf'), size)
    d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = RIB
    cx = (x0 + x1) / 2 + 4
    ys = [762, 828]
    for t, y in zip(lines, ys):
        d.text((cx, y), t, font=font, anchor='mm', fill=XANH_CHU)


def main():
    im = xoa_chu(Image.open(SRC))
    # dấu ngã của chữ "lẫn" cũ nhô lên mép trên ruy băng: chép mảng ruy băng sạch bên cạnh đè lên
    patch = im.crop((540, 698, 584, 730))
    fm = Image.new('L', patch.size, 0)
    ImageDraw.Draw(fm).rectangle((6, 0, patch.width - 7, patch.height - 5), fill=255)
    from PIL import ImageFilter
    im.paste(patch, (492, 698), fm.filter(ImageFilter.GaussianBlur(4)))
    span = chu_cong(im, TEN, 62, 356)
    print(f'Tên chiếm cung {span:.0f}° (giới hạn {A1 - A0}°)')
    chu_ruy_bang(im, KHAU_HIEU, 46)
    out = R / 'logo'
    im.save(out / 'logo_can_giua_trong_suot_1024.png', optimize=True)
    white = Image.new('RGBA', im.size, (255, 255, 255, 255)); white.alpha_composite(im)
    white.save(out / 'logo_can_giua_nen_trang_1024.png', optimize=True)
    im.resize((520, 520), Image.LANCZOS).save(out / 'logo_nguon_tao_icon.webp', quality=95, method=6)
    print('Đã ghi logo mới vào thư mục logo/')


if __name__ == '__main__':
    main()
