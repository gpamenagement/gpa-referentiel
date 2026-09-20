#!/usr/bin/env python3
"""La gate des illustrations — elle refuse une boucle qui ne referme pas.

    python3 scripts/gate_illustrations.py           # les trois contrôles statiques
    python3 scripts/gate_illustrations.py --rendu   # + la comparaison de pixels

Mehdi a posé le critère de recette en une phrase : *« teste les animations en
mode loop — les animations reviennent au point de départ »*. C'est exactement ce
que cette gate mesure, et elle le mesure **deux fois**, parce que les deux
mesures attrapent des défauts différents.

## Les trois contrôles statiques

1. **`0 %` et `100 %` déclarent la même chose.** Une boucle dont les deux
   extrémités diffèrent saute à chaque tour. Le saut dure une image : on le
   ressent sans savoir le nommer, et il ne se voit sur aucune capture.
2. **La durée écrite dans le CSS est celle de la table.** `animations.ts` décrit
   chaque animation pour la vitrine et le catalogue, le CSS l'exécute. Une durée
   corrigée d'un seul côté ne casse rien — elle fait juste mentir le catalogue.
3. **Chaque animation de la table existe dans le CSS, et réciproquement.** Une
   animation décrite mais jamais déclarée s'affiche dans la vitrine et ne bouge
   pas ; déclarée mais jamais décrite, elle est invisible de tout le monde.

## Le contrôle de rendu, et pourquoi il ne suffit pas d'y croire

Les trois premiers lisent du texte. Ils ne voient pas une fonction de transition
mal choisie, ni une transformation dont l'origine déporte la forme hors cadre.
`--rendu` ouvre donc un navigateur, fige chaque animation à `t = 0` puis à
`t = une période`, et compare les deux images. Une différence de plus de
`SEUIL` pixels sur mille est un cycle qui dérive.

La figure est photographiée avec `animation-delay` négatif plutôt qu'en
attendant le temps réel : une attente de huit secondes par animation rendrait la
gate trop lente pour être lancée, donc jamais lancée.
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys
import tempfile

RACINE = pathlib.Path(__file__).resolve().parents[1]
CSS = RACINE / "src" / "styles" / "illustrations.css"
TABLE = RACINE / "src" / "components" / "brand" / "illustrations" / "animations.ts"
LOT = RACINE / "src" / "components" / "brand" / "illustrations" / "lot.ts"
SEUIL = 1.0  # pixels différents pour mille, au-delà desquels le cycle dérive


# --------------------------------------------------------------------------
# Lecture
# --------------------------------------------------------------------------


def keyframes(css: str) -> dict[str, dict[str, str]]:
    """`{nom: {arrêt: déclarations}}` pour chaque bloc `@keyframes`."""
    out: dict[str, dict[str, str]] = {}
    for m in re.finditer(r"@keyframes\s+([\w-]+)\s*\{(.*?)\n\}", css, re.S):
        arrets: dict[str, str] = {}
        for a in re.finditer(r"([\d%,\sfromto]+?)\s*\{([^}]*)\}", m.group(2)):
            # `0%, 100% { … }` déclare deux arrêts d'un coup.
            decl = " ".join(a.group(2).split())
            for cle in a.group(1).replace("from", "0%").replace("to", "100%").split(","):
                arrets[cle.strip()] = decl
        out[m.group(1)] = arrets
    return out


def durees_css(css: str) -> dict[str, float]:
    """`{nom d'animation: durée}` lue dans les règles `animation:`."""
    out: dict[str, float] = {}
    for m in re.finditer(r"animation:\s*illu-([\w-]+)\s+([\d.]+)s", css):
        out[m.group(1)] = float(m.group(2))
    return out


def table_animations() -> dict[str, dict]:
    """La table d'`animations.ts`, lue sans exécuter de TypeScript."""
    t = TABLE.read_text(encoding="utf-8")
    bloc = t[t.index("> = {") + 5 : t.rindex("}")]
    out: dict[str, dict] = {}
    for m in re.finditer(r"(\w+):\s*\{(.*?)\n  \},", bloc + "\n  },", re.S):
        corps = m.group(2)
        boucle = re.search(r"boucle:\s*(true|false)", corps)
        duree = re.search(r"duree:\s*([\d.]+)", corps)
        ferm = re.search(r"fermeture:\s*'(\w+)'", corps)
        if boucle and duree:
            out[m.group(1)] = {"boucle": boucle.group(1) == "true",
                               "fermeture": ferm.group(1) if ferm else "declaration",
                               "duree": float(duree.group(1))}
    return out


# --------------------------------------------------------------------------
# Les contrôles statiques
# --------------------------------------------------------------------------


def controler(besoin_rendu: list[str]) -> list[str]:
    css = CSS.read_text(encoding="utf-8")
    kf = keyframes(css)
    durees = durees_css(css)
    table = table_animations()
    defauts: list[str] = []

    if not table:
        return ["animations.ts : table illisible — le format a changé ?"]

    for nom, info in table.items():
        arrets = kf.get(f"illu-{nom}")
        if arrets is None:
            defauts.append(f"{nom} : décrite dans la table, aucun @keyframes illu-{nom}")
            continue

        if info["boucle"] and info["fermeture"] == "declaration":
            debut, fin = arrets.get("0%"), arrets.get("100%")
            if debut is None or fin is None:
                defauts.append(f"{nom} : boucle sans arrêt 0 % ou 100 %")
            elif debut != fin:
                defauts.append(
                    f"{nom} : la boucle ne referme pas — elle sautera à chaque tour\n"
                    f"      0 %   : {debut}\n"
                    f"      100 % : {fin}"
                )
        elif info["boucle"]:
            # Fermeture par position : les deux extrémités déclarent des valeurs
            # différentes et rendent la même image, parce que l'élément est hors
            # cadre aux deux bouts. Le texte ne peut pas le dire — seul le rendu
            # le prouve, et c'est pourquoi on refuse une fermeture par position
            # que `--rendu` n'a jamais vérifiée.
            besoin_rendu.append(nom)
        elif arrets.get("0%") == arrets.get("100%"):
            defauts.append(
                f"{nom} : déclarée hors boucle, mais ses deux extrémités sont "
                "identiques — soit c'est une boucle, soit elle ne fait rien"
            )

        if (d := durees.get(nom)) is None:
            defauts.append(f"{nom} : aucune règle `animation: illu-{nom} …s` dans le CSS")
        elif abs(d - info["duree"]) > 0.001:
            defauts.append(
                f"{nom} : {d}s dans le CSS, {info['duree']}s dans la table — "
                "le catalogue annoncerait une durée fausse"
            )

    for nom in durees:
        if nom not in table:
            defauts.append(f"{nom} : déclarée dans le CSS, absente de la table — invisible du catalogue")

    return defauts


# --------------------------------------------------------------------------
# Le contrôle de rendu
# --------------------------------------------------------------------------

PAGE = """<!doctype html><meta charset="utf-8">
<style>
  body {{ margin: 0; background: #fff; }}
  :root {{ --color-accent: #E8503A; }}
  #c {{ width: 420px; color: #111; }}
  {css}
  /* Le figeage : durée nulle et retard négatif placent l'animation à l'instant
     voulu sans attendre. Sans `animation-play-state: paused`, Chromium peut
     avancer d'une image entre la pose et la capture. */
  .fige, .fige * {{ animation-play-state: paused !important; }}
</style>
<div id="c">{svg}</div>
"""


def svg_dune_illustration(nom: str) -> tuple[str, str]:
    """Le balisage d'une illustration du lot, tel que le composant le rend."""
    t = LOT.read_text(encoding="utf-8")
    m = re.search(
        rf"\n  {nom}: \{{.*?largeur: (\d+), hauteur: (\d+),\s*"
        r'encre: \{ t: "([^"]*)", d: "([^"]*)" \},\s*'
        r'accent: \{ t: "([^"]*)", d: "([^"]*)" \},',
        t, re.S)
    if not m:
        sys.exit(f"illustration « {nom} » introuvable dans lot.ts")
    l, h, te, de, ta, da = m.groups()
    return (
        f'<svg id="s" class="illu" viewBox="0 0 {l} {h}" style="width:100%;height:auto">'
        f'<g transform="{te}" fill="currentColor"><path d="{de}"/></g>'
        f'<g class="illu-accent" transform="{ta}" fill="var(--color-accent)"><path d="{da}"/></g>'
        f'<rect class="illu-lueur" x="{-int(l)//4}" y="0" width="{int(l)//4}" height="{h}" '
        f'fill="var(--color-accent)" opacity="0.13"/>'
        f"</svg>", nom)


def controler_rendu() -> list[str]:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return ["--rendu demandé mais playwright absent (pip install playwright)"]
    from PIL import Image, ImageChops

    css = CSS.read_text(encoding="utf-8")
    table = {n: i for n, i in table_animations().items() if i["boucle"]}
    svg, _ = svg_dune_illustration("le_cloud_et_lia")
    defauts: list[str] = []

    with tempfile.TemporaryDirectory() as tmp, sync_playwright() as pw:
        d = pathlib.Path(tmp)
        nav = pw.chromium.launch()
        page = nav.new_page(viewport={"width": 460, "height": 400}, device_scale_factor=2)
        for nom, info in table.items():
            images = []
            for instant in (0.0, info["duree"]):
                page.set_content(PAGE.format(css=css, svg=svg))
                page.eval_on_selector(
                    "#s",
                    "(e, a) => { e.setAttribute('data-anim', a.nom);"
                    " e.style.animationDelay = `-${a.t}s`;"
                    " e.querySelectorAll('*').forEach(x => x.style.animationDelay = `-${a.t}s`);"
                    " e.classList.add('fige'); }",
                    {"nom": nom, "t": instant},
                )
                page.wait_for_timeout(120)
                f = d / f"{nom}-{instant}.png"
                page.locator("#c").screenshot(path=str(f))
                images.append(Image.open(f).convert("RGB"))

            diff = ImageChops.difference(*images)
            n = sum(1 for p in diff.get_flattened_data() if p != (0, 0, 0))
            pour_mille = n * 1000 / (images[0].width * images[0].height)
            etat = "✓" if pour_mille <= SEUIL else "✗"
            print(f"  {etat} {nom:<10} t=0 vs t={info['duree']}s : "
                  f"{pour_mille:.2f} ‰ de pixels différents")
            if pour_mille > SEUIL:
                defauts.append(
                    f"{nom} : le cycle ne revient pas à son point de départ "
                    f"({pour_mille:.2f} ‰ > {SEUIL} ‰)"
                )
        nav.close()
    return defauts


# --------------------------------------------------------------------------


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--rendu", action="store_true",
                    help="compare aussi les pixels à t=0 et t=une période")
    args = ap.parse_args()

    print("Gate des illustrations")
    besoin_rendu: list[str] = []
    defauts = controler(besoin_rendu)
    if not defauts:
        t = table_animations()
        n_boucles = sum(1 for i in t.values() if i["boucle"])
        print(f"  ✓ {len(t)} animations, dont {n_boucles} en boucle — "
              "keyframes fermés, durées cohérentes")
        if besoin_rendu:
            print(f"  · {', '.join(besoin_rendu)} ferme(nt) par position : "
                  "seule la comparaison de rendu en fait foi")

    if args.rendu:
        print("\nComparaison de rendu")
        defauts += controler_rendu()
    elif besoin_rendu and not defauts:
        # Un avertissement, pas un arrêt : la gate doit rester lançable sans
        # navigateur. Mais le taire ferait croire que tout est vérifié alors que
        # la seule preuve qui vaille pour ces animations n'a pas été produite.
        print(f"\n  ! {len(besoin_rendu)} animation(s) non vérifiée(s) — "
              "relancer avec --rendu avant de publier")

    if defauts:
        print("\n" + "\n".join(f"  ✗ {d}" for d in defauts))
        sys.exit(f"\n{len(defauts)} défaut(s).")
    print("\nContrat tenu.")


if __name__ == "__main__":
    main()
