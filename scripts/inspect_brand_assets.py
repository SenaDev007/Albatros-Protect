#!/usr/bin/env python3
"""Inspect brand assets: size, mode, alpha coverage, corner colors."""
from PIL import Image

paths = [
    "/home/z/my-project/scripts/masters/master-shield.png",
    "/home/z/my-project/scripts/masters/master-logo.png",
    "/home/z/my-project/public/brand/albatros-en-vol.png",
    "/home/z/my-project/public/favicon.svg",
    "/home/z/my-project/public/apple-touch-icon.png",
    "/home/z/my-project/public/web-app-manifest-192x192.png",
    "/home/z/my-project/public/favicon-96x96.png",
]
for p in paths:
    try:
        im = Image.open(p)
        info = f"{p.split('/')[-1]:36s} {im.size} mode={im.mode}"
        if im.mode in ("RGBA", "LA"):
            a = im.getchannel("A")
            lo, hi = a.getextrema()
            transparent_px = sum(1 for v in a.getdata() if v < 8)
            total = im.size[0] * im.size[1]
            info += f" alpha=[{lo}-{hi}] transparent={transparent_px/total:.1%}"
        else:
            corner = im.convert("RGB").getpixel((0, 0))
            info += f" corner={corner}"
        print(info)
    except Exception as e:
        print(f"{p}: {e}")
