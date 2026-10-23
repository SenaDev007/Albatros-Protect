#!/usr/bin/env python3
"""Génère les icônes launcher Android (mipmap toutes densités) et iOS
(AppIcon 1024) à partir du master bouclier validé (candidate-shield-clip-v3).
"""
from PIL import Image
import json
import os

MASTER = "/home/z/my-project/scripts/masters/candidate-shield-clip-v3.png"
ANDROID_RES = "/home/z/my-project/download/albatros-protect-android/app/src/main/res"
IOS_ASSETS = ("/home/z/my-project/download/albatros-protect-ios/AlbatrosProtect/"
              "Assets.xcassets/AppIcon.appiconset")

master = Image.open(MASTER).convert("RGB")

# ── Android : mipmap-*/ic_launcher.png + ic_launcher_round.png ──────────
DENSITIES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}

for density, size in DENSITIES.items():
    d = os.path.join(ANDROID_RES, f"mipmap-{density}")
    os.makedirs(d, exist_ok=True)
    icon = master.resize((size, size), Image.LANCZOS)
    icon.save(os.path.join(d, "ic_launcher.png"), optimize=True)
    # Version ronde : le bouclier vertical centré supporte bien le masque cercle
    icon.save(os.path.join(d, "ic_launcher_round.png"), optimize=True)
    print(f"Android mipmap-{density}: ic_launcher.png + ic_launcher_round.png ({size}px)")

# ── iOS : Assets.xcassets/AppIcon.appiconset ─────────────────────────────
os.makedirs(IOS_ASSETS, exist_ok=True)
icon_1024 = master.resize((1024, 1024), Image.LANCZOS)
icon_1024.save(os.path.join(IOS_ASSETS, "AppIcon-1024.png"), optimize=True)

contents = {
    "images": [
        {
            "filename": "AppIcon-1024.png",
            "idiom": "universal",
            "platform": "ios",
            "size": "1024x1024",
        }
    ],
    "info": {"author": "xcode", "version": 1},
}
with open(os.path.join(IOS_ASSETS, "Contents.json"), "w") as f:
    json.dump(contents, f, indent=2)
print("iOS AppIcon.appiconset: AppIcon-1024.png + Contents.json (universal 1024)")

# ── PWA / divers : icône 512 déjà présente (web-app-manifest-512) ─────────
print("Web PWA: web-app-manifest-512x512.png déjà généré par RealFaviconGenerator")
