#!/usr/bin/env python3
"""Prépare l'asset de marque pour le hero de la landing :
crop du contenu de l'icône glossy (albatros en vol + bouclier), fond blanc
d'origine conservé, optimisé pour le web (PNG + WebP)."""
from PIL import Image, ImageChops
import os

SRC = "/home/z/my-project/public/Albatros aérien et bouclier GPS glossy.png"
OUT_DIR = "/home/z/my-project/public/brand"
os.makedirs(OUT_DIR, exist_ok=True)

im = Image.open(SRC).convert("RGB")

# Bounding box du contenu (élimine les marges blanches larges)
corner = im.getpixel((2, 2))
bg = Image.new("RGB", im.size, corner)
diff = ImageChops.difference(im, bg).convert("L").point(lambda p: 255 if p > 12 else 0)
bbox = diff.getbbox()
x0, y0, x1, y1 = bbox
m = int(max(x1 - x0, y1 - y0) * 0.025)
crop = im.crop((max(0, x0 - m), max(0, y0 - m), min(im.width, x1 + m), min(im.height, y1 + m)))
print("crop:", crop.size)

# Largeur cible 1100px (suffisant pour une carte hero)
ratio = 1100 / crop.width
web = crop.resize((1100, int(crop.height * ratio)), Image.LANCZOS)

png_path = os.path.join(OUT_DIR, "albatros-en-vol.png")
webp_path = os.path.join(OUT_DIR, "albatros-en-vol.webp")
web.save(png_path, "PNG", optimize=True)
web.save(webp_path, "WEBP", quality=88, method=6)
print("PNG :", os.path.getsize(png_path) // 1024, "Ko")
print("WebP:", os.path.getsize(webp_path) // 1024, "Ko")
