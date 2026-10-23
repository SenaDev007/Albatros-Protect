#!/usr/bin/env python3
"""Construction de masters favicon candidats depuis l'icône glossy originale.

Composition (relevé VLM, % du cadre 1774×887) :
  bouclier X 34→70 %, Y 5→85 % ; épingle X 47→57 %, Y 14→42 %
  corps oiseau X 42→68 %, Y 35→72 % ; ailes X 2→48 % ; bec X 68→97 %

Variantes :
  A) shield-clip : tout ce qui est hors du pentagone du bouclier → blanc
  C) shield-fade : crop large + fondu doux vers le blanc sur les bords
"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

SRC = "/home/z/my-project/public/Albatros aérien et bouclier GPS glossy.png"
OUT = "/home/z/my-project/scripts/masters"
W_RATIO, H_RATIO = 1774, 887  # taille d'origine attendue

im = Image.open(SRC).convert("RGB")
W, H = im.size


def pct(*coords):
    """Convertit une liste de (x%, y%) en pixels."""
    return [(int(W * x / 100), int(H * y / 100)) for x, y in coords]


def square_final(img, side=1024, bg=(255, 255, 255)):
    """Recadre en carré (padding blanc centré) puis redimensionne."""
    w, h = img.size
    s = max(w, h)
    out = Image.new("RGB", (s, s), bg)
    out.paste(img, ((s - w) // 2, (s - h) // 2))
    return out.resize((side, side), Image.LANCZOS)


# ── Variante A : clip pentagone du bouclier ──────────────────────────
def variant_shield_clip():
    img = im.copy()
    # Pentagone de l'écu (coords %) — inclut la bordure rouge
    # sommets : haut-gauche, haut-droit, flanc droit, pointe basse, flanc gauche
    poly_pct = [
        (32.5, 4),    # haut gauche (un peu au-delà de la bordure)
        (71.5, 4),    # haut droit
        (71.5, 62),   # flanc droit
        (52, 87),     # pointe inférieure
        (32.5, 62),   # flanc gauche
    ]
    poly = pct(*poly_pct)

    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).polygon(poly, fill=255)
    # Adoucir le bord du masque (anti-aliasing) via flou léger
    mask = mask.filter(ImageFilter.GaussianBlur(3))

    white = Image.new("RGB", img.size, (255, 255, 255))
    clipped = Image.composite(img, white, mask)

    # Crop resserré sur le pentagone + marge
    xs = [p[0] for p in poly]
    ys = [p[1] for p in poly]
    m = 40
    crop = clipped.crop((min(xs) - m, min(ys) - m, max(xs) + m, max(ys) + m))
    master = square_final(crop)
    master.save(f"{OUT}/candidate-shield-clip.png")
    print("A →", f"{OUT}/candidate-shield-clip.png", crop.size)


# ── Variante C : crop + fondu blanc sur les flancs ───────────────────
def variant_shield_fade(fade_frac=0.16, crop_pct=(29, 2, 74, 89)):
    (x0, y0), (x1, y1) = pct((29, 2), (74, 89))
    x0, y0, x1, y1 = x0, y0, x1, y1
    crop = im.crop((x0, y0, x1, y1))
    a = np.asarray(crop).astype(float)
    h, w = a.shape[:2]

    # Degré de "garde" (1 = garder, 0 = blanc) : 1 au centre, fondu sur les bords G/D
    x = np.linspace(0, 1, w)[None, :]
    y = np.linspace(0, 1, h)[:, None]
    gx = np.ones((h, w))
    f = fade_frac
    gx = np.where(x < f, x / f, gx)          # fondu gauche
    gx = np.where(x > 1 - f, (1 - x) / f, gx)  # fondu droit
    # léger fondu haut/bas (10 %) pour harmoniser
    gy = np.ones((h, w))
    fy = 0.08
    gy = np.where(y < fy, y / fy, gy)
    gy = np.where(y > 1 - fy, (1 - y) / fy, gy)
    keep = (gx * gy)[..., None]

    white = np.full_like(a, 255.0)
    blended = a * keep + white * (1 - keep)
    out = Image.fromarray(blended.clip(0, 255).astype(np.uint8))
    master = square_final(out)
    master.save(f"{OUT}/candidate-shield-fade.png")
    print("C →", f"{OUT}/candidate-shield-fade.png", out.size)


if __name__ == "__main__":
    variant_shield_clip()
    variant_shield_fade()
