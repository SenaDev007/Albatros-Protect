#!/usr/bin/env python3
"""Vérification visuelle : emblème transparent sur fond sombre et clair."""
from PIL import Image

emblem = Image.open("/home/z/my-project/public/brand/albatros-emblem.png")

# Montage : sombre (#101114 fond app) / carte sidebar (#191A1F) / clair (#F4F4F6)
tiles = []
for bg in [(16, 17, 20), (25, 26, 31), (244, 244, 246)]:
    tile = Image.new("RGB", (512, 512), bg)
    tile.paste(emblem, (0, 0), emblem)
    tiles.append(tile)

sheet = Image.new("RGB", (512 * 3 + 40, 512), (60, 60, 60))
for i, t in enumerate(tiles):
    sheet.paste(t, (i * (512 + 20), 0))
sheet = sheet.resize((1536 // 2, 512 // 2), Image.LANCZOS)
sheet.save("/tmp/emblem-check.png")
print("→ /tmp/emblem-check.png")
