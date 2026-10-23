#!/usr/bin/env python3
"""Génère une version de master-icon.png avec grille de coordonnées (10%)."""
from PIL import Image, ImageDraw

SRC = "/home/z/my-project/scripts/masters/master-icon.png"
OUT = "/home/z/my-project/scripts/masters/master-icon-grid.png"

im = Image.open(SRC).convert("RGB")
d = ImageDraw.Draw(im)
w, h = im.size

for i in range(1, 10):
    x = w * i // 10
    y = h * i // 10
    d.line([(x, 0), (x, h)], fill=(0, 200, 0), width=2)
    d.line([(0, y), (w, y)], fill=(0, 200, 0), width=2)
    d.text((x + 4, 4), str(i * 10), fill=(0, 150, 0))
    d.text((4, y + 4), str(i * 10), fill=(0, 150, 0))

im.save(OUT)
print("grille →", OUT, im.size)
