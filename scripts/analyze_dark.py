#!/usr/bin/env python3
"""Analyse des blobs noirs (remplissage du bouclier) + composantes sombres."""
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = "/home/z/my-project/public/Albatros aérien et bouclier GPS glossy.png"

im = Image.open(SRC).convert("RGB")
a = np.asarray(im).astype(int)
r, g, b = a[..., 0], a[..., 1], a[..., 2]

# Noir / gris très sombre (le remplissage du bouclier)
dark = (r < 70) & (g < 70) & (b < 70)
print("pixels sombres:", dark.sum())

lab, n = ndimage.label(dark)
sizes = ndimage.sum(dark, lab, range(1, n + 1))
order = np.argsort(sizes)[::-1]
W, H = im.size

for idx in order[:10]:
    comp = lab == (idx + 1)
    ys, xs = np.where(comp)
    bbox = (xs.min(), ys.min(), xs.max(), ys.max())
    fill = comp.sum() / ((bbox[2]-bbox[0]+1) * (bbox[3]-bbox[1]+1))
    print(f"blob {idx+1}: {int(sizes[idx])} px | bbox={bbox} "
          f"(w={bbox[2]-bbox[0]}, h={bbox[3]-bbox[1]}) | densité={fill:.2f} "
          f"| centre rel=({xs.mean()/W:.2f}, {ys.mean()/H:.2f})")
