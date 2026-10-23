#!/usr/bin/env python3
"""Clip suivant la forme RÉELLE de l'écu (flancs courbés, pointe basse).

Géométrie confirmée par VLM (image originale 1774×887, en %) :
  - largeur max des flancs vers Y 18 % ; X gauche ~32, X droit ~72
  - pointe inférieure (52 %, 85-87 %)
  - haut de l'écu Y ~4-5 %, coins arrondis
  - l'aile recouvre la bordure gauche (33-35 %, 45-65 %) et la tête/bec
    recouvrent la bordure droite à partir de X 62-65 % — c'est le design
    d'origine (l'oiseau est devant le bouclier).
"""
from PIL import Image, ImageDraw, ImageFilter

SRC = "/home/z/my-project/public/Albatros aérien et bouclier GPS glossy.png"
OUT = "/home/z/my-project/scripts/masters"

im = Image.open(SRC).convert("RGB")
W, H = im.size


def bez(p0, p1, p2, n=40):
    """Quadratic bezier échantillonnée."""
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
        pts.append((x, y))
    return pts


def build_poly_pct():
    # Points en % du cadre
    TL, TR = (35.5, 4.0), (68.5, 4.0)          # haut (ligne droite)
    LMAX, RMAX = (32.0, 18.0), (72.0, 18.0)    # flancs max
    BOTTOM = (52.0, 87.0)                       # pointe inférieure

    poly = []
    # haut → coin haut-gauche → flanc gauche max
    poly += bez(TR, (71.6, 4.6), RMAX)
    # flanc droit → pointe
    poly += bez(RMAX, (71.5, 58.0), BOTTOM)
    # pointe → flanc gauche max
    poly += bez(BOTTOM, (32.5, 58.0), LMAX)
    # flanc gauche max → coin haut-gauche
    poly += bez(LMAX, (32.4, 4.6), TL)
    # haut gauche → haut droit (fermeture)
    poly += [TL, TR]
    return poly


def main():
    poly_pct = build_poly_pct()
    poly = [(x * W / 100, y * H / 100) for x, y in poly_pct]

    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).polygon(poly, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(3))

    white = Image.new("RGB", im.size, (255, 255, 255))
    clipped = Image.composite(im, white, mask)

    xs = [p[0] for p in poly]
    ys = [p[1] for p in poly]
    m = 28
    crop = clipped.crop((int(min(xs)) - m, int(min(ys)) - m,
                         int(max(xs)) + m, int(max(ys)) + m))
    # carré centré
    s = max(crop.size)
    sq = Image.new("RGB", (s, s), (255, 255, 255))
    sq.paste(crop, ((s - crop.width) // 2, (s - crop.height) // 2))
    master = sq.resize((1024, 1024), Image.LANCZOS)
    master.save(f"{OUT}/candidate-shield-clip-v2.png")
    print("→", f"{OUT}/candidate-shield-clip-v2.png", "| crop:", crop.size)


if __name__ == "__main__":
    main()
