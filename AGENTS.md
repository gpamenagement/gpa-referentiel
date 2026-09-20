# `gpa-referentiel` — instructions agents

> Fichier **router**. Le contrat global vit dans `~/projects/flowmetrik-cowork/AGENTS.md` —
> langue, autonomie, gates, marque. Rien n'est répété ici : un fait vit à un seul endroit.
> Le mode d'emploi humain est [`README.md`](README.md) ; ne pas le paraphraser, l'ouvrir.

## Ce dépôt porte la charte d'un tiers

Ce livrable est émis pour **Grand Paris Aménagement** dans le cadre du marché 202600092. Trois
règles en découlent, et elles renversent les réflexes du socle :

1. **La charte affichée est celle de GPA**, pas la nôtre. Tout passe par
   `src/styles/charte-gpa.css`, importé après `tokens.css`. **Ne jamais éditer `tokens.css`**
   (généré) ni ajouter un `brands/gpa.json` dans le cowork : `build_css.py` refuse tout jeton
   hors accent, et une charte tierce change aussi les polices, les neutres et le logo.
2. **Aucune valeur en dur.** Une couleur GPA s'écrit `var(--gpa-bleu)`, jamais `#23145F`. Les
   valeurs sont relevées et sourcées dans `charte-gpa/CHARTE.md` du dossier d'offre ; une
   couleur qui n'y figure pas n'existe pas.
3. **Pas de thème sombre, pas de niveaux de gris.** GPA n'a ni l'un ni l'autre. La bascule de
   thème a été retirée de la coquille, et le `grayscale` par défaut du composant photo est
   neutralisé. Les rétablir, c'est inventer une charte.

## Ce qui ne s'affiche jamais sans sa preuve

Chaque entité affichée porte son **niveau de preuve** — nommée par le CCTP, par une offre
d'emploi, par un marché public, ou hypothèse. C'est la règle qui distingue ce référentiel d'un
inventaire, et le seul ton d'étiquette autorisé vient de `tonDePreuve()` dans
`src/donnees/socle.ts` : deux vues qui teintent différemment la même preuve font douter de la
donnée, pas du style.

**Un compteur vide s'affiche à zéro, jamais en estimation.** Les interfaces valent 0 parce
qu'aucun atelier n'a eu lieu. Un chiffre inventé sur une cartographie coûte plus cher qu'une
case vide — il sera cité en réunion.

## Les données

Une seule source : `src/donnees/socle.json`, produit par `scripts/importer_base_gpa.py` depuis
`flowao/data/dce/686974/base-gpa/`. Ne jamais éditer le JSON à la main — corriger la base ou le
script, puis relancer. Le **graphe est calculé par le script**, pas dans le navigateur.

Gate G1 du cowork : citer un client par son nom ou son logo, ou nommer un interlocuteur, reste
une décision de Mehdi. Ici, les personnes affichées siègent dans des instances dont la
composition est publiée par l'établissement — **aucun annuaire n'est reconstitué depuis les
réseaux sociaux**, et ce refus est écrit dans la vue Méthodologie.

## Avant de livrer

```bash
pnpm build                                  # compile aussi les types
pnpm preview --port 5312 &
python3 scripts/verifier.py                 # Rubik, débordement, texte invisible + captures
```

`pnpm gate` du socle **n'existe pas** — le script est déclaré dans le `package.json` de la
whiteapp et le fichier `scripts/gate_whiteapp.py` est absent. Il a été retiré ici plutôt que
laissé à casser silencieusement.

`verifier.py` sert **la page construite**, donc il faut reconstruire avant de relancer, sinon
on juge la version précédente sans s'en apercevoir.

## Les gates qui restent

Déploiement en production, DNS, entrée au registre : décisions de Mehdi. Cette application ne
passe **pas** par le rail `flowhub-vm/apps.yaml` — il produit soit un vhost tailnet
inaccessible, soit un vhost derrière IAP. Le rail visé est Cloud Run + mappage de domaine, avec
`--no-invoker-iam-check` (l'org policy refuse `allUsers`) et le contrôle d'accès **dans**
l'application.
