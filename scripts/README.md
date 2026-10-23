# Pipeline d'identité visuelle — Albatros Protect

Génération des favicons et icônes depuis les logos officiels.

## Sources (dans `public/`)

- `Logo Albatros Protect en vol.png` — logo complet (emblème + typographie), utilisé pour l'og-image
- `Albatros aérien et bouclier GPS glossy.png` — emblème seul, source du favicon et des icônes mobiles

## Pipeline

```bash
# 1. Préparer les masters (crop du contenu, mise au carré)
python3 scripts/prepare_favicon_masters.py
python3 scripts/analyze_dark.py          # (exploration, optionnel)
python3 scripts/build_clip_v3.py        # master bouclier : clip suivant la forme réelle de l'écu

# 2. Générer la suite RealFaviconGenerator (nécessite les paquets npm)
mkdir -p .favicon-work && cd .favicon-work
bun init -y && bun add @realfavicongenerator/generate-favicon \
    @realfavicongenerator/image-adapter-node sharp
cp ../scripts/generate_favicons.mjs . && node generate_favicons.mjs
# → écrit directement dans ../public/

# 3. Alléger favicon.svg (PNG 256px embarqué au lieu de 1024px)
python3 scripts/lighten_favicon_svg.py

# 4. og-image (1200×630) + asset hero + icônes mobiles
python3 scripts/build_og_image.py
python3 scripts/build_brand_asset.py
python3 scripts/build_mobile_icons.py
```

## Choix de design (validés visuellement)

- **Master favicon** : bouclier + épingle GPS (l'oiseau passe devant l'écu — design d'origine),
  clippé exactement sur la forme de l'écu pour éviter tout fragment flottant.
  Les petites tailles (16-48px) ne sont lisibles qu'avec ce cadrage.
- **og-image** : logo complet sur carte blanche, fond sombre #101114 + halo rouge #E53945.
- **Masters conservés** : `masters/master-shield.png` (favicons), `masters/master-logo.png` (og).
- Les markups HTML de référence générés par RFG sont dans `masters/favicon-markups.json`,
  transposés dans l'API Metadata de Next.js (`src/app/layout.tsx`).

## Intégration

- Web : `public/favicon*`, `public/apple-touch-icon.png`, `public/web-app-manifest-*`,
  `public/site.webmanifest`, `public/og-image.png` + métadonnées dans `src/app/layout.tsx`.
- Android : `download/.../res/mipmap-*/ic_launcher*.png` (référencés par AndroidManifest).
- iOS : `download/.../Assets.xcassets/AppIcon.appiconset/` (référencé par Info.plist).
- Hero landing : `public/brand/albatros-en-vol.webp`.
