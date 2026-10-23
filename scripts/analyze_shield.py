#!/usr/bin/env python3
"""Analyse exploratoire : localiser l'anneau de bordure rouge du bouclier
dans l'icône glossy originale, composante par composante."""
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = "/home/z/my-project/public/Albatros aérien et bouclier GPS glossy.png"

im = Image.open(SRC).convert("RGB")
a = np.asarray(im).astype(int)
r, g, b = a[..., 0], a[..., 1], a[..., 2]

# Rouge de marque #E53945 : R élevé, G/B nettement plus bas
red_mask = (r > 140) & (r - g > 50) & (r - b > 50)
print("pixels rouges:", red_mask.sum())

lab, n = ndimage.label(red_mask)
print("composantes:", n)
sizes = ndimage.sum(red_mask, lab, range(1, n + 1))
order = np.argsort(sizes)[::-1]

W, H = im.size
for idx in order[:8]:
    comp = lab == (idx + 1)
    ys, xs = np.where(comp)
    bbox = (xs.min(), ys.min(), xs.max(), ys.max())
    # centrage par rapport à l'image
    cx, cy = (xs.mean() / W, ys.mean() / H)
    print(f"composante {idx+1}: {int(sizes[idx])} px | bbox={bbox} | centre relatif=({cx:.2f}, {cy:.2f})")
