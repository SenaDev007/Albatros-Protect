#!/usr/bin/env python3
"""Grille fine (5%) sur l'icône glossy entière pour relevé VLM de composition."""
from PIL import Image, ImageDraw, ImageFont

SRC = "/home/z/my-project/public/Albatros aérien et bouclier GPS glossy.png"
OUT = "/home/z/my-project/scripts/masters/glossy-grid.png"

im = Image.open(SRC).convert("RGB")
im.thumbnail((1400, 700), Image.LANCZOS)
d = ImageDraw.Draw(im)
w, h = im.size

try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
    small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
except Exception:
    font = small = None

# lignes tous les 5% — majeures tous les 10%
for i in range(1, 20):
    p = i * 5
    x, y = w * p // 100, h * p // 100
    major = p % 10 == 0
    col = (255, 0, 0) if major else (0, 180, 0)
    wid = 2 if major else 1
    d.line([(x, 0), (x, h)], fill=col, width=wid)
    d.line([(0, y), (w, y)], fill=col, width=wid)
    if major and font:
        d.text((x + 3, 3), str(p), fill=col, font=font)
        d.text((3, y + 3), str(p), fill=col, font=font)

im.save(OUT)
print("→", OUT, im.size)
