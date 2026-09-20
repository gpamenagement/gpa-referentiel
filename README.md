# `gpa-referentiel` — le référentiel SI de Grand Paris Aménagement

**Marché 202600092** — AMOA cartographie SI, référentiel fonctionnel et schéma directeur
SI & Data. Application web du référentiel : la première version est livrée **avec l'offre**,
construite à partir du patrimoine informationnel déjà public de l'établissement.

> **Dépôt public, droits réservés.** Le code est visible de tous ; sa propriété intellectuelle
> reste celle de **BOOTLY SASU (Flowmetrik)**. Lire et citer : libre. Reproduire, modifier ou
> réutiliser : autorisation écrite. En cas d'attribution du marché, Grand Paris Aménagement
> reçoit sur les livrables de la mission un droit d'usage, de modification et de réutilisation
> **sans limitation technique ni contractuelle** (article 7 du CCTP). Détail : [`LICENSE`](LICENSE).
>
> Les données embarquées sont **publiques uniquement** ; aucune donnée interne de l'établissement.

Émetteur : **BOOTLY SASU**, nom commercial Flowmetrik. Le document porte la **charte de Grand
Paris Aménagement** : c'est leur marque qui tient l'écran, la nôtre signe en pied de latérale.

## Ce que c'est

Huit vues, une adresse citable par vue (`#carte` s'envoie par courriel), un socle de données
unique et daté, et un niveau de preuve sur **chaque** entrée affichée.

| Vue | Livrable du CCTP | État des données |
|---|---|---|
| Accueil | — | ce que le référentiel contient, d'où il vient, ce qui lui manque |
| Cartographie applicative | 10 | 15 applications nommées par le CCTP + 5 hypothèses |
| Objets de données | 12 | 11 objets — **hypothèse de travail déclarée**, pas constat |
| Carte du SI | **14 et 16** | processus → objet → application, parcourue dans les deux sens |
| Organisation | — | 5 directions territoriales, 8 filiales, 71 personnes d'instances publiées |
| Opérations | 9 | 58 opérations, 46 périmètres publiés, positions réelles |
| Qualité et confiance | — | six contrôles, et la North Star qui affiche zéro tant qu'aucun atelier n'a eu lieu |
| Méthodologie | Niveau 0 | comment chaque entrée a été obtenue, et comment l'enrichir |

Les six vues restantes du contrat (processus, fonctionnalités, interfaces, redondances,
gouvernance, schéma directeur) sont **déclarées dans l'accueil, pas cachées** : elles s'ouvrent
au fil de la mission.

## Démarrer

```bash
pnpm install
python3 scripts/importer_base_gpa.py     # reconstruit src/donnees/socle.json
pnpm dev                                  # http://localhost:5311
```

Pour regarder ce qui sort :

```bash
pnpm build && pnpm preview --port 5312
python3 scripts/verifier.py               # quatre sondes + 12 captures
```

**Sur le tailnet**, pour regarder depuis un téléphone :

```bash
pnpm build
python3 scripts/servir.py --port 5390 &                       # dist/ en statique
tailscale serve --bg --https=8490 http://127.0.0.1:5390       # → https://cowork-linux.tailef30ea.ts.net:8490/
```

Deux choses à savoir. `pnpm preview` ne convient PAS derrière le pont : Vite refuse une requête
dont l'en-tête `Host` n'est pas dans `allowedHosts`, et la réponse « Blocked request » n'est
expliquée nulle part dans le journal du pont. Et ce pont est posé **hors du registre**
`flowhub-vm/apps.yaml` : il survit à un redémarrage du serveur statique, mais **un
`apps.py apply` réécrit la configuration `tailscale serve` depuis le registre et le supprimerait**
— sans erreur. L'entrée au registre est une gate.

**La sortie autonome** — un seul fichier `.html`, tout inliné, qui s'ouvre sans serveur (courriel,
téléphone, poste de soutenance sans réseau) :

```bash
pnpm build:autonome && python3 scripts/autonome.py   # dist-autonome/index.html, ~1,3 Mo
```

`vite-plugin-singlefile` inline le JS et le CSS, **mais pas `public/`** : ces fichiers restent
référencés par une URL absolue, et le fichier « autonome » perd alors ses polices et ses logos
**sans qu'aucune erreur ne le signale**. `scripts/autonome.py` les remplace par des data URI,
puis ouvre le résultat **en `file://`** pour le vérifier — c'est précisément ce protocole qui
casse les URL absolues, donc c'est le seul qui prouve quelque chose. Deux pièges vérifiés :
Vite écrit les URL du CSS en relatif (`url(./brand/…)`, d'où un `.` qui survit au remplacement
et produit une URL invalide), et une URL construite à la volée dans du JSX
(`` `/brand/logo/${x}.svg` ``) n'existe pour l'assembleur que sous forme de morceaux — d'où les
logos **importés** dans `src/assets/marque/`, jamais référencés par chemin.

## Les quatre sondes de `verifier.py`

Chacune est née d'un défaut déjà produit ailleurs, et qu'aucune erreur ne signale :

1. **Rubik est réellement embarquée** — `document.fonts.check('16px Rubik')`. Un rendu qui
   retombe sur Arial est valide, lisible, et hors charte.
2. **Aucun débordement horizontal**, en 1440 et en 390 px. La cause n'est jamais le texte :
   c'est un enfant flex qui refuse de se comprimer.
3. **Aucun texte invisible** — une variable CSS inconnue ne lève pas : la couleur tombe sur
   `transparent` et la page paraît simplement vide à cet endroit.
4. **La carte dessine au moins 50 nœuds** — un graphe vide est une page parfaitement valide :
   si la simulation échoue, le cadre est là, et il ne contient rien.

## La carte des opérations

Fond **Géoplateforme IGN** (`data.geopf.fr`, WMTS `PLANIGNV2`) — ouvert, sans clé ni compte : un
établissement public français regarde ses opérations sur la carte de l'État, et un fond qui exige
un jeton est une dépendance qu'un marché public fait justifier.

**`maplibre-gl` est épinglée en `5.24.0`.** En `6.9.0`, sur cette machine, le worker ne termine
jamais le chargement du style : `isStyleLoaded()` reste faux, la source GeoJSON n'est jamais
découpée en tuiles, et la carte s'affiche **avec son fond, ses contrôles et son échelle, mais sans
un seul point** — sans erreur de console, sans requête en échec, sans rien dans le journal. Ne pas
remonter de version sans repasser `scripts/verifier.py`, dont la sonde compte les points
**rendus** (`queryRenderedFeatures`) et non ceux de la source.

Deuxième piège, du même genre : trois opérations portaient `lat 0 / lon 0` — un géocodage échoué,
pas une position. Gardées, elles étiraient l'emprise jusqu'au golfe de Guinée, le cadrage
automatique dézoomait à l'échelle du monde, et les 55 autres devenaient invisibles. Elles sont
écartées à l'import et comptées à l'écran comme « sans position ».

## La charte

`src/styles/charte-gpa.css` est **la seule façon dont la charte d'un tiers entre dans le socle
whiteapp**. Il est importé après `tokens.css` (généré, interdit d'édition) et redéfinit les
mêmes primitives, que le `@theme inline` de `index.css` lit à l'exécution : toutes les classes
du socle deviennent GPA sans qu'une seule soit réécrite.

Ce qui n'est **pas** fait, et pourquoi :

- pas de `brands/gpa.json` — `assets/tools/build_css.py` du cowork refuse tout jeton hors des
  cinq clés d'accent (« une filiale ne change QUE son accent »). Une charte tierce change les
  polices, les neutres et le logo : elle n'entre pas par ce point d'extension, et le forcer
  imposerait de forker la chaîne de charte en huit endroits ;
- **pas de thème sombre** — il n'existe pas dans la charte GPA. La bascule a été retirée de la
  coquille plutôt que d'inventer un sombre ;
- **pas de niveaux de gris sur les photographies** — GPA n'en emploie jamais, alors que le
  composant photo du socle les applique par défaut.

Palette, typographie et preuves : `charte-gpa/CHARTE.md` du dossier d'offre. Toutes les valeurs
sont relevées sur les supports officiels, aucune n'est dérivée.

**Le logo blanc n'est pas le logo couleur inversé.** `gpa-logo-white.svg` porte son mot-logo en
`fill="white"` : posé sur du blanc, il ne resterait que le pictogramme et le nom de
l'établissement disparaîtrait sans qu'aucune erreur ne le signale. Il ne sert que sur la
latérale marine.

## Les données

`scripts/importer_base_gpa.py` projette la base publique du dossier d'offre
(`flowao/data/dce/686974/base-gpa/`) dans `src/donnees/socle.json`. Le script **n'invente ni ne
corrige rien** : il agrège, et conserve le niveau de preuve de chaque entrée.

Le **graphe est calculé par le script**, pas dans le navigateur : la topologie est une propriété
des données, pas de l'écran qui les montre. d3 ne fait que placer les nœuds ; React les dessine,
donc aucune couleur n'est écrite en dur.

Deux choses ne s'obtiennent pas de l'extérieur, et le disent dans l'application : le catalogue
de données réel (qui demande les accès) et l'annuaire nominatif (qui vit dans l'Entra ID de
l'établissement). **Aucun trombinoscope n'a été reconstitué depuis les réseaux sociaux** : les
personnes affichées siègent dans des instances dont la composition est publiée.

## Ce qui reste à faire

- **L'authentification** : lien magique par Google Identity Platform et garde par domaine
  `@grandparisamenagement.fr`, sur le patron de FlowAO (`identite.py` + `session.py` +
  `acces.py`). FlowSSO ne protège rien : c'est une façade de domaine et un journal.
- **L'API et la couche dbt** : `src_*` → `socle_*` → `ref_*` sur PostgreSQL, en remplacement du
  JSON compilé.
- **Les exports bureautiques** — Word, Excel, Draw.io. Le CCTP exige un format modifiable
  réutilisable sans limitation : l'application les fabrique, elle n'est jamais l'unique
  détenteur d'un livrable.
- **Le fond de carte IGN** et les périmètres réels, qui viendront du SIG. Le jeu public dit
  qu'un périmètre existe et combien de points il compte — pas ses coordonnées.

Plan complet et chiffrage : `flowao/data/dce/686974/app-gpa/PLAN.md` du cowork.
