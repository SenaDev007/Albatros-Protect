#!/usr/bin/env python3
"""Open Graph image (1200×630) — Albatros Protect.

Design dark premium : fond #101114 avec halo rouge subtil, carte blanche
arrondie contenant le logo complet (albatros + ALBATROS PROTECT).
Utilisée pour og:image ET twitter:image (voir layout.tsx).
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

LOGO = "/home/z/my-project/scripts/masters/master-logo.png"
OUT = "/home/z/my-project/public/og-image.png"

W, H = 1200, 630
BG = (16, 17, 20)        # #101114 — fond dark premium de l'app
ACCENT = (229, 57, 69)   # #E53945 — rouge de marque


def dark_bg():
    """Fond + halo rouge radial subtil derrière la carte."""
    y, x = np.mgrid[0:H, 0:W]
    cx, cy = W / 2, H / 2
    d = np.sqrt((x - cx) ** 2 + (y - cy) ** 2) / (W / 2)
    glow = np.clip(1 - d, 0, 1) ** 2.2 * 0.30
    base = np.zeros((H, W, 3))
    base[..., 0] = BG[0] + ACCENT[0] * glow
    base[..., 1] = BG[1] + ACCENT[1] * glow
    base[..., 2] = BG[2] + ACCENT[2] * glow
    # léger dégradé vertical pour la profondeur
    grad = (np.linspace(-8, 6, H)[:, None] / 255.0)[..., None]
    base = np.clip(base + grad * [1, 1, 2], 0, 255)
    return Image.fromarray(base.astype(np.uint8))


def rounded_card(size, radius, color=(255, 255, 255)):
    """Carte blanche à coins arrondis (avec ombre douce appliquée ensuite)."""
    card = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=color)
    return card


def main():
    bg = dark_bg().convert("RGBA")

    # Carte : logo 1477×878 → taille carte avec padding
    logo = Image.open(LOGO).convert("RGB")
    card_w, card_h = 780, 520
    card = rounded_card((card_w, card_h), radius=44)

    # Ombre douce sous la carte
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    cx0, cy0 = (W - card_w) // 2, (H - card_h) // 2
    sd.rounded_rectangle([cx0 + 6, cy0 + 14, cx0 + card_w + 6, cy0 + card_h + 18],
                         radius=44, fill=(0, 0, 0, 110))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))

    bg = Image.alpha_composite(bg, shadow)

    # Carte blanche
    card_full = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    card_full.paste(card, (cx0, cy0), card)
    bg = Image.alpha_composite(bg, card_full)

    # Logo à l'intérieur (marge ~7 %)
    pad = int(card_w * 0.07)
    max_w, max_h = card_w - 2 * pad, card_h - 2 * pad
    ratio = min(max_w / logo.width, max_h / logo.height)
    lw, lh = int(logo.width * ratio), int(logo.height * ratio)
    logo_r = logo.resize((lw, lh), Image.LANCZOS)
    bg.paste(logo_r, (cx0 + (card_w - lw) // 2, cy0 + (card_h - lh) // 2))

    bg.convert("RGB").save(OUT, "PNG", optimize=True)
    print("→", OUT)


if __name__ == "__main__":
    main()
