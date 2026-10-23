#!/usr/bin/env python3
"""Master favicon = bouclier + épingle (crop zone VLM) avec marge, carré 1024."""
from PIL import Image
import os

SRC = "/home/z/my-project/scripts/masters/master-icon.png"
OUT = "/home/z/my-project/scripts/masters/master-shield.png"

im = Image.open(SRC).convert("RGB")
w, h = im.size
# Bbox VLM du bouclier : gauche 34%, droit 71%, haut 30%, bas 70%
x0, x1 = int(w * 0.34), int(w * 0.71)
y0, y1 = int(h * 0.30), int(h * 0.70)
cw, ch = x1 - x0, y1 - y0
# Marge de respiration ~10% du plus grand côté (le favicon doit respirer)
m = int(max(cw, ch) * 0.10)
x0m, y0m = max(0, x0 - m), max(0, y0 - m)
x1m, y1m = min(w, x1 + m), min(h, y1 + m)
crop = im.crop((x0m, y0m, x1m, y1m))
print("crop bouclier + marge:", crop.size)

# Carré centré sur fond blanc
side = max(crop.size)
sq = Image.new("RGB", (side, side), (255, 255, 255))
sq.paste(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
master = sq.resize((1024, 1024), Image.LANCZOS)
master.save(OUT)
print("master bouclier →", OUT, master.size)
