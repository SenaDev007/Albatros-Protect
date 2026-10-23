#!/usr/bin/env python3
"""Allège public/favicon.svg : embarque un PNG 256px au lieu du 1024px
(visuellement identique à l'échelle favicon), en conservant la structure
SVG produite par RealFaviconGenerator."""
import base64
import re
from PIL import Image
import io

SRC = "/home/z/my-project/public/favicon.svg"

with open(SRC, "r") as f:
    svg = f.read()

m = re.search(r'xlink:href="data:image/(\w+);base64,([^"]+)"', svg)
if not m:
    raise SystemExit("pas d'image embarquée trouvée dans favicon.svg")

raw = base64.b64decode(m.group(2))
img = Image.open(io.BytesIO(raw))
print("taille embarquée actuelle :", img.size, "|", len(raw) // 1024, "Ko")

buf = io.BytesIO()
img.resize((256, 256), Image.LANCZOS).save(buf, format="PNG", optimize=True)
new_b64 = base64.b64encode(buf.getvalue()).decode()
print("nouvelle taille embarquée : 256px |", len(buf.getvalue()) // 1024, "Ko")

svg_new = svg[: m.start(2)] + new_b64 + svg[m.end(2):]
with open(SRC, "w") as f:
    f.write(svg_new)
print("favicon.svg réécrit :", len(svg_new) // 1024, "Ko")
