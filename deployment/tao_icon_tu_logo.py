"""Tạo toàn bộ biểu tượng/màn hình chờ từ logo căn giữa (logo/logo_nguon_tao_icon.webp, bản nén từ logo_can_giua_trong_suot_1024.png).
Chạy: python3 deployment/tao_icon_tu_logo.py  (cần Pillow)."""
from pathlib import Path
from PIL import Image
R = Path(__file__).resolve().parent.parent
FE = R / 'source_code' / 'frontend'
src = Image.open(R / 'logo' / 'logo_nguon_tao_icon.webp').convert('RGBA')
src = src.crop(src.split()[-1].getbbox())
# (đường dẫn, kích thước khung, bề rộng logo, nền trắng?, RGB?)
OUT = [
    ('public/logo.png', 512, 471, False, False),
    ('public/icon-512.png', 512, 440, True, False),
    ('public/icon-512-maskable.png', 512, 380, True, False),
    ('public/icon-192.png', 192, 165, True, False),
    ('public/apple-touch-icon.png', 180, 155, True, True),
    ('public/favicon.png', 64, 60, False, False),
    ('assets/icon-only.png', 1024, 882, True, False),
    ('assets/icon-foreground.png', 1024, 602, False, False),
    ('assets/splash.png', 2732, 881, True, False),
    ('assets/splash-dark.png', 2732, 881, True, False),
]
for rel, size, w, white, rgb in OUT:
    h = round(w * src.height / src.width)
    logo = src.resize((w, h), Image.LANCZOS)
    canvas = Image.new('RGBA', (size, size), (255, 255, 255, 255 if white else 0))
    canvas.alpha_composite(logo, ((size - w) // 2, (size - h) // 2))
    if rgb:
        canvas = canvas.convert('RGB')
    canvas.save(FE / rel, optimize=True)
    print('Đã tạo', rel)
