#!/usr/bin/env python3
"""Clip v3 : flancs resserrés au plus près de la bordure réelle de l'écu
pour que les coupures (aile à gauche, bec à droite) tombent SUR la bordure
rouge — plus de fragments flottants dans l'espace blanc.

Bordure (relevé VLM) : gauche externe 34 %, droit externe ~70,5 %,
haut ~4 % (X 35,5→68,5), pointe basse (52 %, 85-87 %), flancs courbés.
"""
from PIL import Image, ImageDraw, ImageFilter

SRC = "/home/z/my-project/public/Albatros aérien et bouclier GPS glossy.png"
OUT = "/home/z/my-project/scripts/masters"

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


def build_poly_pct():
    # Resserré : 0,3-0,6 % au-delà de la bordure externe uniquement
    TL, TR = (35.8, 4.2), (68.2, 4.2)
    LMAX, RMAX = (33.6, 18.0), (71.0, 18.0)
    BOTTOM = (52.0, 86.5)

    poly = []
    poly += bez(TR, (70.9, 4.8), RMAX)          # coin haut-droit → flanc droit
    poly += bez(RMAX, (69.8, 52.0), BOTTOM)     # flanc droit → pointe
    poly += bez(BOTTOM, (34.2, 52.0), LMAX)     # pointe → flanc gauche
    poly += bez(LMAX, (34.1, 4.8), TL)          # flanc gauche → coin haut-gauche
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
    m = 26
    crop = clipped.crop((int(min(xs)) - m, int(min(ys)) - m,
                         int(max(xs)) + m, int(max(ys)) + m))
    s = max(crop.size)
    sq = Image.new("RGB", (s, s), (255, 255, 255))
    sq.paste(crop, ((s - crop.width) // 2, (s - crop.height) // 2))
    master = sq.resize((1024, 1024), Image.LANCZOS)
    master.save(f"{OUT}/candidate-shield-clip-v3.png")
    print("→", f"{OUT}/candidate-shield-clip-v3.png")


if __name__ == "__main__":
    main()
