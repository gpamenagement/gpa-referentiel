# `gpa-referentiel` — le référentiel SI de Grand Paris Aménagement

**Marché 202600092** — AMOA cartographie SI, référentiel fonctionnel et schéma directeur
SI & Data. Application web du référentiel : la première version est livrée **avec l'offre**,
construite à partir du patrimoine informationnel déjà public de l'établissement.

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
python3 scripts/verifier.py               # trois sondes + 12 captures
```

## Les trois sondes de `verifier.py`

Chacune est née d'un défaut déjà produit ailleurs, et qu'aucune erreur ne signale :

1. **Rubik est réellement embarquée** — `document.fonts.check('16px Rubik')`. Un rendu qui
   retombe sur Arial est valide, lisible, et hors charte.
2. **Aucun débordement horizontal**, en 1440 et en 390 px. La cause n'est jamais le texte :
   c'est un enfant flex qui refuse de se comprimer.
3. **Aucun texte invisible** — une variable CSS inconnue ne lève pas : la couleur tombe sur
   `transparent` et la page paraît simplement vide à cet endroit.

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
