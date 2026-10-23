# Spécification technique — Agent Albatros

**Version :** 1.0 — proposition technique pour le pilote  
**Date :** 22 octobre 2026  
**Nom du projet :** Agent Albatros  
**Zone du pilote :** Cotonou, République du Bénin  
**Appareils couverts :** smartphones, tablettes, PC portables et PC de bureau  
**Systèmes au pilote :** Android, iOS/iPadOS, Windows, macOS et Linux  
**Dépendances géographiques Google obligatoires :** Google Maps Platform Maps API pour la cartographie et Geolocation API pour les estimations Wi‑Fi/cellulaires lorsque des observations compatibles sont accessibles  
**Statut :** spécification de référence à valider avant développement et conformité opérationnelle

## 1. Objet et portée

Cette spécification traduit le cahier des charges fonctionnel en architecture, composants logiciels, interfaces, flux de données, exigences de sécurité et règles de compatibilité. Elle définit le pilote béninois de la plateforme de recherche et récupération d’appareils, avec une zone opérationnelle initiale à Cotonou.

La livraison pilote comprend :

- un portail web et une console opérationnelle ;
- des applications installables Android et iOS/iPadOS ;
- un agent PC pour Windows, macOS et Linux ;
- un backend sécurisé et une base géospatiale ;
- une page cartographique dédiée ;
- l’intégration de Google Maps Platform Geolocation API, appelée quand les données d’entrée compatibles, autorisées et disponibles sont présentes ;
- le support des dossiers de perte/vol, des cercles de confiance, de la détection BLE propre au projet et des échanges avec opérateurs/autorités lorsqu’ils auront été autorisés par accords locaux.

**Couverture de lancement de toutes les plateformes ne signifie pas parité de fonctionnalités.** Chaque système doit avoir un client utilisable et testé. Les intervalles de localisation, le balayage Wi‑Fi, le Bluetooth en arrière-plan et les possibilités d’agent varient selon l’OS, le matériel et les permissions. L’interface doit montrer les capacités réellement actives et ne jamais garantir une détection permanente.

Le service ne cherche pas à accéder aux positions privées de Google Find Hub ou Apple Find My. Les outils officiels des fabricants peuvent seulement être ouverts comme services externes, à la demande du propriétaire. Les données réseau détenues par un opérateur ne seront obtenues que par ses procédures autorisées et le cadre légal applicable.

## 2. Décisions produit retenues

| Sujet | Décision du pilote |
|---|---|
| Territoire | Cotonou. Le signalement peut être créé ailleurs, mais l’accompagnement opérationnel et les mesures du pilote portent sur Cotonou. |
| Catégories d’appareils | Smartphones, tablettes, PC portables et ordinateurs de bureau. |
| Systèmes | Android, iOS/iPadOS, Windows 11 ; Windows 10 uniquement si la version reste couverte par un support de sécurité actif, macOS pris en charge et Linux desktop sur distributions explicitement qualifiées. |
| Cartographie | Google Maps Platform obligatoire ; vues plan, satellite/hybride et 3D selon disponibilité, droits et compatibilité. |
| Localisation Google | Google Maps Platform Geolocation API obligatoire dans l’architecture et intégrée au produit ; appel effectif seulement avec des observations d’entrée valides et autorisées. |
| Réseau BLE | Réseau communautaire propriétaire au projet, facultatif et soumis aux capacités système en arrière-plan. Aucune dépendance à Find Hub/Find My. |
| Partenaires | Opérateurs mobiles béninois et autorités locales, avec ARCEP/APDP pour le cadrage. Aucune intégration OEM ni accès aux réseaux privés de localisation des fabricants. |
| Position opérateur | Flux uniquement par accord et procédure légale appropriée. Aucun accès libre ou direct aux systèmes opérateur. |
| Identité d’appareil | Identifiant aléatoire propre au service comme identifiant primaire ; IMEI et numéro de série sont des données déclaratives/justificatives, pas des clés de suivi garanties par l’OS. |

## 3. Architecture générale

### 3.1 Vue logique

```text
Applications et agents appareils
  Android / iOS-iPadOS / Windows / macOS / Linux
      │  HTTPS, jetons courts, observations signées
      ├── localisation OS (GNSS/Wi-Fi/réseaux fusionnés par OS)
      ├── balayage Wi-Fi/cellulaire lorsqu'autorisé et disponible
      ├── scan/émission BLE pour le réseau propre au service
      └── diagnostics de permission, état réseau et version
      │
      ▼
API Agent Albatros (modular monolith au pilote)
  Authentification ─ Registre appareils ─ Incidents ─ Consentements
  Ingestion localisation ─ Adaptateur Google Geolocation API
  Corrélation BLE ─ Dossier partenaire ─ Notifications ─ Audit
      │
      ├── PostgreSQL + PostGIS
      ├── stockage objet chiffré pour justificatifs
      ├── file de travaux pour traitements asynchrones
      └── passerelle opérateur/autorités (d’abord dossier contrôlé, puis API si convenue)
      │
      ▼
Portail et application
  Tableau de bord ─ Carte Google Maps ─ Historique/observations
  Dossier de vol ─ Cercles ─ Statuts ─ Export
```

### 3.2 Principes d’architecture

1. **API commune, collecteurs natifs.** Le contrat de données, les règles métier et la sécurité sont communs. Les appels aux services de localisation, Bluetooth et Wi‑Fi sont implémentés par adaptateurs natifs propres à chaque OS.
2. **Monolithe modulaire au pilote.** Les domaines sont séparés dans le code, mais déployés dans un service backend principal pour réduire les coûts et la complexité opérationnelle. Le traitement d’images/documents et les tâches longues peuvent utiliser des workers distincts.
3. **Source et incertitude conservées.** Une position, un fix GNSS, un résultat Google Geolocation, une observation BLE et une réponse opérateur sont stockés comme types d’observation distincts. Aucun point unique ne remplace les mesures originales.
4. **Panne d’une source sans panne du service.** Si l’API Google ou le backend est indisponible, le client conserve localement une file limitée d’observations et réessaie selon une politique contrôlée ; l’interface indique la fraîcheur réelle.
5. **Droits d’accès par dossier et finalité.** La visibilité des coordonnées dépend de la propriété vérifiée, du mode incident et d’un partage expressément consenti.

### 3.3 Choix technologiques recommandés

- **Portail web :** React + TypeScript, application responsive ; Google Maps JavaScript API ; authentification OIDC/OAuth ou sessions web sécurisées.
- **Android :** application native Kotlin ; LocationManager ou Fused Location Provider si disponible ; Bluetooth LE public Android ; accès Wi‑Fi/cellulaire seulement lorsque les permissions et l’OS le permettent.
- **iOS/iPadOS :** application native Swift ; Core Location et CoreBluetooth. Les tâches en arrière-plan doivent respecter les modes Apple ; aucun suivi continu garanti.
- **Windows :** agent/application empaqueté pour Windows 11 (Windows 10 uniquement sur éditions encore couvertes par un support de sécurité actif) ; Windows.Devices.Geolocation.Geolocator ; WiFiAdapter pour les observations Wi‑Fi lorsque consentement et permissions sont accordés ; BLE Windows selon le matériel et la capacité de fond.
- **macOS :** application native signée et notarized ; Core Location, CoreBluetooth et CoreWLAN lorsque disponibles et autorisés.
- **Linux :** agent natif utilisant GeoClue 2 via D‑Bus pour la localisation et BlueZ via D‑Bus pour le BLE. Les distributions et bureaux pris en charge doivent être nommés dans une matrice publiée ; Ubuntu LTS x86_64 est la cible de qualification recommandée, les autres distributions compatibles étant validées par tests.
- **Backend :** API REST JSON documentée par OpenAPI ; langage/runtime TypeScript/NestJS ou équivalent retenu avant développement ; PostgreSQL avec PostGIS ; stockage objet compatible S3 ; file de tâches ; gestion des secrets par coffre KMS/secret manager.
- **Hébergement :** conteneurs OCI avec environnements séparés. Fournisseur et région ne sont pas imposés ici ; le choix est conditionné à l’analyse APDP, aux transferts éventuels hors Bénin, au budget, à la disponibilité et au plan de réversibilité.

L’architecture ne doit pas dépendre d’une lecture universelle d’IMEI, de numéro de série, de MAC ou de BSSID. Les API des systèmes imposent des restrictions importantes et diffèrent selon OS/version.

## 4. Composants logiciels

### 4.1 Portail citoyen

Fonctions : création/récupération de compte ; gestion d’appareils ; assistant de préparation ; consentements ; déclaration d’incident ; page de localisation ; historique ; cercles de confiance ; actions de sécurisation ; export d’un dossier ; demande de suppression/rectification.

L’interface doit être légère, exploitable sur mobile et connexion modeste, et séparer clairement les statuts « position directe », « estimation Wi‑Fi/cellulaire », « détection Bluetooth » et « position communiquée par partenaire ».

### 4.2 Applications mobiles

Les clients mobiles gèrent l’enrôlement, la demande des autorisations, la collecte des positions prévues par les réglages, le mode incident, le scan et l’annonce BLE propres au service, l’envoi différé et les notifications. Chaque permission doit être demandée au moment où l’utilisateur en comprend le bénéfice ; les réglages peuvent être retirés sans perdre l’accès à l’inventaire ni au dossier.

### 4.3 Agents PC

L’agent PC est installé avant la perte/le vol, associé au compte et visible dans les applications installées. Il doit :

- démarrer selon les mécanismes et consentements du système ;
- demander la localisation OS, sans contourner les autorisations ;
- transmettre des observations à intervalle piloté et les mettre temporairement en file hors ligne ;
- exposer un état lisible (agent actif, localisation autorisée, réseau, BLE compatible, dernière transmission) ;
- ne pas se cacher, empêcher abusivement sa suppression ni installer de persistance non consentie ;
- s’interrompre lorsqu’il est désinstallé, lorsque l’ordinateur est éteint ou lorsque ses accès sont révoqués.

### 4.4 Console opérateur/autorité

Aucune console partenaire n’est activée avant accord. Au pilote, un dossier peut être préparé par la plateforme puis remis par le propriétaire via le canal officiel. Toute future console ou API partenaire doit utiliser des rôles nominatifs, MFA, journal d’audit, motif de consultation, base légale et contrôle à deux personnes pour les données de localisation les plus sensibles.

## 5. Modèle de données

### 5.1 Entités principales

- `User`: identifiant interne, coordonnées de vérification, statut du compte, paramètres de langue et sécurité.
- `Device`: `device_id` aléatoire, propriétaire, catégorie, marque, modèle, OS/version, date d’enrôlement, statut et état de préparation.
- `DeviceIdentifier`: type (IMEI, serial, facture, identifiant déclaré), valeur chiffrée, empreinte HMAC pour recherche exacte, état de vérification, source de preuve. Ne jamais exposer la valeur complète dans les logs.
- `ConsentRecord`: personne, appareil, finalité, permission, version du texte, choix, horodatage, révocation.
- `LocationObservation`: `observation_id`, `device_id`, type de source, latitude, longitude, précision/rayon, collecte/reception timestamps, source OS, mode, méthode, état de qualité, signature client.
- `RadioObservation`: observations minimales Wi‑Fi/cellulaires nécessaires à l’appel Google, horodatage, consentement, statut d’envoi et TTL très court. La valeur brute n’est pas conservée après traitement sauf justification approuvée.
- `BleEncounter`: identifiant rotatif reçu, heure, RSSI si disponible, localisation du détecteur avec précision, état de validation et statut de transmission.
- `Incident`: catégorie perte/vol, appareil, temps/lieu déclarés, description, statut, vérification, dossier d’autorité si communiqué.
- `PartnerRequest`: opérateur/autorité, base et motif, demande, pièces nécessaires, état, approbateur, transmission et réponse.
- `Circle`, `CircleMembership`, `ShareGrant`: invitation, consentement, données partagées, échéance et révocation.
- `Document`: métadonnées, emplacement objet chiffré, propriétaire, finalité, TTL et journal d’accès.
- `AuditEvent`: acteur, action, objet, résultat, date, motif et empreinte d’intégrité.

### 5.2 Exemple d’observation de localisation

```json
{
  "observation_id": "uuid-v4",
  "device_id": "opaque-service-id",
  "source": "native_location | google_geolocation | ble_witness | operator_authorized",
  "captured_at": "RFC3339 UTC",
  "received_at": "RFC3339 UTC",
  "latitude": 6.37,
  "longitude": 2.39,
  "accuracy_radius_m": 85,
  "confidence_label": "estimated",
  "source_age_seconds": 0,
  "incident_id": "optional-id",
  "integrity_signature": "detached-signature"
}
```

Coordonnées illustratives uniquement. `accuracy_radius_m` ne doit être renseigné que si fourni ou calculé par une méthode spécifiée ; à défaut, l’API stocke `null` et l’interface indique que la précision est inconnue.

### 5.3 Protection des données

Les positions brutes sont conservées selon une période courte, à définir avec l’APDP et les partenaires. Les coordonnées ne sont pas utilisées pour créer des profils d’itinéraire permanents. Les identifiants matériels sont chiffrés au niveau applicatif ou KMS et leur accès est séparé du rôle de support. Les données de radio-scan utilisées par Google sont supprimées dès que le traitement et les besoins de preuve prévus sont satisfaits, selon les durées approuvées.

## 6. Contrats API

Toutes les routes sont servies en HTTPS. Les routes sensibles exigent authentification, autorisation par ressource, protection CSRF sur les sessions web, validation de schéma, limites de débit et journaux d’audit sans données sensibles.

### 6.1 Endpoints métier proposés

- `POST /v1/auth/otp/start`, `POST /v1/auth/otp/verify` : authentification/téléphone.
- `GET/POST /v1/devices`, `GET/PATCH/DELETE /v1/devices/{deviceId}` : enrôlement et gestion.
- `POST /v1/devices/{deviceId}/enrollment/complete` : finalisation après confirmation d’identité et consentements.
- `POST /v1/consents`, `DELETE /v1/consents/{consentId}` : collecte et révocation.
- `POST /v1/observations/location` : fix natif ou fix Google validé par le client ; idempotence par observation.
- `POST /v1/observations/radio` : envoi sécurisé d’observations Wi‑Fi/cellulaires minimales pour traitement Google, avec consentement et TTL.
- `POST /v1/observations/ble` : relais d’une rencontre BLE avec identifiant rotatif et signature d’agent.
- `POST /v1/incidents`, `GET/PATCH /v1/incidents/{incidentId}` : signalement et suivi.
- `GET /v1/incidents/{incidentId}/map` : observations autorisées, triées et filtrables.
- `POST /v1/circles`, `POST /v1/circles/{circleId}/invitations` : gestion des cercles.
- `POST /v1/share-grants`, `DELETE /v1/share-grants/{grantId}` : partage limité/expirant.
- `POST /v1/incidents/{incidentId}/partner-requests` : préparation d’une demande opérateur/autorité, inactive sans accord.
- `GET/POST /v1/documents` : pièces justificatives via URL de dépôt signée et durée limitée.
- `POST /v1/privacy/requests` : demandes de droits et de suppression.

Toutes les réponses de localisation doivent inclure `source`, `captured_at`, `received_at`, `accuracy_radius_m` si connu et un code de qualité. Éviter les réponses au format « latitude/longitude uniquement ».

### 6.2 Idempotence, sécurité et erreurs

Les envois sont idempotents à l’aide d’un identifiant de requête. Erreurs types : `PERMISSION_MISSING`, `LOCATION_UNAVAILABLE`, `RADIO_INPUT_UNAVAILABLE`, `GOOGLE_QUOTA_EXCEEDED`, `GOOGLE_PROVIDER_UNAVAILABLE`, `DEVICE_NOT_ENROLLED`, `INCIDENT_NOT_VERIFIED`, `CONSENT_REVOKED`, `PARTNER_FLOW_NOT_ENABLED`. Un code erreur ne doit jamais transformer une dernière observation en localisation actuelle.

## 7. Google Maps Platform Geolocation API — intégration obligatoire

### 7.1 Fonctionnement attendu

Google Geolocation API reçoit des observations Wi‑Fi et/ou cellulaires structurées, estime latitude/longitude et renvoie un rayon d’incertitude. Elle ne collecte pas elle-même les points Wi‑Fi ou les informations de cellule et ne donne pas accès au cœur de réseau d’un opérateur [1][2]. La réponse est un fournisseur de localisation distinct de Core Location, Android Location Services, Windows Geolocator et GeoClue.

Le service doit intégrer l’adaptateur Google dans le backend et l’utiliser lorsque des données d’entrée compatibles, exactes, autorisées et suffisamment fraîches sont disponibles. L’API fait partie du produit du pilote ; elle n’est pas une étude facultative. Cependant, chaque appel est conditionné par les données disponibles et les permissions du système. Si aucun jeu valide de radio-observations n’est disponible, aucun appel ne doit être fabriqué.

### 7.2 Politique d’appel

1. Collecter un fix natif via l’API de plateforme lorsque l’utilisateur a autorisé la position.
2. Si l’appareil expose légalement les données Wi‑Fi/cellulaires nécessaires, normaliser les observations et vérifier leur fraîcheur/format.
3. Appeler Google Geolocation API lorsqu’un appel est justifié : absence de fix natif exploitable, contrôle de cohérence en mode incident ou données radio sensiblement nouvelles, selon une politique de fréquence réglable.
4. Persister uniquement le résultat, la provenance, le rayon de précision, les horodatages, le statut de requête et la métadonnée utile d’audit. Supprimer les observations brutes après traitement selon la politique de rétention validée.
5. Conserver séparément la position native et l’estimation Google ; ne pas les fusionner automatiquement si elles sont contradictoires.
6. En cas de réponse de repli basée sur IP, la traiter comme un résultat très approximatif distinct. Par défaut, ne pas activer ce repli pour une carte de récupération sans l’indiquer explicitement.

La requête Google peut inclure les champs Wi‑Fi et/ou cellules prévus par son schéma. Les identifiants cellulaires doivent être fournis sous forme conforme au type de réseau et à la documentation actuelle. Pour Wi‑Fi, les BSSID/MAC et niveaux de signal doivent provenir d’observations réellement obtenues par le client. L’API peut écarter des observations invalides ou insuffisantes [2].

### 7.3 Disponibilité par système d’exploitation

| Système | Source native de localisation | Entrées potentielles pour Google Geolocation | Conséquence pour le pilote |
|---|---|---|---|
| Android | LocationManager/FLP, coordonnées et précision natives. | Scans Wi‑Fi BSSID/RSSI sous permissions et avec limitations de scan ; certaines informations cellulaires selon permission, modèle et radio. | Intégration obligatoire ; appeler sur radio-observations utilisables. Le scan Wi‑Fi en arrière-plan peut être fortement limité, donc le volume d’appels sera inférieur au nombre de positions natives. [3][4] |
| iOS/iPadOS | Core Location ; l’OS fusionne ses propres sources et remet un fix à l’app. | Accès aux informations Wi‑Fi courantes très conditionnel ; pas de scan libre voisinage ni API publique générale confirmée pour cellules voisines. | Adapter intégré, appels uniquement si inputs compatibles réellement accessibles. Core Location reste la voie nominale ; ne jamais annoncer que l’API Google fonctionnera pour chaque iPhone/iPad. [5][6] |
| Windows | Windows Geolocator. | BSSID/RSSI via WiFiAdapter sous autorisations de localisation/Wi‑Fi ; données cellulaires non génériques sur PC sans modem/accès spécifique. | Appeler si Wi‑Fi scan valide et permis. Pas de dépendance aux données cellulaires pour un PC standard. [7][8] |
| macOS | Core Location. | Scan de réseaux via CoreWLAN sur matériels/cas autorisés ; aucune collecte cellulaire brute générique confirmée. | Appeler si les données Wi‑Fi compatibles sont disponibles ; tester sur versions/mac matériels visés. [9][10] |
| Linux desktop | GeoClue 2 via D‑Bus et fournisseur disponible dans la distribution. | Les observations radio dépendent des interfaces, du gestionnaire Wi‑Fi, de la distribution, du matériel et de permissions ; aucune API commune à toutes distributions. | Intégration obligatoire, invocation conditionnelle. Définir une liste de distributions certifiées et une voie dégradée GeoClue. [11][12] |

### 7.4 Sécurité, coût et quotas Google

- Créer un projet Google Cloud dédié au produit et activer les API nécessaires.
- Activer facturation, quotas et alertes de dépense avant production. L’API Geolocation est facturée à l’usage par requête et les quotas peuvent arrêter le service lorsqu’ils sont atteints [13].
- Ne pas embarquer la clé d’un web service dans les applications mobiles ou dans un agent PC. L’appel à Geolocation API passe par le backend ; secrets stockés dans un gestionnaire de secrets, rotation et restriction à l’API/projet.
- Pour Google Maps affiché côté navigateur, utiliser une clé distincte restreinte au domaine ; pour SDK natifs, clés distinctes restreintes par application/package/signature selon les mécanismes Google.
- Appliquer quotas par utilisateur/appareil, limites de débit, détection d’abus et budget maximal quotidien configurable. Prévoir un coupe-circuit et un statut de dégradation.
- Informer explicitement l’utilisateur que des observations Wi‑Fi/cellulaires nécessaires au calcul sont transmises à un fournisseur tiers, obtenir les choix/consentements requis et accomplir les formalités APDP applicables.
- Ne pas considérer un « crédit gratuit » comme permanent ; la spécification financière doit utiliser la grille tarifaire en vigueur à la date de déploiement.

## 8. Page carte et moteur de fusion

### 8.1 Fond de carte

La page web utilise Maps JavaScript API ; les applications mobiles évaluent les SDK Google Maps Platform natifs. Affichages : carte routière, satellite/hybride et vue 3D lorsque disponible. Google Maps JavaScript API prend en charge cartes interactives 2D/3D, marqueurs et couches de données [14]. Earth Engine n’est pas un fournisseur de suivi en temps réel et aucune fusion de fonds cartographiques ne rend les coordonnées plus exactes.

### 8.2 Couches et symboles

- Position de l’agent ciblé : couleur dédiée, date, source et rayon.
- Réponse Google Geolocation : symbole distinct et rayon d’incertitude fourni.
- Détection BLE : point du téléphone détecteur et indication « appareil détecté à proximité », jamais « GPS de l’appareil volé ».
- Réponse opérateur : zone/point selon le format remis et son incertitude.
- Dernière position connue : symbole estompé et horodatage ancien.
- Plusieurs sources discordantes : afficher séparément, avec filtre temporel, au lieu d’un point fusionné artificiel.

La page inclut filtre appareil/incident/source/période, curseur temporel, légende, affichage de la précision, état de dernière mise à jour, export du dossier et un contrôle de partage de position. Aucun marqueur précis n’est rendu accessible aux membres du cercle sans accord de partage explicite.

### 8.3 Fusion des observations

Le moteur de positionnement est distinct du rendu cartographique. Il conserve chaque observation et peut calculer une estimation de zone probable uniquement lorsque des mesures compatibles sont suffisamment récentes et indépendantes. L’estimation expose les sources utilisées, leur âge, la méthode et une incertitude explicable. Les méthodes et seuils sont versionnés et doivent être validés sur des tests à Cotonou.

Une triangulation radio réellement exploitable nécessite des mesures appropriées, plusieurs points de référence et un modèle de propagation suffisamment connu. Un scan BLE isolé, une carte satellite ou un zoom 3D ne suffisent pas. Une localisation par antennes cellulaires nécessite des mesures réseau que seul l’opérateur peut communiquer dans le cadre autorisé. Jusqu’à validation terrain, le terme UI doit être « estimation de zone » plutôt que « triangulation précise ».

## 9. Collecte répétée et profils d’énergie

Le rythme de collecte est dynamique et piloté par configuration serveur, mais le système d’exploitation conserve le dernier mot. Aucun intervalle n’est garanti quand l’app est suspendue, le PC en veille ou une permission retirée.

| Profil | Comportement technique proposé |
|---|---|
| Préparé — normal | Utiliser les callbacks système/événements significatifs, détection de mouvement et synchronisation à fréquence modérée. Éviter l’interrogation GPS en boucle. Garder le BLE selon choix utilisateur et profil d’énergie. |
| Incident — appareil déclaré perdu | Augmenter la demande de mises à jour lorsque l’OS l’autorise, avec plafonds de fréquence et notification/indication visible requise. Collecter les détections BLE et synchroniser dès que possible. |
| Hors ligne | Mise en attente locale chiffrée, limitée en volume et durée ; ordre chronologique au retour du réseau ; déduplication et conservation de l’heure de capture originale. |
| Batterie faible / économie d’énergie | Réduire la fréquence, mettre en pause les scans énergivores ou avertir l’utilisateur, sauf choix légalement/techniquement soutenable en incident. |
| Permission révoquée / capteur absent | Arrêter la collecte concernée, afficher l’état exact et proposer l’étape pour réactiver. Ne pas tenter de contourner le réglage. |

Les valeurs numériques initiales (intervalle, distance de déplacement, TTL radio et seuil batterie) sont des paramètres de pilote à arrêter après prototype multi-OS, audit APDP et mesure d’autonomie. Elles ne doivent pas être présentées comme une fréquence garantie identique sur les cinq systèmes.

### 9.1 Demande d’extinction, indisponibilité et photo

Les applications standard Android et iOS/iPadOS ne peuvent pas remplacer universellement l’écran système d’extinction, bloquer l’appui long sur le bouton d’alimentation ni exiger leur propre authentification avant l’arrêt. Une telle fonction exigerait un privilège ou un soutien spécifique du système/fabricant et sort du périmètre du pilote, qui ne prévoit pas d’accord OEM. L’authentification d’Agent Albatros protège les actions effectuées dans l’application ; elle ne contrôle pas l’interface d’alimentation de l’OS.

Android définit `ACTION_SHUTDOWN` comme une diffusion lors de l’arrêt. Le client peut tenter d’enregistrer/transmettre un événement quand ce signal est reçu et que le système, le réseau et le temps le permettent. C’est un mécanisme best effort : il n’annule pas l’arrêt et ne garantit pas l’envoi réseau. iOS/iPadOS ne fournit pas dans le périmètre des API publiques retenues un signal universel « l’utilisateur a pressé Éteindre » ; l’application peut simplement passer en arrière-plan puis être suspendue ou terminée. [18] [21]

Le backend utilise les transmissions périodiques comme indicateur de disponibilité. Après une fenêtre de grâce configurable, il peut afficher « non joignable » ou « dernière connexion reçue à… ». Il ne doit pas appeler cet état « téléphone éteint » ni « téléphone volé » sans preuve. Si Android rapporte un événement d’arrêt, l’interface le présente comme un événement déclaré par l’OS, avec heure et réserve sur sa fiabilité. La dernière position reste horodatée comme dernière position connue.

**La capture automatique ou dissimulée d’une photo est exclue.** Android soumet l’accès caméra à une permission d’usage et aux restrictions « while-in-use » : un service caméra ne peut généralement pas être créé quand l’application est déjà en arrière-plan. Apple interdit l’usage caméra en arrière-plan ; ses règles de revue exigent le consentement explicite et une indication visuelle et/ou sonore claire lorsqu’une application enregistre ou fait un enregistrement d’activité. Photographier silencieusement quelqu’un au moment d’un arrêt forcé n’est donc ni fiable sur tous les OS ni acceptable dans le pilote. [19] [20] [22] [23]

En remplacement, le produit peut offrir un « statut d’appareil protégé » activé à l’avance : alerte de perte de contact après un délai configurable, dernière position déjà connue, notification à un contact de confiance si le propriétaire l’a préalablement autorisée et instructions de sécurisation du compte/SIM. L’alerte ne révèle aucune image ni identité supposée du détenteur. Toute fonction caméra distincte nécessiterait une étude juridique et confidentialité séparée et ne pourrait pas être déclenchée clandestinement par l’extinction.


## 10. Spécifications par plateforme

### 10.1 Android (smartphones et tablettes)

- Native Kotlin ; prise en charge des versions Android courantes validées en matrice de test. Le minimum exact est à choisir avant codage.
- Localisation avec LocationManager et/ou Fused Location Provider. Demander COARSE/FINE et, si la fonction principale l’exige, BACKGROUND_LOCATION avec justification explicite. Respecter choix de localisation approximative et paramètres système.
- Toute collecte continue en tâche de fond exige stratégie conforme : service de premier plan approprié avec notification persistante, ou callbacks de scan adaptés ; aucun travail permanent invisible. La permission caméra ne permet pas une capture cachée lors de l’arrêt ; les services caméra ont des restrictions « while-in-use » et ne peuvent pas être démarrés en arrière-plan comme contournement. [19] [20]
- Android 12+ : permissions runtime `BLUETOOTH_SCAN` et `BLUETOOTH_ADVERTISE`; gérer les versions antérieures. Ne pas utiliser une permission déclarant que le scan BLE ne sert pas à la localisation si le produit en déduit une proximité.
- Scan Wi‑Fi selon `ACCESS_FINE_LOCATION`, état des services, restrictions de scan et restrictions arrière-plan. Les scans Wi‑Fi peuvent être fortement limités ; ne pas promettre un appel Geolocation par mise à jour GPS.
- IMEI/serial sont restreints pour applications ordinaires ; enrôlement par utilisateur et identifiant opaque de service.
- Soumettre à Google Play la justification et les divulgations de permission d’arrière-plan. L’acceptation par le magasin est un risque du lancement, pas une certitude documentaire.

### 10.2 iOS/iPadOS (iPhone et iPad)

- Application Swift native, Core Location, CoreBluetooth et SDK Maps.
- Demande de permission When In Use/Always selon la nécessité, modes d’arrière-plan correspondants, texte d’usage Info.plist précis et configuration Apple Review. L’OS peut suspendre, différer ou terminer l’application ; « Always » n’est pas un SLA. L’usage caméra est indisponible en arrière-plan ; aucune capture lors d’une demande d’extinction ne sera conçue. [21] [22] [23]
- CoreBluetooth en arrière-plan exige les modes centraux/périphériques appropriés. Le scan doit rechercher des UUID de services ; les découvertes peuvent être regroupées ; les annonces d’arrière-plan sont restreintes et ne transportent pas un payload arbitraire comme au premier plan [5][6].
- Ne pas s’appuyer sur un scan de voisinage Wi‑Fi ou sur des cellules brutes. Utiliser les observations iOS accessibles légalement s’il en existe ; sinon appeler l’API Google seulement si un jeu compatible est présent et utiliser Core Location pour la position nominale.
- IMEI et numéro de série ne sont pas des identifiants disponibles pour une application App Store ordinaire. Un ID d’installation propriétaire ou IDFV réinitialisable est utilisé avec le compte.
- Les messages doivent informer de l’usage de localisation en arrière-plan et préserver le contrôle et la révocation.

### 10.3 Windows (PC et tablettes — Windows 11 cible principale)

- Application empaquetée/agent Windows ; Windows 11 est la cible de référence. Windows 10 n’est pris en charge que sur les éditions encore couvertes par un support de sécurité actif et après qualification. Utiliser Windows.Devices.Geolocation.Geolocator et demander le consentement via `RequestAccessAsync` depuis le contexte approprié.
- `WiFiAdapter.ScanAsync` peut fournir BSSID/RSSI quand l’adaptateur et l’autorisation/Location service le permettent. Les données cellulaires ne sont pas une capacité générique des PC Windows.
- BLE par BluetoothLEAdvertisementWatcher et BluetoothLEAdvertisementPublisher. Les tâches BLE d’arrière-plan existent mais sont best-effort et dépendent du matériel et du type d’application. Une app UWP peut être suspendue ; un agent bureau ne fonctionne que tant que son processus reste vivant.
- Les capacités prolongées ne doivent pas être traitées comme un moyen de dissimuler un agent ou de garantir un suivi permanent.
- Windows 10 Mobile n’est pas une cible smartphone actuelle du pilote.
- Ne pas dépendre d’IMEI, serial ou MAC universels. Utiliser ID d’installation propre au service ; une identification matérielle spécifique peut être facultative, transparente et non probante.

### 10.4 macOS (Mac portables et fixes)

- Application native signée/notarisée, Core Location, CoreBluetooth et CoreWLAN selon fonctions autorisées.
- macOS permet à un processus lancé de rester en arrière-plan plus librement qu’iOS, mais le Mac en veille/arrêt, la fermeture de session, la fin du processus, la suppression de l’app ou la révocation des permissions interrompent la collecte.
- CoreWLAN peut exposer des données Wi‑Fi/BSSID dans certains contextes ; tester droits, sandbox et versions supportées. Aucune collecte cellulaire brute générale ne doit être supposée.
- BLE: publicité/scan/CoreBluetooth ont des limites de payload et d’arrière-plan ; tester précisément l’émetteur/récepteur selon le matériel visé.
- L’IMEI n’est pas pertinent sans modem cellulaire. Le serial ne doit pas devenir un prérequis d’application consommateur ; récupération MDM est hors périmètre.

### 10.5 Linux desktop

- Le support Linux est un contrat de compatibilité par distribution, pas une garantie uniforme pour chaque distribution et bureau.
- Agent installé sous compte utilisateur, lancé par mécanisme systemd user ou équivalent explicitement consenti. Localisation via GeoClue 2 D‑Bus, avec `DesktopId` et consentement du fournisseur de localisation.
- BLE via BlueZ D‑Bus (`Adapter1` discovery, `LEAdvertisingManager1` advertisement). Valider permissions, état rfkill, contrôleur, firmware, rôles BLE et capacité à scanner/annoncer simultanément.
- Les points d’accès Wi‑Fi bruts et les permissions diffèrent selon NetworkManager, bureau, distribution, sandbox et matériel. Aucune disponibilité universelle n’est supposée pour Google Geolocation.
- Répertoire de versions et packaging exigés avant annonce : Ubuntu LTS x86_64 qualifié en premier ; autres distributions déclarées supportées après test. Les systèmes non qualifiés restent « non vérifiés ».
- Pas d’IMEI universel ; certains serials DMI peuvent manquer ou nécessiter privilèges. Ne pas demander `root` uniquement pour construire une identité d’appareil.

## 11. Protocole BLE communautaire du projet

### 11.1 Rôles

- **Émetteur-cible :** app/agent d’un appareil enrôlé et déclaré perdu qui annonce un identifiant temporaire lorsque l’OS et le Bluetooth l’autorisent.
- **Détecteur :** app/agent d’un autre appareil inscrit au réseau qui scanne, observe un identifiant compatible et crée une détection.
- **Serveur de résolution :** vérifie que l’identifiant temporaire correspond à un appareil déclaré par son propriétaire et que l’observation provient d’un détecteur autorisé.

### 11.2 Exigences du protocole

- Identifiant pseudonyme temporaire, rotation définie en spécification cryptographique ultérieure, non dérivable du nom, numéro, IMEI ou compte.
- Aucune donnée de propriétaire, de téléphone ou d’incident dans la publicité BLE en clair.
- Chaque observation inclut token temporaire, heure, RSSI/niveau radio s’il est fourni, position du détecteur avec précision et état de consentement.
- Signature ou authentification de l’agent détecteur, prévention du rejeu, limite de fréquence et mécanisme de révocation des appareils abusifs.
- Transmission TLS au backend. File hors ligne locale chiffrée et purge après accusé réception/TTL.
- Une observation isolée devient une « détection de proximité », pas une position GPS de la cible ni une triangulation.
- Les fabricants/systèmes imposent des restrictions spécifiques (BLE advertising iOS, cycles background, tâches Windows/Linux) ; le protocole doit s’adapter et permettre la désactivation par utilisateur.

Le mécanisme de rotation et de résolution de pseudonymes doit être conçu ou audité par un spécialiste cryptographie et sécurité avant production. Ne pas inventer un algorithme cryptographique maison sans audit.

## 12. Parcours opérateur et autorités

### 12.1 Étape sans API partenaire

Tant qu’aucun accord opérationnel n’est signé : génération par le propriétaire d’un dossier horodaté, vérification interne de cohérence, export PDF/JSON, et instructions vérifiées pour contacter l’opérateur et la police. La plateforme n’envoie pas de requête de position aux réseaux et ne se présente pas comme un système officiel de police.

### 12.2 Étape avec conventions

Après accords : créer un adaptateur par opérateur et un workflow autorité. L’adaptateur ne prévoit aucun endpoint jusqu’à ce que partenaire, champs, mécanisme d’authentification, signatures, formats, SLA, motifs de refus et règles de conservation soient confirmés. Les demandes comprennent identifiant dossier, preuve de propriété, preuve officielle requise, IMEI/numéro concerné, motif et validation d’habilitation. Toute localisation réseau revient avec source, heure, précision/zone et autorité répondante.

Les opérateurs béninois cités dans le cahier des charges sont MTN Bénin, Moov Africa Bénin et Celtiis/SBIN ; leur participation n’est pas acquise. La liste et les contacts doivent être revérifiés auprès de l’ARCEP avant lancement.

## 13. Sécurité technique

### 13.1 Identité et enrôlement

- Authentification initiale par OTP téléphone ou email vérifié ; MFA/passkey pour actions de sécurité si supporté.
- L’enrôlement lie un compte et un appareil par défi à usage unique, approbation du compte, confirmation sur l’appareil, preuve de propriété adaptée et création d’une paire de clés propre à l’installation.
- Clés d’appareil stockées dans Android Keystore, iOS Keychain/Secure Enclave lorsque disponible, Windows DPAPI/CNG, macOS Keychain, Linux Secret Service/keyring lorsqu’il existe. Si secure storage manque, réduire capacités et afficher avertissement.
- Un nouvel appareil/réinstallation réclame un réenrôlement. Les identifiants d’installation réinitialisables ne sont pas utilisés comme authentification à eux seuls.

### 13.2 Contrôle d’accès

- RBAC/ABAC par rôle, propriété, incident, consentement, finalité et échéance.
- MFA pour opérations support/partenaire et accès administratif.
- Les agents de support consultent les statuts et métadonnées sans carte précise par défaut.
- Les membres d’un cercle ne reçoivent que les informations explicitement partagées ; lien de partage expirant et révocable.
- Les demandes partenaires nécessitent habilitation et journalisation. Pour une position opérateur, validation humaine avant transmission.

### 13.3 Protection des secrets et données

- TLS moderne en transit, chiffrement au repos par KMS, chiffrement applicatif de documents et identifiants sensibles.
- Masquage IMEI/numéro série dans UI et logs ; empreinte HMAC pour recherche sans exposition.
- Aucun secret Google Maps ou jeton partenaire dans le code source ou mobile.
- Journaux d’audit append-only, accès limité, stockage séparé des observations détaillées.
- Rate limiting sur création de comptes, recherche, dépôt d’incidents, appels Google API et relais BLE.

### 13.4 Menace anti-stalking et fausses déclarations

- Vérification de propriété avant activation du mode vol et avant lecture détaillée de la carte.
- Un utilisateur ne peut pas suivre un autre utilisateur simplement en connaissant son téléphone, IMEI ou numéro de série.
- Détecter signalements répétés et identifiants signalés sans bloquer arbitrairement une victime ; revue humaine.
- Distinguer partage volontaire d’une position personnelle et localisation d’un matériel.
- Mécanisme de plainte, blocage de cercle, révocation rapide et intervention de sécurité.
- L’UI déconseille toujours une récupération physique autonome ou une confrontation ; elle oriente vers les autorités.

## 14. Données, conformité et gouvernance

Les coordonnées et informations de localisation sont des données personnelles. Avant le lancement : déterminer responsable/sous-traitants ; formalités APDP appropriées ; notices de confidentialité ; base légale/consentements ; durée de conservation par objet ; modalités de droits ; évaluation d’impact ; transferts hors Bénin ; contrats de sous-traitance ; réponse à incident. Le Code du numérique béninois et les exigences APDP doivent être examinés avec un conseil local [15][16].

Chaque position ou radio-observation est associée à une finalité, une source, un utilisateur/appareil, un consentement, un niveau d’incertitude et une durée de conservation. Les analyses agrégées sont dépersonnalisées. Ne pas conserver les scans Wi‑Fi détaillés « au cas où ».

## 15. Exploitation, disponibilité et observabilité

- Environnements séparés : dev, test, pilote. Données de test synthétiques, sauf protocole de test sur le terrain expressément validé.
- Backups chiffrés, restauration documentée et contrôle d’accès des opérateurs de l’infrastructure.
- Health checks pour API, Postgres, stockage, worker Google et file d’attente.
- Métriques : disponibilité backend, taux de positions natives, ratio Geolocation API appelé/inputs admissibles, précision/rayon renvoyé, erreurs/quota Google, files d’observations, autonomie, incidents BLE, permission refusée, crash, incidents de sécurité.
- Les logs ne contiennent pas coordonnées précises ni scans bruts. Les analyses d’incident font l’objet d’un accès temporaire et audité.
- Les pannes Google Maps ne bloquent pas l’envoi de position : stocker l’observation et l’afficher dans une carte de secours si une solution alternative est approuvée, ou présenter une liste d’observations sans carte. Aucun fournisseur de secours n’est présumé dans ce pilote.

## 16. Tests et qualification

### 16.1 Matrice OS/matériel

Au minimum, tester par famille de plateforme : version OS supportée plus version précédente encore sécurisée, modèle avec matériel BLE/Wi‑Fi, localisation autorisée/refusée/précision réduite, app au premier plan/arrière-plan/terminée, redémarrage, économie batterie, perte/réapparition réseau, Bluetooth coupé, permission révoquée, désinstallation/réinstallation et appareil en veille.

Pour Linux, ajouter distribution, bureau, installation paquet/sandbox, GeoClue disponible/absent, BlueZ/controller et service arrêté. Pour Windows, app empaquetée et comportement suspendu, adaptateur Wi‑Fi/BLE et réglage Location. Pour macOS/iOS, tests de fond et états de permission Apple. Pour Android, restrictions de scans et notification du service en premier plan.

### 16.2 Tests Google Geolocation API

- Jeux synthétiques compatibles et requêtes contrôlées depuis Bénin/Cotonou, sans utiliser des données radio de citoyens sans consentement.
- Tester les entrées Wi‑Fi seules, cellulaires seules et combinées lorsqu’elles sont licites/possibles ; cas insuffisant/invalide ; rayon d’incertitude ; timeout ; quota dépassé ; clés restreintes ; coût de requête.
- Comparer l’estimation Google à des points de référence connus sans la traiter comme vérité terrain automatique.
- Pour chaque OS, documenter si l’app peut fournir des observations; absence de données est un résultat de compatibilité accepté, mais l’adaptateur Google doit être fonctionnel sur les plateformes qui disposent de ces observations.

### 16.3 Acceptation pilote

1. L’application et l’agent installables fonctionnent sur les cinq familles OS, selon la matrice de versions publiée.
2. Chaque appareil peut être enrôlé avec identifiant opaque, propriétaire vérifié et permissions expliquées.
3. Chaque position affiche source, heure, fraîcheur et incertitude.
4. L’intégration Google Geolocation API est active, facturée, limitée par quota et appelée quand l’entrée radio valide existe ; appel impossible sans données compatibles est affiché comme tel.
5. Les appels API Google produisent le statut, la position et le rayon d’incertitude, et les mesures brutes ont une politique de purge appliquée.
6. Les cartes 2D et satellite sont utilisables à Cotonou ; la vue 3D est activée seulement si Google la rend disponible dans la zone et plateforme.
7. Le mode incident augmente les demandes d’actualisation dans les limites OS et respecte permissions/batterie.
8. Les observations BLE ne sont pas confondues avec les coordonnées de la cible ; spoofing/rejeu et abus basiques sont testés.
9. Les workflows opérateur/autorité ne sont activés qu’après accords ; sinon le dossier exportable fonctionne sans partenaire.
10. Les démarches APDP, sécurité, traitement des pièces et contrôles de confidentialité sont accomplis avant les tests avec données réelles.
11. Documentation utilisateur précise les plateformes où le tracking d’arrière-plan est best effort et les cas d’arrêt/effacement.
12. Mesures terrain à Cotonou déterminent couverture réelle, consommation, disponibilité des observations Wi‑Fi/cellulaires et fréquence de détection BLE par OS.
13. Aucun client ne bloque l’interface système d’extinction ou ne prend de photo automatique/cachée ; une perte de transmissions produit seulement un état « non joignable » avec dernière position et horodatage.

## 17. Décisions techniques à finaliser avant développement

Ces décisions ne remettent pas en cause la portée confirmée (cinq systèmes à Cotonou), mais doivent être arrêtées dans les tickets d’architecture et les documents de déploiement :

1. Versions minimales Android, iOS/iPadOS, Windows et macOS.
2. Liste exacte de distributions Linux qualifiées et stratégie de mise à jour.
3. Hébergeur/région et plan de conformité APDP/transferts internationaux.
4. Budget Google Maps Platform, quota journalier de Geolocation API et clés par environnement.
5. Règles exactes d’échantillonnage normal et incident, après mesures batterie et avis APDP.
6. Durées de conservation des coordonnées, détections, pièces et journaux.
7. Méthode cryptographique auditée pour identifiants BLE rotatifs et résolution côté serveur.
8. Critères de preuve de propriété et étapes de transmission d’un dossier à la police.
9. Accords/contacts opérationnels auprès des trois opérateurs et des autorités compétentes ; aucun n’est présumé acquis.
10. Modèle d’assistance aux utilisateurs sans smartphone fonctionnel ni accès au compte habituel.

## 18. Sources techniques officielles

[1]: https://developers.google.com/maps/documentation/geolocation/overview "Google Maps Platform — aperçu de Geolocation API"
[2]: https://developers.google.com/maps/documentation/geolocation/requests-geolocation "Google Maps Platform — requêtes et champs d’entrée Geolocation API"
[3]: https://developer.android.com/develop/sensors-and-location/location/permissions "Android Developers — permissions de localisation"
[4]: https://developer.android.com/develop/connectivity/wifi/wifi-scan "Android Developers — balayage Wi‑Fi et limitations"
[5]: https://developer.apple.com/documentation/corelocation/handling-location-updates-in-the-background "Apple Developer — mises à jour de localisation en arrière-plan"
[6]: https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/CoreBluetoothBackgroundProcessingForIOSApps/PerformingTasksWhileTheAppIsInTheBackground.html "Apple Developer — Bluetooth Core en arrière-plan"
[7]: https://learn.microsoft.com/en-us/windows/apps/develop/maps-and-location/get-location "Microsoft Learn — obtenir la localisation Windows"
[8]: https://learn.microsoft.com/en-us/uwp/api/windows.devices.wifi.wifiadapter?view=winrt-28000 "Microsoft Learn — API WiFiAdapter"
[9]: https://developer.apple.com/documentation/corelocation "Apple Developer — Core Location"
[10]: https://developer.apple.com/documentation/corewlan/cwinterface "Apple Developer — CoreWLAN"
[11]: https://www.freedesktop.org/software/geoclue/docs/gdbus-org.freedesktop.GeoClue2.Client.html "GeoClue — API D‑Bus du client"
[12]: https://github.com/bluez/bluez/blob/master/doc/org.bluez.LEAdvertisingManager.rst "BlueZ — gestionnaire de publicité Bluetooth LE"
[13]: https://developers.google.com/maps/documentation/geolocation/usage-and-billing "Google Maps Platform — facturation et quotas Geolocation API"
[14]: https://developers.google.com/maps/documentation/javascript/overview "Google Maps Platform — Maps JavaScript API"
[15]: https://www.afapdp.org/wp-content/uploads/2018/06/Benin-Loi-2017-20-Portant-code-du-numerique-en-Republique-du-Benin.pdf "Bénin — Loi n° 2017-20 portant Code du numérique"
[16]: https://service-public.bj/public/privacy-policy "Portail national des services publics du Bénin — formalités de traitement et confidentialité"
[17]: https://simulateur.arcep.bj/operateurs "ARCEP Bénin — liste des opérateurs autorisés"
[18]: https://developer.android.com/reference/android/content/Intent "Android Developers — diffusion ACTION_SHUTDOWN"
[19]: https://developer.android.com/develop/background-work/services/fgs/service-types "Android Developers — services de premier plan et type caméra"
[20]: https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start "Android Developers — restrictions des services caméra en arrière-plan"
[21]: https://developer.apple.com/documentation/uikit/preparing-your-ui-to-run-in-the-background "Apple Developer — cycle de vie en arrière-plan et libération de la caméra"
[22]: https://developer.apple.com/documentation/avfoundation/avcapturesession/interruptionreason/videodevicenotavailableinbackground "Apple Developer — caméra interdite en arrière-plan"
[23]: https://developer.apple.com/app-store/review/guidelines/ "Apple — App Review Guidelines, consentement et indication de capture"
