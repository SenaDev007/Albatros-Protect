#!/usr/bin/env python3
"""Préparation des masters pour la génération de favicons Albatros Protect.

- Master icône (favicons) : crop du contenu utile de l'image « glossy »
  (icône albatros + bouclier GPS, centrée) avec une marge de respiration,
  sur fond blanc d'origine, puis normalisation en carré (padding).
- Master logo complet : crop du contenu de « Logo Albatros Protect en vol »
  (logo + typographie) pour l'open graph.
"""
from PIL import Image, ImageChops
import os

BASE = "/home/z/my-project/public"
OUT = "/home/z/my-project/scripts/masters"
os.makedirs(OUT, exist_ok=True)


def content_bbox(img: Image.Image, threshold: int = 12) -> tuple:
    """Bounding box du contenu = pixels différents du fond blanc (marge tolérée)."""
    rgb = img.convert("RGB")
    # Fond = couleur du coin haut-gauche
    corner = rgb.getpixel((2, 2))
    bg = Image.new("RGB", rgb.size, corner)
    diff = ImageChops.difference(rgb, bg)
    diff = diff.convert("L").point(lambda p: 255 if p > threshold else 0)
    bbox = diff.getbbox()
    return bbox if bbox else (0, 0, rgb.width, rgb.height)


def square_pad(img: Image.Image, bg_color=(255, 255, 255)) -> Image.Image:
    """Complète l'image en carré (padding centré)."""
    w, h = img.size
    side = max(w, h)
    out = Image.new("RGB", (side, side), bg_color)
    out.paste(img, ((side - w) // 2, (side - h) // 2))
    return out


def prepare_icon():
    src = os.path.join(BASE, "Albatros aérien et bouclier GPS glossy.png")
    img = Image.open(src)
    bbox = content_bbox(img)
    print("icône — bbox contenu:", bbox, "| taille originale:", img.size)
    x0, y0, x1, y1 = bbox
    # Marge de respiration ~3% du plus grand côté du contenu
    cw, ch = x1 - x0, y1 - y0
    m = int(max(cw, ch) * 0.03)
    x0m, y0m = max(0, x0 - m), max(0, y0 - m)
    x1m, y1m = min(img.width, x1 + m), min(img.height, y1 + m)
    crop = img.crop((x0m, y0m, x1m, y1m))
    print("icône — crop (avec marge):", crop.size)
    sq = square_pad(crop)
    # Master haute résolution (max 1024 pour les outils favicon)
    side = 1024 if sq.width > 1024 else sq.width
    master = sq.resize((side, side), Image.LANCZOS)
    out = os.path.join(OUT, "master-icon.png")
    master.save(out)
    print("master icône →", out, master.size)


def prepare_logo():
    src = os.path.join(BASE, "Logo Albatros Protect en vol.png")
    img = Image.open(src)
    bbox = content_bbox(img)
    print("logo — bbox contenu:", bbox, "| taille originale:", img.size)
    x0, y0, x1, y1 = bbox
    m = int(max(x1 - x0, y1 - y0) * 0.02)
    crop = img.crop((max(0, x0 - m), max(0, y0 - m),
                     min(img.width, x1 + m), min(img.height, y1 + m)))
    out = os.path.join(OUT, "master-logo.png")
    crop.save(out)
    print("master logo →", out, crop.size)


if __name__ == "__main__":
    prepare_icon()
    prepare_logo()
