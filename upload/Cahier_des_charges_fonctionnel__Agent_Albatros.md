# Cahier des charges fonctionnel — Agent Albatros

**Version :** 0.1 — document de cadrage fonctionnel  
**Date :** 22 octobre 2026  
**Nom du projet :** Agent Albatros  
**Pays de lancement :** République du Bénin  
**Statut :** document de cadrage à valider avant le développement

## 1. Objet du document

Le présent cahier des charges décrit les besoins fonctionnels, les profils utilisateurs, les règles de fonctionnement, les contraintes et le périmètre d’un service numérique béninois destiné à aider les citoyens à enregistrer, retrouver et récupérer leurs appareils électroniques perdus ou volés.

Le service comprend un portail web, une application mobile et, sous réserve d’accords formels, des parcours de coordination avec les opérateurs mobiles et les autorités compétentes. La spécification technique ultérieure traduira ces besoins en architecture logicielle, interfaces, services, modèles de données, protocoles, exigences de sécurité et choix d’hébergement.

Ce document est une base de discussion. Les exigences signalées comme **à confirmer** doivent être validées avec les utilisateurs, les partenaires, l’Autorité de Protection des Données Personnelles (APDP), les opérateurs et les autorités concernées avant tout traitement réel de données de localisation.

## 2. Contexte et problème à résoudre

Lorsqu’un téléphone, une tablette ou un ordinateur est perdu ou volé, son propriétaire doit généralement retrouver plusieurs informations et services différents : identifiants de l’appareil, fonctions du fabricant, opérateur mobile, déclaration aux autorités, sécurisation des comptes et preuves de propriété. Les démarches peuvent être difficiles à suivre et leur résultat n’est pas toujours visible par la victime.

Le projet vise à créer un point d’entrée local et compréhensible qui rassemble ces démarches, facilite la localisation dans les conditions techniquement possibles et améliore la coordination entre victime, opérateur et autorités, sans exposer les citoyens à des promesses de localisation impossibles ni à des risques de surveillance.

Le lancement est limité au Bénin. L’ARCEP répertorie actuellement trois opérateurs mobiles autorisés : MTN Bénin, Moov Africa Bénin et Celtiis (SBIN) [1]. Leur participation au service n’est pas présumée : elle devra faire l’objet de discussions et d’accords.

## 3. Vision du produit

Créer un **service béninois de recherche et de récupération d’appareils**, accessible au grand public, qui aide chaque propriétaire à :

- préparer son appareil avant un incident ;
- signaler rapidement une perte ou un vol ;
- consulter une position lorsqu’une source autorisée et techniquement disponible en fournit une ;
- sécuriser ses comptes, sa SIM et ses données ;
- préparer et suivre les démarches auprès des opérateurs et des autorités ;
- recevoir une information compréhensible sur ce qui a été fait, ce qui reste à faire et les limites de la localisation.

Le service ne doit jamais annoncer qu’un appareil est localisé en direct si la position affichée est ancienne, approximative ou simplement la position du téléphone participant ayant détecté un signal Bluetooth.

## 4. Principes structurants

### 4.1 Localisation conditionnelle et transparente

La plateforme affiche toujours la source, l’heure, la précision estimée et le statut de chaque position. Elle distingue au minimum : position reçue de l’appareil inscrit, détection Bluetooth communautaire, position provenant d’un partenaire habilité et dernière position connue.

### 4.2 Consentement et maîtrise par le propriétaire

L’utilisateur choisit d’inscrire ses appareils, d’activer les capacités disponibles et de participer au réseau communautaire. Les réglages, effets et limites sont expliqués avant l’activation. Aucun suivi secret d’une personne ne doit être proposé.

### 4.3 Partage limité et protégé

Les cercles de confiance servent à faciliter les alertes et le soutien entre proches. Ils ne constituent pas un accès général aux positions. Le propriétaire choisit les informations partagées, les personnes autorisées et la durée du partage.

### 4.4 Complémentarité avec les systèmes existants

Le projet construira sa propre application et son propre service. L’application utilisera les interfaces publiques du système d’exploitation, avec les permissions accordées par le propriétaire, pour demander les données de localisation que l’appareil peut fournir. Elle utilisera également obligatoirement Google Maps Platform Geolocation API lorsque des mesures Wi-Fi ou cellulaires autorisées et compatibles sont disponibles, afin d’obtenir une estimation et son rayon de précision [10]. Elle pourra utiliser les API Bluetooth autorisées pour son propre réseau communautaire. Cela ne donne pas accès aux réseaux privés Find My ou Find Hub, qui restent hors périmètre. L’usage des API Google Maps Platform se fera selon les conditions normales d’accès, de facturation et de quotas de Google ; il ne s’agit pas d’un accord fabricant pour récupérer des données privées.

### 4.5 Ancrage béninois

Les démarches, messages, contacts partenaires, documents requis et orientations doivent être adaptés au contexte béninois et validés localement. Le service commence au Bénin ; toute extension à un autre pays fera l’objet d’une nouvelle analyse juridique, opérationnelle et linguistique.

## 5. Objectifs et résultats attendus

### 5.1 Objectifs

1. Permettre au propriétaire de créer un inventaire privé de ses appareils et d’y associer des éléments de preuve.
2. Faciliter la déclaration, l’organisation et le suivi d’un incident de perte ou de vol.
3. Fournir une localisation lorsque l’application propre au projet peut transmettre la position, lorsqu’un appareil participant détecte un signal Bluetooth compatible ou lorsqu’une réponse est légalement communiquée par un opérateur ou une autorité partenaire.
4. Tester un réseau communautaire de détection Bluetooth volontaire, avec des garanties anti-abus et une mesure honnête de sa couverture.
5. Préparer, sous convention, les échanges nécessaires avec les opérateurs et les autorités habilitées.
6. Améliorer la sécurisation des comptes, des cartes SIM et des données personnelles après un incident.
7. Fournir à l’utilisateur une visibilité sur les étapes accomplies et les réponses obtenues.

### 5.2 Résultats mesurables à définir pour le pilote

Les valeurs-cibles seront déterminées après étude de référence et accord des partenaires. Le tableau de bord projet devra permettre de mesurer :

- nombre de comptes vérifiés et d’appareils enregistrés ;
- part des appareils ayant leurs identifiants et justificatifs suffisamment renseignés ;
- nombre et complétude des signalements ;
- délai entre déclaration et transmission d’une demande recevable au partenaire concerné ;
- nombre de demandes opérateur ou autorités traitées, refusées ou en attente, selon les catégories autorisées ;
- nombre de positions directes reçues et nombre de détections communautaires, avec fraîcheur et précision ;
- nombre d’incidents clôturés et, lorsque l’information est connue, nombre d’appareils récupérés ;
- taux d’abandon des démarches et retours des utilisateurs ;
- consommation de batterie et de données mesurée pendant les essais ;
- signalements d’abus, accès non autorisés et incidents de confidentialité.

Aucun indicateur de succès ne doit inciter à élargir la collecte de position au-delà de ce qui est nécessaire ou autorisé.

## 6. Publics et rôles

### 6.1 Propriétaire d’un appareil

Personne qui enregistre un ou plusieurs appareils, gère ses réglages, signale un incident et consulte les démarches et informations qui la concernent.

### 6.2 Membre d’un cercle de confiance

Personne invitée par un propriétaire. Elle peut recevoir une alerte ou une demande d’aide et, si elle y consent, participer au réseau de détection. Son appartenance au cercle ne donne pas automatiquement accès à la localisation complète du propriétaire ou de ses appareils.

### 6.3 Détecteur communautaire

Utilisateur ayant choisi de participer à la détection Bluetooth. Son téléphone peut détecter un identifiant temporaire admissible et transmettre une observation selon les permissions du système. Il ne doit pas connaître l’identité du propriétaire ni l’historique du dossier.

### 6.4 Agent d’assistance de la plateforme

Personnel d’assistance qui aide à l’utilisation du service et à la complétude des dossiers. Par défaut, il n’a pas accès aux coordonnées précises de localisation.

### 6.5 Agent partenaire opérateur ou autorité

Rôle externe, activable uniquement avec convention, habilitation, vérification et cadre légal validés. Il ne reçoit que les données nécessaires à une demande déterminée et à laquelle il est autorisé à répondre.

### 6.6 Administrateur de la plateforme

Gère les comptes opérationnels, la configuration et les droits d’accès. Les privilèges sont limités, séparés et journalisés. L’administration ne doit pas permettre la consultation ordinaire et non justifiée des positions des utilisateurs.

## 7. Périmètre du produit

### 7.1 Composants inclus

- Portail web adaptatif pour ordinateur et téléphone.
- Application mobile pour l’inscription, les alertes, les fonctions de localisation disponibles et, selon les possibilités des systèmes, la détection communautaire.
- Console opérationnelle pour gérer les signalements et les demandes de support, sans accès excessif aux données de localisation.
- Services de notification et de communication avec l’utilisateur.
- Interface de dossier et de suivi pour les échanges avec les partenaires, uniquement après accord formel et définition du processus.
- Outils de journalisation, de gestion des droits et de traitement des demandes relatives aux données personnelles.

### 7.2 Périmètre du pilote retenu

Le pilote est prévu à Cotonou et couvre dès son lancement Android, iOS/iPadOS, Windows, macOS et Linux, pour smartphones, tablettes et PC. Une qualification par OS, version, matériel et distribution Linux reste obligatoire. Cette couverture ne signifie pas que la collecte en arrière-plan, le BLE ou l’accès aux données Wi‑Fi/cellulaires auront la même disponibilité sur chaque plateforme.

### 7.3 Hors périmètre de la première version

- Accès direct et universel aux comptes Gmail, Google Find Hub, Apple ID ou Apple Find My.
- Toute négociation, convention ou intégration technique destinée à accéder aux réseaux privés Find My, Find Hub ou aux positions conservées dans les comptes Google/Apple. Cette exclusion n’interdit pas l’utilisation des API publiques de localisation et Bluetooth du système après autorisation de l’utilisateur, ni l’intégration obligatoire de Google Maps Platform Geolocation API selon les conditions standard de Google.
- Localisation garantie d’un téléphone totalement éteint, sans batterie, sans émission radio ou réinitialisé.
- Contournement des protections du système d’exploitation, d’un verrouillage ou des fonctions d’effacement.
- Localisation par IMEI opérée par la plateforme de sa propre initiative.
- Accès autonome aux systèmes internes des opérateurs ou des autorités.
- Publication publique des IMEI, numéros de série ou positions.
- Récupération physique par des employés de la plateforme ou incitation à confronter un suspect.
- Promesse de blocage mondial d’un IMEI : la portée du blocage dépend des opérateurs et mécanismes effectivement participants.
- Gestion des appareils d’entreprise sous administration mobile avancée, sauf projet distinct.

## 8. Exigences fonctionnelles

### 8.1 Compte et authentification

**F-001 — Création de compte.** L’utilisateur peut créer un compte avec un numéro de téléphone ou une adresse électronique vérifiable. L’authentification via un compte Google peut être proposée comme moyen de connexion, sans être présentée comme un accès aux fonctions Google Find Hub.

**F-002 — Récupération de compte.** L’utilisateur peut récupérer l’accès à son compte selon une procédure renforcée qui réduit le risque de prise de contrôle par un voleur. Les secrets de récupération ne sont jamais affichés en clair ni stockés sous forme récupérable.

**F-003 — Vérification renforcée.** Les actions sensibles — déclaration de vol, ajout de propriétaire, partage de dossier ou demande de transmission — nécessitent une réauthentification ou un facteur supplémentaire adapté.

**F-004 — Gestion de session.** L’utilisateur peut consulter et révoquer ses sessions. Les opérations sensibles sont journalisées.

### 8.2 Enregistrement et gestion des appareils

**F-010 — Ajout d’appareil.** L’utilisateur peut enregistrer un smartphone, une tablette, un ordinateur portable ou un autre appareil électronique pris en charge.

**F-011 — Informations minimales.** Le dossier peut contenir catégorie, marque, modèle, couleur, numéro de série, IMEI ou IMEI multiples selon le modèle, identifiant d’achat, date approximative d’acquisition et coordonnées de contact. Les champs obligatoires et facultatifs seront fixés selon la catégorie et les exigences des partenaires.

**F-012 — Preuve de propriété.** L’utilisateur peut joindre une preuve d’achat ou un autre justificatif. L’interface explique les formats, la finalité et la durée de conservation.

**F-013 — Validation de propriété.** Le produit propose une procédure de vérification proportionnée avant de permettre des actions sensibles. Une simple connaissance de l’IMEI ou du numéro de série ne suffit pas à elle seule à prendre le contrôle du dossier.

**F-014 — Plusieurs propriétaires et cession.** Le service prévoit une procédure sécurisée pour corriger un appareil enregistré par erreur, transférer sa propriété ou retirer un appareil vendu.

**F-015 — Consultation privée.** Les identifiants d’appareil ne sont visibles que par le propriétaire et les personnels ou partenaires expressément habilités pour une finalité déterminée.

### 8.3 Préparation avant incident

**F-020 — Assistant de préparation.** L’application guide l’utilisateur pour activer les permissions autorisées, les paramètres de localisation, Bluetooth, économie de batterie et notifications nécessaires aux fonctions effectivement offertes.

**F-021 — État de préparation.** Une page présente les capacités propres au projet, actives, désactivées ou non prises en charge : localisation directe via les API autorisées du système, détection Bluetooth du réseau du projet, connectivité et dernière synchronisation. Elle explique les permissions requises. Aucune donnée issue des réseaux privés de localisation d’un fabricant n’est présentée comme intégrée.

**F-022 — Explication des limites.** L’utilisateur est informé que l’application peut cesser de transmettre après arrêt, désinstallation, restrictions du système, absence de batterie ou réinitialisation. La fonction d’application ordinaire ne peut pas s’opposer de façon garantie à ces événements.

**F-023 — Contacts de confiance.** Le propriétaire peut créer un cercle, envoyer des invitations révocables et choisir s’il partage une alerte, un statut de dossier ou une position. La configuration initiale ne partage aucune position permanente par défaut.

**F-024 — Participation au réseau.** L’utilisateur peut activer ou désactiver sa participation à la détection communautaire et comprendre ce que son téléphone détecte et ce qui est transmis.

**F-025 — Arrêt et perte de contact.** L’application ne remplace pas l’interface système d’extinction et ne peut pas imposer une authentification avant qu’un utilisateur éteigne le téléphone avec les mécanismes ordinaires de l’OS. Sur les plateformes qui exposent un signal d’arrêt, celui-ci peut être transmis au service au mieux des possibilités ; il n’empêche pas l’extinction et son envoi n’est pas garanti. Si les transmissions cessent, le service affiche « appareil non joignable depuis… » et conserve la dernière position avec son heure. Il ne conclut pas automatiquement à un vol, à une extinction volontaire ou à l’identité de la personne ayant le téléphone. [14] [15]

**F-026 — Pas de photographie clandestine.** Agent Albatros ne prend pas automatiquement de photo du visage d’une personne parce qu’elle demande l’arrêt, tente de l’éteindre ou échoue à une authentification. Une capture caméra cachée est exclue du pilote. Toute fonction caméra future devrait être examinée séparément, en premier plan, avec permission et consentement explicites, indicateur clair de capture et validation juridique et des règles de plateforme. [16] [17] [18] [19]

### 8.4 Localisation directe

**F-030 — Position propre à l’appareil.** Lorsque l’application ou l’agent du projet est installé sur l’appareil enregistré, fonctionne, dispose des autorisations nécessaires et peut communiquer, il demande au système d’exploitation une position via les API documentées de localisation. Selon l’appareil et les autorisations, le système peut calculer cette position à partir du GPS/GNSS, du Wi-Fi, de réseaux disponibles ou d’autres sources. L’application transmet la position pour le compte du propriétaire ; elle n’accède pas pour autant aux bases privées de Google, d’Apple ou de l’opérateur. Sur PC, les sources disponibles et leur précision varient fortement.

**F-031 — Métadonnées de position.** Chaque observation comprend au minimum l’heure de collecte, l’heure de réception, la source, une indication de précision fournie par le système et le statut de fraîcheur.

**F-032 — Affichage honnête.** La carte distingue position récente, position ancienne, position approximative et absence de position. Aucune donnée manquante ne doit être extrapolée en une position actuelle.

**F-033 — Historique minimal.** Le propriétaire peut voir l’historique nécessaire à la récupération. La durée de conservation doit être définie avec l’APDP et réduite au minimum compatible avec la finalité.

**F-034 — Mode incident.** Après authentification, le propriétaire peut signaler un appareil perdu ou volé. Le service peut modifier le rythme de transmission dans les limites des règles des magasins d’applications, des systèmes et des permissions.

**F-035 — Outils externes du système.** L’interface peut fournir des instructions et ouvrir, à la demande de l’utilisateur, les outils officiels de verrouillage ou d’effacement proposés par le système ou le fabricant. L’utilisateur agit directement dans ce service externe. La plateforme n’en récupère aucune position et n’exécute pas ces actions par intégration fabricant.

**F-036 — Collecte adaptative et itérative.** La localisation peut être actualisée de manière répétée et dynamique. Le service ajuste la fréquence selon le mode choisi (préparation normale ou appareil déclaré perdu), la dernière qualité de position, la connectivité, l’état de batterie lorsqu’il est accessible et pertinent, ainsi que les limites du système. En mode normal, le rythme doit préserver l’autonomie ; après déclaration, des mises à jour plus rapprochées peuvent être demandées si l’utilisateur a donné les permissions requises. En l’absence de réseau, les observations peuvent être mises en attente lorsque le système le permet. La fréquence exacte, les seuils et les politiques de reprise seront déterminés dans la spécification technique après essais de batterie et validation réglementaire.

**F-037 — Signaux utiles et minimisation.** À chaque itération, l’application utilise seulement les données nécessaires aux finalités de localisation, détection et sécurité : position fournie par l’API du système, horodatage, précision estimée et source disponible ; pour le réseau Bluetooth du projet, identifiant temporaire, instant de détection et indication de proximité ; ainsi que l’état des permissions et de la connectivité lorsque nécessaire au diagnostic. D’autres signaux ne peuvent être ajoutés qu’après justification documentée, information de l’utilisateur et validation de conformité.

**F-038 — Données non nécessaires exclues.** « Toutes les données disponibles » ne signifie pas collecter tout le contenu du téléphone. Le service ne collecte pas par défaut les messages, appels, contacts, photos, fichiers, historique de navigation, audio, ni identifiants de réseaux Wi-Fi ou de cellules bruts. Les systèmes peuvent fusionner plusieurs sources pour calculer une position ; l’application demande d’abord la position autorisée via l’API prévue à cet effet au lieu d’aspirer les données brutes. Toute exception devra faire l’objet d’une nécessité démontrée et d’une validation juridique et de confidentialité.

### 8.5 Détection communautaire Bluetooth

**F-040 — Principe.** Le réseau communautaire propre au projet détecte à proximité un identifiant Bluetooth temporaire émis par l’application ou l’agent du projet sur un appareil inscrit et configuré pour participer. Le téléphone participant utilise les API Bluetooth autorisées du système et rapporte une observation ; la position associée est celle du téléphone détecteur au moment de l’observation, pas une mesure GPS directe de l’appareil recherché. Cette fonction dépend du matériel, des permissions et des restrictions d’arrière-plan du système.

**F-041 — Identifiants temporaires.** Les identifiants de détection doivent être conçus pour limiter le suivi non autorisé et ne doivent pas exposer directement le compte ou l’identité du propriétaire.

**F-042 — Transmission différée.** Si le téléphone détecteur n’a pas de connexion à l’instant de la détection, le produit peut mettre en file d’attente une observation minimale et la transmettre ultérieurement, sous réserve des capacités du système et des choix de confidentialité.

**F-043 — Conservation et minimisation.** Les détections ne sont conservées que pendant la durée justifiée. Les observateurs ne voient pas l’identité du propriétaire et ne peuvent pas parcourir les détections d’autres appareils.

**F-044 — Qualité d’observation.** L’interface au propriétaire distingue une détection Bluetooth approximative d’une position directe, indique l’heure et ne transforme pas la puissance du signal en distance exacte ou en itinéraire certain.

**F-045 — Couverture.** Le service n’affirme pas qu’un appareil sera détecté partout. La probabilité dépend notamment du nombre et de la distribution des téléphones participants, des réglages Bluetooth, de l’état du téléphone recherché, des règles du système et de la connectivité des détecteurs.

**F-046 — Compatibilité iOS et Android.** Chaque capacité en arrière-plan doit être mesurée séparément par système, version et conditions de test. La prise en charge d’un système ne doit pas être déclarée sur la seule base d’un test lorsque l’application est ouverte.

**F-047 — Prévention du suivi abusif.** Le produit doit définir des garde-fous contre l’utilisation de la détection pour suivre une personne sans son accord, y compris règles d’alerte, traitement des signalements et restrictions de déclenchement. Les exigences anti-traque doivent être évaluées avec un spécialiste sécurité et les plateformes mobiles.

**F-048 — Téléphone éteint ou réinitialisé.** L’application ne garantit pas de signal Bluetooth après extinction complète, perte d’alimentation, désinstallation ou réinitialisation. Une telle capacité relève d’une intégration système ou matérielle distincte et d’accords appropriés.

### 8.6 Cercles de confiance et notifications

**F-050 — Cercles facultatifs.** L’utilisateur peut créer un cercle de proches, en gérer les membres et le supprimer.

**F-051 — Partage explicite.** Le propriétaire choisit, pour chaque partage, l’information transmise, les personnes concernées et la durée. Le partage peut être révoqué immédiatement.

**F-052 — Alerte de vol.** Le propriétaire peut demander l’aide de son cercle lorsqu’un incident est confirmé. L’alerte ne révèle pas automatiquement une position précise.

**F-053 — Notifications sobres.** Les notifications évitent d’exposer des détails sensibles sur l’écran verrouillé. Elles ne contiennent pas les identifiants complets de l’appareil.

**F-054 — Contrôle anti-abus.** Les destinataires peuvent quitter un cercle, bloquer des invitations et signaler une utilisation abusive.

### 8.7 Déclaration et gestion d’incident

**F-060 — Parcours guidé.** L’utilisateur choisit perte ou vol et complète les informations utiles : appareil, date et heure approximatives, lieu, circonstances, numéro de téléphone/SIM concerné et éventuel dépôt de plainte.

**F-061 — Numéro de dossier.** Chaque signalement reçoit un identifiant, un horodatage et un état consultable par le propriétaire.

**F-062 — Pièces justificatives.** Le propriétaire peut ajouter les documents nécessaires à la vérification ou aux démarches, avec accès et durée de conservation contrôlés.

**F-063 — Liste d’actions.** Le service présente les démarches à effectuer : sécuriser les comptes, contacter l’opérateur, suspendre la SIM, retrouver l’IMEI, ouvrir au besoin les outils externes officiels du système ou du fabricant et contacter les autorités. Les outils des fabricants restent entièrement externes à la plateforme. Les contacts et procédures béninois devront être vérifiés avant publication.

**F-064 — Dossier exportable.** Le propriétaire peut générer un récapitulatif contenant les informations déclarées et les preuves choisies, destiné à faciliter les échanges. Le document n’est pas présenté comme un procès-verbal officiel.

**F-065 — Statuts compréhensibles.** Les statuts possibles comprennent au minimum brouillon, soumis, vérification requise, prêt à transmettre, transmis au partenaire, en traitement, réponse reçue, clôturé et contesté.

**F-066 — Rectification et clôture.** Le propriétaire peut corriger les informations, annuler un signalement de perte retrouvé ou demander la clôture, sous réserve de conserver les éléments requis par une obligation légale ou un litige.

### 8.8 Opérateurs et autorités

**F-070 — Aucun accès non autorisé.** La plateforme ne fournit pas aux utilisateurs une recherche par numéro de téléphone ou IMEI permettant d’obtenir la position d’un abonné.

**F-071 — Partenariat opérateur.** Une intégration ou un processus de transmission n’est activé qu’après convention écrite avec l’opérateur, vérification de l’identité et de la propriété, définition des données demandées, base légale, délais, rôles, sécurité et procédure de réponse.

**F-072 — Demandes de données réseau.** Toute demande de localisation réseau est acheminée uniquement par le canal et selon la procédure autorisés par le droit béninois et l’opérateur. La plateforme n’ouvre pas d’accès direct général aux systèmes opérateurs.

**F-073 — Blocage IMEI.** La plateforme peut préparer une demande de vérification ou de blocage d’IMEI si l’opérateur confirme le processus et les critères. Le résultat est suivi sans promettre que l’IMEI sera bloqué par tous les réseaux.

**F-074 — Relation avec les autorités.** Un flux de travail police ou justice n’est activé qu’avec l’institution compétente et les validations nécessaires. La plateforme ne se substitue ni à un dépôt de plainte ni à une enquête officielle.

**F-075 — Traçabilité.** Les accès, transmissions et réponses partenaires sont horodatés, attribués à un rôle et consultables par les administrateurs autorisés aux fins d’audit.

**F-076 — Refus ou absence de partenaire.** En l’absence d’accord, le service fournit un dossier exportable et des instructions, mais ne prétend pas transmettre une demande ou obtenir une localisation.

### 8.9 Assistance, accessibilité et adaptation locale

**F-080 — Français.** La première version est utilisable en français clair. Les traductions dans des langues nationales pourront être priorisées après étude des besoins et validation de la terminologie.

**F-081 — Faible consommation.** Le portail doit limiter le poids des pages, fonctionner sur des appareils courants et rester utilisable avec une connectivité mobile modeste. Les performances cibles seront fixées dans la spécification technique.

**F-082 — Assistance non numérique.** Le service prévoit une voie d’aide lorsque l’utilisateur n’a pas accès à son téléphone ou à sa messagerie habituelle, sans affaiblir la vérification de propriété.

**F-083 — Support.** L’utilisateur peut consulter une aide liée au statut de son dossier. Le support ne doit pas demander de mot de passe, code PIN ou code de récupération.

## 9. Exigences non fonctionnelles

### 9.1 Sécurité

- Chiffrement des communications et des données stockées selon les bonnes pratiques en vigueur.
- Authentification renforcée pour les opérations sensibles et séparation des rôles.
- Limitation des privilèges, journaux d’audit protégés contre la modification et revue périodique des accès.
- Protection contre l’énumération d’IMEI, la prise de contrôle de compte, l’usurpation de dossier et les abus de partage.
- Gestion formalisée des vulnérabilités, sauvegardes, incidents et notifications pertinentes.
- Aucune donnée de position ou preuve sensible dans les notifications non protégées.
- Analyse de menace dédiée aux risques de violence domestique, harcèlement, vol ciblé et abus par membre de cercle.

### 9.2 Confidentialité et conformité

Les données de localisation et les identifiants liés à une personne doivent être traités comme sensibles. Le Code du numérique béninois définit notamment les données de localisation comme pouvant contribuer à identifier une personne et prévoit un cadre de protection des données de communication [4]. Le portail officiel des services publics indique que les traitements de données personnelles sont subordonnés aux formalités préalables applicables auprès de l’APDP, qui peuvent inclure une déclaration ou une autorisation selon le traitement [5].

Avant le lancement, le responsable du produit devra donc :

- déterminer les rôles juridiques de chaque partie (responsable, sous-traitant, partenaire) ;
- définir la finalité et la base légale de chaque traitement ;
- consulter l’APDP et accomplir les formalités applicables avant la mise en production ;
- publier une notice de confidentialité compréhensible et recueillir les choix requis ;
- établir les durées de conservation par catégorie de données ;
- documenter les droits d’accès, rectification, opposition, suppression et les limites légales éventuelles ;
- encadrer contractuellement toute transmission à un opérateur, à une autorité ou à un prestataire ;
- évaluer les transferts internationaux de données et l’hébergement avant de sélectionner les fournisseurs.

Ce cahier des charges ne constitue pas un avis juridique. Le texte applicable, ses modifications et les interprétations de l’APDP devront être vérifiés par un conseil qualifié au Bénin.

### 9.3 Disponibilité et résilience

Le portail doit afficher clairement les interruptions et éviter de perdre un dossier commencé. Les informations nécessaires à l’usage hors ligne peuvent être mises en cache de façon limitée, sans conserver inutilement des positions ou preuves sur un appareil partagé.

### 9.4 Explicabilité et confiance

Les libellés doivent différencier « position de l’appareil », « détection par un autre téléphone », « position fournie par un partenaire » et « dernière position connue ». Les erreurs, délais et limites doivent être exposés sans jargon.

## 10. Parcours principaux

### 10.1 Préparer un appareil

1. L’utilisateur crée et vérifie son compte.
2. Il enregistre l’appareil et, si disponible, ses identifiants et justificatifs.
3. L’application explique les autorisations et fonctions prises en charge.
4. L’utilisateur choisit d’activer la localisation directe et, si disponible, la participation au réseau communautaire.
5. Il configure éventuellement un cercle de confiance.
6. Le service affiche un état de préparation et les limites applicables à cet appareil.

### 10.2 Signaler un vol

1. L’utilisateur s’authentifie de manière renforcée.
2. Il sélectionne l’appareil et déclare l’incident.
3. Il valide les renseignements et ajoute les documents utiles.
4. Le système confirme le signalement et présente les actions immédiates.
5. Une position éventuelle apparaît avec source, heure, précision et statut.
6. Si un parcours partenaire est actif, le dossier est transmis selon les règles définies ; sinon, l’utilisateur exporte les éléments et suit les instructions officielles.
7. La victime suit les réponses et peut clôturer le dossier lorsque l’appareil est retrouvé ou que les démarches prennent fin.

### 10.3 Détection communautaire

1. Un appareil inscrit émet un identifiant temporaire si le matériel, l’application et le système le permettent.
2. Un appareil participant à proximité détecte le signal selon ses permissions et règles système.
3. Le téléphone détecteur enregistre ou transmet une observation minimale, avec son heure et une position autorisée.
4. Le propriétaire vérifié consulte l’observation selon les règles de confidentialité.
5. Le service affiche clairement qu’il s’agit d’une détection approximative et non d’un accès à la position GPS directe de l’appareil recherché.

### 10.4 Aider un proche

1. Le propriétaire invite un proche dans un cercle.
2. Le proche accepte ou refuse explicitement.
3. En cas d’incident, le propriétaire partage une alerte ou une information choisie pour une durée déterminée.
4. Le proche reçoit les consignes sans obtenir plus de données que nécessaire.
5. Le partage s’arrête à l’expiration, à la révocation ou à la clôture prévue.

## 11. Limites techniques à inscrire dans les communications produit

- L’application ou l’agent du projet peut utiliser les API documentées de localisation et Bluetooth du système, après les permissions requises ; cela n’exige pas un accès aux réseaux privés Find My/Find Hub. La collecte est répétée et adaptative, mais limitée aux signaux nécessaires, à une finalité déclarée et aux paramètres que le propriétaire peut contrôler ; elle n’implique pas la collecte exhaustive du contenu ou de tous les identifiants de l’appareil. Une application ordinaire n’a pas de moyen garanti pour empêcher sa désinstallation ou survivre à une réinitialisation d’usine.
- Un téléphone éteint ou sans alimentation ne peut généralement plus émettre le signal Bluetooth de l’application. Certaines fonctions constructeur peuvent différer, mais elles ne sont pas supposées disponibles pour ce produit.
- La détection communautaire dépend de la proximité d’autres appareils participants, de leur état, de leurs permissions, des limites d’exécution en arrière-plan et de leur capacité à transmettre ou à conserver une observation.
- La position associée à une détection BLE est celle du téléphone détecteur. Elle donne un indice de proximité, pas une position GPS certifiée du téléphone recherché.
- Android et iOS imposent des contraintes différentes au Bluetooth et aux tâches en arrière-plan. Android documente des mécanismes de scan en arrière-plan qui dépendent notamment du processus et des mécanismes de réveil disponibles [6]. Apple fournit Core Bluetooth, mais l’usage en arrière-plan dépend des modes et règles de la plateforme [7]. Les capacités doivent être vérifiées sur appareils réels et versions prises en charge.
- L’IMEI sert à identifier un équipement. Il ne donne pas une position GPS. Un blocage réseau dépend des opérateurs concernés et ne garantit pas la récupération de l’appareil. La GSMA décrit un dispositif de registre et de liste de blocage partagée entre opérateurs participants [8].
- Le projet n’a pas pour objet d’obtenir un accès privilégié aux fabricants ni de récupérer des positions depuis Google Find Hub, Apple Find My, un compte Gmail ou un compte Apple. Il utilisera les API publiques fournies par chaque système d’exploitation, dans les limites de leurs permissions et règles. Les partenariats visés sont locaux : opérateurs mobiles et autorités béninoises.

## 12. Dépendances et partenariats

### 12.1 Partenaires à solliciter

- ARCEP Bénin, pour les échanges de cadrage réglementaire et sectoriel pertinents ;
- MTN Bénin, Moov Africa Bénin et Celtiis/SBIN, pour discuter des processus de vérification, suspension SIM, blocage IMEI et demandes légalement recevables ;
- police et/ou autorités judiciaires compétentes, pour valider le parcours de dépôt, la forme des pièces et les conditions de transmission ;
- APDP, pour le cadrage préalable des traitements et les formalités applicables ;
- acteurs de distribution, réparateurs, assureurs et revendeurs, pour l’enregistrement au moment de l’achat ou la vérification de propriété.

### 12.2 Pré-requis de partenariat

Aucun partenaire n’est réputé engagé par ce document. Les partenariats visés sont les opérateurs mobiles béninois et les autorités locales compétentes, ainsi que les organismes de cadrage nécessaires comme l’ARCEP et l’APDP. Avant une intégration ou un flux de transmission, il faut définir par écrit le périmètre, les interlocuteurs habilités, les formats, les délais, les motifs de refus, les bases légales, la sécurité, les responsabilités, les coûts, l’assistance et l’audit. Aucun partenariat fabricant n’est prévu.

## 13. Phasage proposé

### Phase 0 — Validation terrain et conformité

Entretiens avec victimes, opérateurs, police, ARCEP et APDP ; cartographie des démarches actuelles ; étude juridique ; validation des scénarios d’usage ; sélection d’une zone pilote et d’un partenaire opérationnel potentiel.

### Phase 1 — MVP de préparation et de dossier

Compte, inventaire des appareils, preuves, guide de prévention, signalement de perte/vol, dossier exportable, liste d’actions, gestion des cercles sans partage permanent et console minimale de support. Les positions ne sont affichées que si une source réelle existe.

### Phase 2 — Localisation directe et expérimentation Android

Application Android avec transmission de position consentie lorsque possible, états et métadonnées explicites, parcours de localisation et tests de consommation. Étude technique et test encadré du Bluetooth communautaire, avec revue de sécurité et de confidentialité.

### Phase 3 — Parcours opérateur et institutionnel

Après accords et validations, mise en place d’un flux documenté pour des demandes opérateur, la suspension SIM, la vérification ou le blocage IMEI et les échanges avec les autorités habilitées. Les demandes de localisation réseau restent sous contrôle des procédures légales et des opérateurs.

### Phase 4 — Extension iOS et couverture des PC

Étude et déploiement des fonctions propres au projet sur iOS/iPadOS et les systèmes PC retenus, dans les limites des règles de chaque système. Amélioration des échanges avec les opérateurs et les autorités locales si des accords sont conclus. Les réseaux privés et fonctions de localisation des fabricants restent hors périmètre ; leurs outils officiels ne sont proposés qu’en accès externe à l’initiative de l’utilisateur.

### Phase 5 — Extension géographique

Aucun déploiement hors du Bénin sans analyse propre au pays : droit, régulateur, opérateurs, autorités, couverture, langues, protection des données et procédures de blocage.

## 14. Critères d’acceptation fonctionnels du pilote

Le pilote sera considéré comme prêt à être évalué lorsque :

1. Un utilisateur peut créer un compte, le sécuriser et récupérer l’accès selon une procédure documentée.
2. Un propriétaire peut enregistrer, consulter, corriger et retirer un appareil.
3. Les preuves d’achat et identifiants d’appareil sont privés et accessibles uniquement aux rôles autorisés.
4. Un propriétaire peut signaler une perte ou un vol et obtenir un numéro de dossier ainsi qu’un récapitulatif exportable.
5. Le système affiche clairement l’origine, l’heure, la fraîcheur et la précision estimée d’une position ou d’une détection.
6. Aucune position Google Find Hub, Apple Find My ou autre service fabricant n’est intégrée ni présentée comme fournie par la plateforme ; seul un lien ou une redirection externe vers un outil officiel peut être proposé à l’utilisateur.
7. La participation aux cercles et au réseau de détection est facultative, révocable et expliquée.
8. Les utilisateurs ne peuvent pas chercher librement une personne, un numéro de téléphone ou un appareil en saisissant simplement un IMEI.
9. Les parcours opérateur et autorités sont inactifs tant que les accords, habilitations et procédures nécessaires ne sont pas confirmés.
10. Les démarches de conformité APDP applicables sont accomplies avant tout usage réel des données personnelles concernées.
11. Les essais documentent les limites de fonctionnement en arrière-plan, la batterie, la connectivité, les détections erronées et les protections anti-abus.
12. L’interface ne conseille jamais à la victime de se rendre seule à une position ou de confronter un suspect ; elle renvoie vers les autorités en cas de risque.
13. Les mises à jour de localisation sont répétées et adaptées au mode de fonctionnement, aux permissions et aux limites de batterie ; chaque position affiche son heure, sa source et sa précision estimée.
14. Les itérations n’aspirent pas les données personnelles sans lien avec la localisation ou la récupération ; toute donnée supplémentaire doit être justifiée, documentée et validée avant collecte.
15. Google Maps Platform Geolocation API est intégrée et appelée lorsque des données Wi-Fi ou d’antennes valides, autorisées et compatibles sont disponibles ; la réponse, son rayon d’incertitude, les erreurs et les quotas sont traités et affichés sans fabriquer de position.

## 15. Risques majeurs et mesures de réduction

| Risque | Conséquence possible | Mesure de réduction |
|---|---|---|
| Promesse excessive de localisation | Perte de confiance, responsabilité et danger pour l’utilisateur | Libellés précis, limites visibles, indicateurs d’incertitude et communication réaliste |
| Faible densité de participants | Peu de détections Bluetooth | Pilote géographique, mesure réelle de couverture et recrutement volontaire |
| Restrictions des systèmes mobiles | Détection intermittente ou arrêtée en arrière-plan | Prototypes sur appareils réels, matrice de compatibilité, commencer par les fonctions techniquement fiables |
| Absence d’accord opérateur | Pas de localisation réseau ni de blocage automatisé | MVP utile sans intégration, dossiers exportables et négociation distincte |
| Retard ou refus institutionnel | Parcours judiciaire indisponible | Ne pas présenter le service comme canal officiel tant qu’il n’est pas validé |
| Usage de surveillance ou harcèlement | Atteinte grave à la sécurité des personnes | Consentement, accès limité, identifiants temporaires, contrôles anti-abus et mécanisme de plainte |
| Fuite de positions ou justificatifs | Risque physique, fraude ou usurpation | Chiffrement, minimisation, durée limitée, séparation des rôles et réponse aux incidents |
| IMEI erroné ou contesté | Blocage ou signalement indu | Vérification de propriété, confirmation avant transmission et processus de rectification |
| Incompatibilité avec les règles des magasins | Rejet ou retrait des applications | Revue des politiques Android/iOS avant publication et tests de conformité |
| Dépendance à un prestataire étranger | Risque juridique, opérationnel ou de transfert de données | Analyse des fournisseurs, contrats, localisation des données et plan de réversibilité |

## 16. Décisions validées et questions à trancher avant le développement

Les décisions de lancement déjà validées sont : pilote à Cotonou ; couverture dès le pilote d’Android, iOS/iPadOS, Windows, macOS et Linux ; prise en charge des smartphones, tablettes et PC. Les capacités et la qualification exacte restent propres à chaque OS et matériel.

Les décisions opérationnelles et de gouvernance encore à trancher sont :

1. Quelle organisation portera juridiquement le service et sera responsable des traitements ?
2. Quelle fréquence de collecte est acceptable en mode normal et en mode incident, après analyse d’impact et consultation de l’APDP ?
3. Quel mécanisme de vérification du propriétaire est proportionné et accessible ?
4. Quel opérateur ou quelle institution est prêt à étudier le pilote, et selon quel canal ?
5. Quel est le processus local de dépôt et de suivi d’une plainte pour vol, et quelles pièces sont nécessaires ?
6. Les cercles peuvent-ils partager une position, ou seulement des alertes ? Pour quelle durée ?
7. Quelles langues autres que le français sont prioritaires ?
8. Quel modèle économique finance l’assistance, l’hébergement sécurisé, les échanges partenaires et les audits sans vendre positions ou identifiants ?
9. Quelles durées de conservation et modalités de transfert de données l’APDP et les partenaires valideront-ils ?
10. Le projet vise-t-il à terme un accessoire Bluetooth dédié, en plus des appareils existants ?

## 17. Références documentaires

Les références ci-dessous servent au cadrage fonctionnel et technique. Leur contenu devra être revalidé avant le lancement opérationnel.

[1]: https://simulateur.arcep.bj/operateurs "ARCEP Bénin — liste des opérateurs autorisés"
[2]: https://developers.google.com/nearby/fast-pair/landing-page-find-hub "Google Developers — guide d’intégration partenaire Find Hub"
[3]: https://developer.apple.com/find-my/ "Apple Developer — intégration au réseau Find My"
[4]: https://www.afapdp.org/wp-content/uploads/2018/06/Benin-Loi-2017-20-Portant-code-du-numerique-en-Republique-du-Benin.pdf "Bénin — Loi n° 2017-20 portant Code du numérique"
[5]: https://service-public.bj/public/privacy-policy "Portail national des services publics du Bénin — politique de confidentialité"
[6]: https://developer.android.com/develop/connectivity/bluetooth/ble/background "Android Developers — communications Bluetooth en arrière-plan"
[7]: https://developer.apple.com/documentation/corebluetooth "Apple Developer — Core Bluetooth"
[8]: https://www.gsma.com/get-involved/working-groups/terminal-steering-group/imei-database/ "GSMA — services de base de données et registre IMEI"
[9]: https://developers.google.com/maps/documentation/javascript/overview "Google Maps Platform — cartes interactives 2D et 3D pour le Web"
[10]: https://developers.google.com/maps/documentation/geolocation/overview "Google Maps Platform — Geolocation API et données Wi-Fi ou antennes"
[11]: https://developers.google.com/earth-engine/guides/access "Google Earth Engine — accès aux outils géospatiaux et projets Cloud"
[12]: https://support.google.com/maps/answer/2839911?hl=fr "Aide Google Maps — déterminer la position et comprendre sa précision"
[13]: https://developers.google.com/maps/documentation/geolocation/usage-and-billing "Google Maps Platform — facturation et quotas de Geolocation API"
[14]: https://developer.android.com/reference/android/content/Intent "Android Developers — ACTION_SHUTDOWN"
[15]: https://developer.apple.com/documentation/uikit/preparing-your-ui-to-run-in-the-background "Apple Developer — cycle de vie des applications en arrière-plan"
[16]: https://developer.android.com/develop/background-work/services/fgs/service-types "Android Developers — types de services de premier plan et caméra"
[17]: https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start "Android Developers — restrictions de démarrage en arrière-plan"
[18]: https://developer.apple.com/documentation/avfoundation/avcapturesession/interruptionreason/videodevicenotavailableinbackground "Apple Developer — caméra indisponible en arrière-plan"
[19]: https://developer.apple.com/app-store/review/guidelines/ "Apple — App Review Guidelines, consentement et enregistrement"


## 18. Clarification explicite du périmètre des appareils

Le produit concerne explicitement **les smartphones, les tablettes et les PC**, et non uniquement les téléphones. Par « PC », le cahier des charges entend les ordinateurs portables et les ordinateurs de bureau. Les systèmes d’exploitation retenus pour le pilote sont Android et iOS/iPadOS pour les appareils mobiles, ainsi que Windows (Windows 11 en cible principale et versions Windows 10 encore sécurisées), macOS et les distributions Linux qualifiées pour les PC.

Les parcours et les capacités diffèrent selon la catégorie :

- **Smartphones et tablettes** : application mobile, localisation de l’appareil lorsque l’application, les permissions, la batterie et la connectivité le permettent ; détection communautaire Bluetooth uniquement sur les matériels et systèmes compatibles.
- **PC portables** : agent ou application installée avant l’incident, pouvant transmettre la dernière position disponible selon les capacités du PC et du système. La plupart des PC portables ne disposent pas nécessairement d’un GPS utilisable par une application ; les informations réseau ou Wi-Fi, lorsqu’elles sont accessibles, peuvent ne donner qu’une estimation approximative.
- **PC de bureau** : agent installé et associé au compte avant le vol. La localisation peut dépendre d’une connexion réseau et d’informations de localisation disponibles sur le système ; un PC fixe ne possède généralement pas de GPS intégré. Une adresse IP ne fournit pas une position précise garantie.

L’accès au portail web depuis un navigateur ne suffit pas à localiser un PC après le vol : la localisation en arrière-plan exige qu’un logiciel ait été installé et configuré avant l’incident, et qu’il ait encore la capacité de fonctionner et de communiquer. Un PC éteint, déconnecté, réinitialisé ou dont l’agent a été supprimé ne peut pas être localisé par le seul portail.

Le futur agent PC devra respecter les autorisations et mécanismes de sécurité de chaque système. Il ne devra ni se dissimuler à l’utilisateur, ni contourner les protections du système, ni empêcher abusivement la désinstallation. La gestion à distance, le verrouillage ou l’effacement seront proposés uniquement s’ils sont pris en charge par une intégration approuvée et avec une confirmation claire du propriétaire.

Les formulaires d’inventaire devront donc proposer des champs adaptés : IMEI pour les équipements mobiles qui en possèdent (saisi ou confirmé par le propriétaire lorsque le système ne permet pas à l’application de le lire), numéro de série et modèle pour les PC et tablettes, système d’exploitation et version, ainsi qu’une preuve de propriété. **Un IMEI n’est pas un identifiant disponible sur tous les PC et ne doit jamais être exigé pour un ordinateur qui n’en possède pas.**

Les critères d’acceptation du pilote et les mesures de couverture seront ventilés par type d’appareil et système d’exploitation. Le succès d’une fonction sur smartphone ne sera pas considéré comme preuve de son fonctionnement sur tablette ou PC.

## 19. Page dédiée de géolocalisation et cartographie

### 19.1 Objectif

Le portail et les applications doivent proposer une page sécurisée permettant au propriétaire de visualiser les positions reçues pour son appareil et, lorsque cela est possible, les observations du réseau communautaire ou les réponses communiquées par un partenaire habilité. Cette page affiche des éléments de preuve géographique ; elle ne crée pas elle-même une position et ne rend pas un signal plus précis par le choix du fond de carte.

### 19.2 Fond cartographique

Pour le portail Web, la Google Maps JavaScript API est le fond cartographique de référence du produit ; elle permet d’afficher une carte interactive, des vues 2D et 3D, des marqueurs et des couches de données personnalisées [9]. Pour les applications natives, la spécification technique évaluera les SDK Maps Platform adaptés à Android et iOS afin d’assurer une présentation cohérente. La page proposera, si disponible dans la zone et permis par les conditions d’utilisation, des vues plan, satellite/hybride et une vue 3D photoréaliste.

Le souhait d’une présentation de type Google Earth est traité comme un **choix de visualisation** (vue satellite/3D), non comme une source de géolocalisation supérieure. Google Earth Engine est une plateforme de traitement et d’analyse de données géospatiales nécessitant un projet Cloud et une configuration d’accès ; il n’est pas défini ici comme moteur de suivi d’appareils en direct [11]. Aucune fusion des API Earth et Maps ne sera considérée comme augmentant, à elle seule, la précision d’un point.

### 19.3 Sources de positions affichées

La carte peut représenter des éléments différents, avec des symboles et légendes distincts :

- position de l’appareil propre au projet obtenue par l’API de localisation du système ;
- observation Bluetooth communautaire, indiquant le lieu et l’heure où un appareil participant a détecté le signal ;
- estimation de position issue de données Wi-Fi ou d’antennes, si elles ont été obtenues légalement et si une API ou un partenaire autorisé les fournit ;
- position communiquée par un opérateur ou une autorité dans le cadre autorisé ;
- dernière position connue, affichée comme ancienne lorsqu’elle ne correspond plus à une observation récente.

**Exigence obligatoire — Google Maps Platform Geolocation API.** Le service doit intégrer et utiliser cette API pour estimer une position à partir des points d’accès Wi-Fi et des données d’antennes compatibles disponibles et légalement accessibles ; la réponse de Google comprend latitude/longitude et un rayon d’incertitude [10]. L’intégration doit faire partie du produit livré, et non rester une option à étudier.

L’application ou le composant autorisé transmet uniquement les mesures d’entrée que l’appareil ou le partenaire peut légalement et techniquement fournir. Les systèmes mobiles restreignent parfois l’accès aux identifiants bruts de Wi-Fi ou de cellule : l’appel API est donc exécuté lorsqu’un ensemble d’entrées valides est disponible. Si les entrées nécessaires manquent, l’application utilise la position native autorisée et indique que Google Geolocation n’a pas pu être sollicitée pour cette observation ; elle ne fabrique ni ne déduit de coordonnées. Cette API n’est pas un accès au réseau interne de l’opérateur et ne garantit pas une position plus précise que les sources fournies.

L’API doit être intégrée avec un projet Google Cloud configuré, la facturation activée, des identifiants protégés, des restrictions de clé, des quotas et des alertes de consommation. Google facture l’API à l’usage par requête et permet de configurer des quotas [13]. Les appels doivent être limités aux cas utiles, protégés contre les abus, journalisés sans conserver inutilement les mesures brutes et expliqués dans l’information de confidentialité. La disponibilité et la qualité du résultat au Bénin seront mesurées pendant le pilote, sans remettre en cause l’obligation d’intégrer l’API.

### 19.4 Affichage, historique et contrôle

La page doit permettre au propriétaire de :

- voir la position la plus récente et son horodatage, avec sa source ;
- visualiser le rayon ou la zone d’incertitude, sans afficher une précision fictive ;
- filtrer les observations par appareil, type de source et période ;
- consulter une suite chronologique de positions et de détections, lorsque l’historique a été conservé légalement ;
- distinguer visuellement une observation directe, une détection communautaire et une estimation réseau ;
- basculer entre les vues cartographiques disponibles sans modifier les coordonnées sous-jacentes ;
- déclencher un export de dossier incluant les horodatages et la provenance des éléments sélectionnés.

L’accès à cette page exige une authentification renforcée. Les membres d’un cercle ne voient une position que si le propriétaire l’a explicitement partagée pour une durée déterminée. Les agents de support n’ont pas un accès général à la carte.

### 19.5 Moteur de fusion et de « triangulation »

Le terme « triangulation » désigne dans le produit un **calcul d’estimation distinct du rendu cartographique**. Le moteur doit conserver les observations sources séparément, puis estimer une zone probable uniquement lorsque plusieurs mesures exploitables sont disponibles. Chaque estimation doit indiquer les sources utilisées, leur âge, la méthode, une incertitude ou un rayon estimé, et un niveau de confiance explicable.

Une carte satellite, un zoom plus élevé ou une imagerie 3D ne réduit pas l’incertitude des coordonnées reçues. Une observation Bluetooth isolée ne donne pas, à elle seule, une distance exacte. Plusieurs détections faites par des téléphones situés à des endroits différents peuvent aider à délimiter une zone, mais leur fiabilité dépend de la qualité des positions des téléphones détecteurs, des heures de détection, des mesures radio et de l’environnement. Une triangulation à partir d’antennes cellulaires nécessite des mesures et données réseau qui ne sont pas disponibles à la plateforme sans le concours de l’opérateur et le cadre légal approprié.

Le moteur ne doit pas fusionner des mesures incompatibles en un point précis artificiel. Si les données sont insuffisantes ou contradictoires, il affiche plusieurs observations et leurs incertitudes séparément. Les règles de fusion, pondérations, seuils de fraîcheur et métriques de confiance seront définis dans la spécification technique et vérifiés sur des données de terrain au Bénin.

