#!/usr/bin/env python3
"""Emblème bouclier à fond TRANSPARENT pour l'interface (navbar, footer, loading).

Réutilise le polygone de clip v3 (courbes réelles de l'écu, validé pour les
favicons) mais compose sur un canal alpha au lieu du blanc :
- masque = polygone + flou léger (anti-aliasing des bords)
- crop serré (marge réduite vs master favicon) pour un rendu net à 16-44 px
- sortie 512x512 RGBA -> public/brand/albatros-emblem.png
"""
from PIL import Image, ImageDraw, ImageFilter
import os

SRC = "/home/z/my-project/public/Albatros aérien et bouclier GPS glossy.png"
OUT = "/home/z/my-project/public/brand/albatros-emblem.png"

im = Image.open(SRC).convert("RGB")
W, H = im.size


def bez(p0, p1, p2, n=40):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
        pts.append((x, y))
    return pts


# Polygone v3 : flancs resserrés au plus près de la bordure réelle de l'écu
TL, TR = (35.8, 4.2), (68.2, 4.2)
LMAX, RMAX = (33.6, 18.0), (71.0, 18.0)
BOTTOM = (52.0, 86.5)

poly = []
poly += bez(TR, (70.9, 4.8), RMAX)
poly += bez(RMAX, (69.8, 52.0), BOTTOM)
poly += bez(BOTTOM, (34.2, 52.0), LMAX)
poly += bez(LMAX, (34.1, 4.8), TL)
poly += [TL, TR]
poly = [(x * W / 100, y * H / 100) for x, y in poly]

# Masque alpha (flou 2px : anti-aliasing propre sans manger la bordure)
mask = Image.new("L", im.size, 0)
ImageDraw.Draw(mask).polygon(poly, fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(2))

# Composition sur fond transparent
rgba = im.convert("RGBA")
rgba.putalpha(mask)

# Crop serré autour de l'écu + petite marge, cadrage carré
xs = [p[0] for p in poly]
ys = [p[1] for p in poly]
m = 10
crop = rgba.crop((int(min(xs)) - m, int(min(ys)) - m, int(max(xs)) + m, int(max(ys)) + m))
s = max(crop.size)
sq = Image.new("RGBA", (s, s), (0, 0, 0, 0))
sq.paste(crop, ((s - crop.width) // 2, (s - crop.height) // 2))
emblem = sq.resize((512, 512), Image.LANCZOS)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
emblem.save(OUT, "PNG", optimize=True)

a = emblem.getchannel("A")
transparent = sum(1 for v in a.getdata() if v < 8) / (512 * 512)
print(f"→ {OUT}  ({os.path.getsize(OUT) // 1024} Ko, transparent: {transparent:.1%})")
