#!/bin/bash
# Validation VLM GO/NO-GO des captures back-office Albatros Protect
declare -a FILES=(
  "download/verification-backoffice/01-bo-systeme.png|Espace Système du back-office : KPI (8 cartes), tableau comptes+rôles, supervision dossiers, journal audit, demandes RGPD"
  "download/verification-backoffice/02-bo-gsm-full.png|Espace GSM du back-office : KPI opérateur, file de demandes SIM/IMEI/localisation avec identifiants masqués, panneau triangulation réseau"
  "download/verification-backoffice/03-bo-gsm-triangulation.png|Triangulation GSM exécutée : carte sombre avec ancres antennes/Wi-Fi, cercles de portée pointillés, position centrale rouge, liste RSSI/distances"
  "download/verification-backoffice/04-bo-police-full.png|Espace Police du back-office : KPI, demandes IMEI autorités, tableau dossiers de vol avec plaintes et boutons d'action"
  "download/verification-backoffice/05-carte-triangulation.png|Carte citoyen : triangulation Wi-Fi/cellulaire active — overlay ancres+cercles pointillés+position triangulée, badge Triangulation active, panneau détail à droite"
)
GO=0; TOTAL=0
for entry in "${FILES[@]}"; do
  f="${entry%%|*}"; desc="${entry#*|}"; TOTAL=$((TOTAL+1))
  OUT=$(mktemp)
  timeout 120 z-ai vision \
    -p "Capture de l'application Albatros Protect (thème sombre noir/rouge). Attendu : ${desc}. Réponds STRICTEMENT en JSON {\"verdict\":\"GO\"|\"NO-GO\",\"problemes\":[\"...\"]}. GO si la capture correspond avec un rendu professionnel lisible (texte lisible, rien de cassé, chevauché ou vide). NO-GO sinon." \
    -i "$f" -o "$OUT" 2>/dev/null
  # Le contenu du modèle est dans .choices[0].message.content (lui-même contenant le JSON du verdict)
  VERDICT=$(python3 -c "
import json,sys,re
try:
  d=json.load(open('$OUT'))
  c=d['choices'][0]['message']['content']
  m=re.search(r'verdict\"\s*:\s*\"(GO|NO-GO)\"', c)
  print(m.group(1) if m else 'PARSE_FAIL')
except Exception as e: print('ERR')
")
  PROBS=$(python3 -c "
import json,re
try:
  d=json.load(open('$OUT'))
  c=d['choices'][0]['message']['content']
  m=re.search(r'\"problemes\"\s*:\s*\[(.*?)\]', c, re.S)
  print((m.group(1)[:150] if m else ''))
except: print('')
")
  [ "$VERDICT" = "GO" ] && GO=$((GO+1))
  echo "${VERDICT} $(basename $f) ${PROBS:+— $PROBS}"
  rm -f "$OUT"
done
echo "RÉSULTAT VLM : $GO/$TOTAL GO"
