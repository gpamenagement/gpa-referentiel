#!/usr/bin/env python3
"""Inventorie ce qu'il faut reprendre pour aligner une application sur la whiteapp.

    python3 scripts/audit_migration.py ~/projects/flowsequences/web

Il ne migre rien : il **chiffre** le travail et le range en trois piles, parce
qu'une migration de charte échoue toujours de la même façon — on commence par
les couleurs, on découvre au bout de deux jours qu'il fallait d'abord poser les
tokens, et on refait tout.

  1. LES TOKENS      le fichier de thème local, à remplacer d'un bloc
  2. LES COMPOSANTS  le vocabulaire maison, à faire correspondre nom par nom
  3. LES CLASSES     les couleurs de palette Tailwind écrites en dur

La troisième pile est la seule longue, et elle ne s'automatise pas entièrement :
`bg-amber-50` peut vouloir dire « alerte » ou « surligné ». Le script propose,
un humain tranche.
"""
from __future__ import annotations

import collections
import pathlib
import re
import sys

# Les palettes Tailwind : leur présence signale une couleur choisie hors charte.
PALETTES = ("slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|"
            "teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose")
CLASSE = re.compile(rf"\b(bg|text|border|ring|from|via|to|divide|outline|shadow)-({PALETTES})-(\d{{2,3}})\b")
HEX = re.compile(r"#[0-9a-fA-F]{6}\b")

# La correspondance de vocabulaire. Elle est écrite ici et non devinée : deux
# projets peuvent appeler « Carte » deux choses différentes, et c'est la lecture
# du fichier qui tranche — le script ne fait que proposer le rapprochement.
CORRESPONDANCE = {
    "Bouton": "Button (@/components/ui/button)",
    "Carte": "Card (@/components/ui/card)",
    "Champ": "Input (@/components/ui/input)",
    "Pastille": "Badge (@/components/ui/badge)",
    "Statistique": "TuileMetrique (@/features/metriques)",
    "Vide": "EtatVide (@/features/donnees)",
    "Squelette": "Skeleton (@/components/ui/divers)",
    "Avis": "Toaster sonner (voir src/main.tsx)",
    "signaler": "toast() de sonner",
    "Rotation": "Skeleton, ou Chargement (@/components/brand/icones-animees)",
    "BlocEnAttente": "Skeleton + EtatVide",
    "Tableau": "TableauDonnees (@/features/donnees)",
    "Entonnoir": "Courbe / barres (@/features/metriques)",
    "Modale": "Dialog (@/components/ui/dialog)",
    "Onglets": "Tabs (@/components/ui/divers)",
    "Panneau": "PanneauFiche (@/features/fiche)",
    "cn": "cn (@/lib/utils) — identique",
}

SUGGESTION = {
    "red": "danger", "rose": "danger", "orange": "alerte", "amber": "alerte",
    "yellow": "alerte", "green": "succes", "emerald": "succes", "lime": "succes",
    "teal": "succes", "blue": "info", "sky": "info", "indigo": "info",
    "cyan": "info", "violet": "accent de filiale — à vérifier",
    "purple": "accent de filiale — à vérifier", "fuchsia": "hors charte",
    "pink": "hors charte",
    "slate": "neutre", "gray": "neutre", "zinc": "neutre", "neutral": "neutre",
    "stone": "neutre",
}


def sources(racine: pathlib.Path):
    for f in racine.rglob("*"):
        if f.suffix not in {".tsx", ".ts", ".css", ".jsx"}:
            continue
        if any(p in f.parts for p in ("node_modules", "dist", "build", ".git")):
            continue
        yield f


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    racine = pathlib.Path(sys.argv[1]).expanduser().resolve()
    if not racine.exists():
        sys.exit(f"introuvable : {racine}")

    fichiers = list(sources(racine))
    classes: collections.Counter = collections.Counter()
    par_fichier: collections.Counter = collections.Counter()
    hexes: collections.Counter = collections.Counter()
    composants: dict[str, list[str]] = {}
    themes: list[pathlib.Path] = []
    lignes = 0

    for f in fichiers:
        try:
            t = f.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        lignes += t.count("\n")
        for m in CLASSE.finditer(t):
            classes[f"{m.group(1)}-{m.group(2)}-{m.group(3)}"] += 1
            par_fichier[str(f.relative_to(racine))] += 1
        for h in HEX.findall(t):
            hexes[h.lower()] += 1
        if f.suffix == ".css" and ("@theme" in t or ":root" in t):
            themes.append(f)
        for m in re.finditer(r"^export (?:function|const) (\w+)", t, re.M):
            composants.setdefault(str(f.relative_to(racine)), []).append(m.group(1))

    p = print
    p(f"# Audit de migration — {racine.name}\n")
    p(f"{len(fichiers)} fichiers · {lignes} lignes\n")

    p("## 1. Les tokens — à remplacer d'un bloc\n")
    if themes:
        for t in themes:
            p(f"- `{t.relative_to(racine)}`")
        p("\n  Remplacer par `src/styles/` de la whiteapp (`tokens.css`, `relief.css`,")
        p("  `icones.css`, `index.css`), puis `pnpm tokens`. **C'est la première étape :**")
        p("  migrer les classes avant les tokens oblige à tout refaire.")
    else:
        p("- aucun fichier de thème détecté — vérifier à la main.")

    p("\n## 2. Les composants — à faire correspondre nom par nom\n")
    trouves = 0
    for fich, noms in sorted(composants.items()):
        connus = [n for n in noms if n in CORRESPONDANCE]
        if not connus:
            continue
        trouves += len(connus)
        p(f"**`{fich}`**\n")
        for n in connus:
            p(f"  - `{n}` → {CORRESPONDANCE[n]}")
        inconnus = [n for n in noms if n not in CORRESPONDANCE]
        if inconnus:
            p(f"  - _sans équivalent connu :_ {', '.join(inconnus[:8])}"
              f"{' …' if len(inconnus) > 8 else ''}")
        p("")
    if not trouves:
        p("- aucun composant du vocabulaire courant trouvé.\n")

    total = sum(classes.values())
    p(f"## 3. Les classes de palette — {total} occurrences dans "
      f"{len(par_fichier)} fichiers\n")
    if total:
        p("| Classe | Occ. | Rôle probable |")
        p("|---|---:|---|")
        for c, n in classes.most_common(20):
            fam = c.split("-")[1]
            p(f"| `{c}` | {n} | {SUGGESTION.get(fam, '—')} |")
        if len(classes) > 20:
            p(f"\n… et {len(classes) - 20} autres classes distinctes.")
        p("\n**Les dix fichiers les plus touchés :**\n")
        for f, n in par_fichier.most_common(10):
            p(f"- `{f}` — {n}")
        p("\n> Le rôle proposé est une hypothèse : `bg-amber-50` peut vouloir dire")
        p("> « alerte » ou « surligné ». Le script propose, un humain tranche.")
    else:
        p("- aucune. L'application n'écrit pas de couleur de palette en dur.")

    hors = {h: n for h, n in hexes.items()
            if h not in {"#ffffff", "#000000"} and n >= 1}
    p(f"\n## 4. Les hex écrits en dur — {len(hors)} distincts\n")
    for h, n in sorted(hors.items(), key=lambda x: -x[1])[:12]:
        p(f"- `{h}` × {n}")
    if hors:
        p("\n> Un hex de marque tierce (Google, Microsoft) reste légitime : il désigne")
        p("> un service, pas une intention de design. Tous les autres sont une dette.")

    p(f"\n## Ordre de bataille\n")
    p("1. **Tokens** — remplacer le thème, lancer `pnpm tokens`, vérifier que la page charge.")
    p("2. **Un écran de bout en bout** — le plus représentatif, pas le plus simple. Il")
    p("   révèle ce que la correspondance de composants a oublié, avant de l'avoir")
    p("   appliquée trente fois.")
    p("3. **Le reste des écrans**, fichier par fichier, du plus touché au moins touché.")
    p("4. **`pnpm doctor` et la boucle** — ils attrapent le contraste, le focus et les")
    p("   débordements que l'œil laisse passer sur 8 000 lignes.")


if __name__ == "__main__":
    main()
