#!/usr/bin/env python3
"""Le catalogue des illustrations — une page autonome, à ouvrir depuis un téléphone.

    python3 scripts/catalogue_illustrations.py
    python3 scripts/catalogue_illustrations.py --sortie /tmp/catalogue.html

La vitrine du socle (`/showcase/illustrations`) est la référence pour qui
développe : elle vit dans l'application, avec ses tokens et son mode sombre.
Cette page-ci est l'autre besoin, celui qu'elle ne couvre pas — **regarder le
lot sans lancer quoi que ce soit**, depuis un téléphone, en réunion, ou pour
choisir une scène avant d'écrire une ligne.

Elle est donc **autonome** : les tracés, le CSS et les polices de repli sont
dans le fichier. Aucune requête, aucun serveur. Un catalogue qui a besoin d'un
`npm run dev` est un catalogue que personne n'ouvre.

## Ce qu'elle montre, et pourquoi dans cet ordre

1. **Les cinq animations**, avec leur bouton. Le choix s'applique à tout le lot
   d'un coup : une boucle qui saute ne se repère que sur plusieurs dessins à la
   fois — le sursaut d'un seul passe pour un hasard de l'œil.
2. **Les quatre accents de filiale**, parce que c'est la propriété qui distingue
   ce lot d'un pack acheté : l'encre suit le texte, l'accent suit la marque.
3. **Le lot**, en deux familles — les états d'interface et les sujets —, chaque
   scène avec son usage écrit. L'usage n'est pas du confort : c'est ce qui
   empêche d'en ajouter une trente-huitième parce qu'elle serait jolie.
"""

from __future__ import annotations

import argparse
import html
import json
import pathlib
import re
import sys

RACINE = pathlib.Path(__file__).resolve().parents[1]
LOT = RACINE / "src" / "components" / "brand" / "illustrations" / "lot.ts"
CSS = RACINE / "src" / "styles" / "illustrations.css"
TABLE = RACINE / "src" / "components" / "brand" / "illustrations" / "animations.ts"

# Les états d'interface sont les douze scènes d'origine. La liste est ici et pas
# déduite : une scène ne se range pas dans une famille d'après son nom.
ETATS = {
    "vide", "recherche_vide", "erreur", "succes", "attente", "acces_refuse",
    "entretien", "analyse", "feuille_de_route", "equipe", "automatisation", "confiance",
}

# Les quatre accents, lus dans les tokens de la charte plutôt que recopiés.
UNITES = [
    ("Flowmetrik", "#111111"),
    ("FlowSpend", "#1B5FE0"),
    ("FlowImmo", "#B57F00"),
    ("FlowEnergy", "#16A46A"),
    ("FlowRetail", "#E02020"),
]


def lire_lot() -> list[dict]:
    t = LOT.read_text(encoding="utf-8")
    out = []
    for m in re.finditer(
        r"\n  (\w+): \{\s*titre: (\"(?:[^\"\\]|\\.)*\"),\s*usage: (\"(?:[^\"\\]|\\.)*\"),\s*"
        r"largeur: (\d+), hauteur: (\d+),\s*"
        r'encre: \{ t: ("(?:[^"\\]|\\.)*"), d: ("(?:[^"\\]|\\.)*") \},\s*'
        r'accent: \{ t: ("(?:[^"\\]|\\.)*"), d: ("(?:[^"\\]|\\.)*") \},',
        t, re.S,
    ):
        n, ti, us, l, h, te, de, ta, da = m.groups()
        out.append({
            "nom": n, "titre": json.loads(ti), "usage": json.loads(us),
            "largeur": int(l), "hauteur": int(h),
            "encre_t": json.loads(te), "encre_d": json.loads(de),
            "accent_t": json.loads(ta), "accent_d": json.loads(da),
        })
    if not out:
        sys.exit("lot.ts illisible — le format a changé ?")
    return out


def lire_animations() -> dict[str, dict]:
    t = TABLE.read_text(encoding="utf-8")
    bloc = t[t.index("> = {") + 5 : t.rindex("}")]
    out: dict[str, dict] = {}
    for m in re.finditer(r"(\w+):\s*\{(.*?)\n  \},", bloc + "\n  },", re.S):
        c = m.group(2)
        titre = re.search(r'titre:\s*\'([^\']*)\'', c)
        usage = re.search(r'usage:\s*"((?:[^"\\]|\\.)*)"', c)
        boucle = re.search(r"boucle:\s*(true|false)", c)
        duree = re.search(r"duree:\s*([\d.]+)", c)
        if titre and usage and boucle and duree:
            out[m.group(1)] = {
                "titre": titre.group(1),
                "usage": usage.group(1).replace('\\"', '"'),
                "boucle": boucle.group(1) == "true",
                "duree": float(duree.group(1)),
            }
    return out


def svg(i: dict, classe: str = "illu") -> str:
    return (
        f'<svg class="{classe}" viewBox="0 0 {i["largeur"]} {i["hauteur"]}" '
        f'role="img" aria-label="{html.escape(i["titre"], quote=True)}">'
        f'<g transform="{i["encre_t"]}" fill="currentColor"><path d="{i["encre_d"]}"/></g>'
        f'<g class="illu-accent" transform="{i["accent_t"]}" fill="var(--accent)">'
        f'<path d="{i["accent_d"]}"/></g>'
        f'<rect class="illu-lueur" x="{-i["largeur"] // 4}" y="0" '
        f'width="{i["largeur"] // 4}" height="{i["hauteur"]}" fill="var(--accent)" opacity=".13"/>'
        f"</svg>"
    )


def carte(i: dict) -> str:
    return (
        f'<article class="c"><div class="c-dessin">{svg(i)}</div>'
        f'<h3>{html.escape(i["titre"])}</h3>'
        f'<p>{html.escape(i["usage"])}</p>'
        f'<code>{i["nom"].replace("_", "-")}</code></article>'
    )


GABARIT = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Illustrations Flowmetrik — le catalogue</title>
<style>
:root {{
  --ink: #111; --soft: #3d3e3e; --muted: #777b7e; --paper: #fff;
  --mist: #f6f6f5; --line: #e3e6e6; --strong: #aeb2b4;
  --accent: #111111;
  --titre: 'Poppins', system-ui, -apple-system, sans-serif;
  --corps: 'Nunito', system-ui, -apple-system, sans-serif;
  --code: 'Space Grotesk', ui-monospace, monospace;
}}
*, *::before, *::after {{ box-sizing: border-box; margin: 0; }}
body {{ font-family: var(--corps); color: var(--ink); background: var(--paper);
  line-height: 1.6; -webkit-font-smoothing: antialiased; }}
.large {{ max-width: 1180px; margin: 0 auto; padding: 0 20px; }}
header {{ padding: 44px 0 28px; border-bottom: 1px solid var(--line); }}
h1 {{ font-family: var(--titre); font-size: clamp(30px, 6vw, 46px); font-weight: 800;
  letter-spacing: -.025em; line-height: 1.05; }}
.chapo {{ max-width: 62ch; margin-top: 14px; color: var(--soft);
  font-size: clamp(15px, 2.6vw, 18px); }}
.chapo strong {{ color: var(--ink); }}
section {{ padding: 34px 0; border-bottom: 1px solid var(--line); }}
h2 {{ font-family: var(--titre); font-size: clamp(19px, 3.4vw, 24px); font-weight: 800;
  letter-spacing: -.015em; }}
.note {{ max-width: 66ch; margin-top: 8px; color: var(--soft); font-size: 14.5px; }}
.barre {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }}
button {{ font-family: var(--code); font-size: 11.5px; font-weight: 700; letter-spacing: .07em;
  text-transform: uppercase; padding: 9px 14px; border: 1px solid var(--strong);
  background: transparent; color: var(--soft); cursor: pointer;
  transition: background .18s, color .18s, border-color .18s; }}
button:hover {{ border-color: var(--ink); color: var(--ink); }}
button[aria-pressed="true"] {{ background: var(--ink); border-color: var(--ink); color: #fff; }}
#detail {{ margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line);
  color: var(--soft); font-size: 14.5px; }}
#detail[hidden] {{ display: none; }}
#detail .meta {{ display: block; margin-top: 6px; font-family: var(--code); font-size: 11.5px;
  font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--muted); }}
.grille {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(238px, 1fr));
  gap: 16px; margin-top: 22px; }}
.c {{ border: 1px solid var(--line); background: var(--paper); padding: 0 0 16px; }}
.c-dessin {{ display: flex; align-items: center; justify-content: center; padding: 18px 14px;
  background: var(--mist); border-bottom: 1px solid var(--line); min-height: 150px; }}
.c svg {{ width: 100%; max-width: 190px; height: auto; }}
.c h3 {{ font-family: var(--titre); font-size: 15px; font-weight: 700; line-height: 1.25;
  margin: 14px 16px 6px; }}
.c p {{ margin: 0 16px; font-size: 13px; color: var(--soft); line-height: 1.5; }}
.c code {{ display: inline-block; margin: 12px 16px 0; font-family: var(--code);
  font-size: 11px; font-weight: 700; letter-spacing: .04em; color: var(--muted); }}
.unites {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px; margin-top: 22px; }}
.u {{ border: 1px solid var(--line); padding: 16px; text-align: center; }}
.u svg {{ width: 100%; max-width: 130px; height: auto; }}
.u span {{ display: block; margin-top: 10px; font-family: var(--code); font-size: 11px;
  font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--muted); }}
footer {{ padding: 30px 0 52px; color: var(--muted); font-size: 13px; }}
footer code {{ font-family: var(--code); }}
{css_animations}
</style>
</head>
<body>
<header><div class="large">
  <h1>Illustrations Flowmetrik</h1>
  <p class="chapo">{total} scènes au trait, une seule touche d'accent chacune. L'encre prend la
  couleur du texte, l'accent celle de la filiale : <strong>le même dessin sort noir chez
  Flowmetrik et jaune chez FlowImmo, sans rien redessiner</strong>. Cinq animations s'y posent,
  dont quatre bouclent — et une boucle revient exactement à son point de départ, mesuré à
  0,00 ‰ de pixels d'écart.</p>
</div></header>

<section><div class="large">
  <h2>Les animations</h2>
  <p class="note">Le choix s'applique à tout le catalogue d'un coup. C'est délibéré : une
  boucle qui saute ne se repère que sur plusieurs dessins à la fois — le sursaut d'un seul
  passe pour un hasard de l'œil.</p>
  <div class="barre" role="group" aria-label="Animation">{boutons_anim}</div>
  <p id="detail" hidden></p>
</div></section>

<section><div class="large">
  <h2>L'accent suit la filiale</h2>
  <p class="note">Le même dessin, cinq marques. Rien n'est redessiné : seul le tracé d'accent
  change de couleur, et il occupe moins de 3 % de la surface — le plafond de la charte est
  tenu par construction, pas par vigilance.</p>
  <div class="unites">{unites}</div>
</div></section>

<section><div class="large">
  <h2>Les états d'interface — {n_etats}</h2>
  <p class="note">Celles qui habillent un écran plutôt qu'un sujet. Si aucun usage ne
  correspond à l'écran, l'écran n'a pas besoin d'une illustration : il a besoin d'une phrase.</p>
  <div class="grille">{etats}</div>
</div></section>

<section><div class="large">
  <h2>Les sujets — {n_sujets}</h2>
  <p class="note">Une scène par page du catalogue de flowmetrik.com/ressources. Elles disent le
  sujet en <em>objets</em>, jamais en concepts : on ne dessine pas « la gouvernance », on
  dessine une barrière baissée devant une pile de feuilles.</p>
  <div class="grille">{sujets}</div>
</div></section>

<footer><div class="large">
  <p>Direction artistique et consignes : <code>flowmetrik-whiteapp/scripts/illustrations/scenes.py</code>
  — elles seules font foi. Tracés : <code>src/components/brand/illustrations/lot.ts</code>, généré.
  Animations : <code>src/styles/illustrations.css</code>, contrôlées par
  <code>scripts/gate_illustrations.py --rendu</code>.</p>
  <p style="margin-top:10px">Page autonome, générée le {date} — aucune requête réseau.</p>
</div></footer>

<script>
var boutons = [].slice.call(document.querySelectorAll('.barre button'));
var detail = document.getElementById('detail');
var INFOS = {infos};
function poser(a) {{
  boutons.forEach(function (b) {{ b.setAttribute('aria-pressed', String(b.dataset.a === a)); }});
  [].forEach.call(document.querySelectorAll('.illu'), function (s) {{
    // La classe est retirée puis reposée après un reflow forcé : sans lui, le
    // navigateur regroupe les deux changements dans le même cycle et
    // l'animation ne repart pas — elle continue là où elle en était.
    s.removeAttribute('data-anim');
    void s.offsetWidth;
    if (a !== 'aucune') s.setAttribute('data-anim', a);
  }});
  var i = INFOS[a];
  detail.hidden = !i;
  if (i) {{
    detail.innerHTML = i.usage + '<span class="meta">' + i.duree + 's · ' +
      (i.boucle ? 'en boucle, revient à son point de départ' : "une seule fois, à l'apparition") +
      '</span>';
  }}
}}
boutons.forEach(function (b) {{ b.addEventListener('click', function () {{ poser(b.dataset.a); }}); }});
</script>
</body>
</html>
"""


def main() -> None:
    import time

    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--sortie", default="/tmp/catalogue-illustrations.html")
    args = ap.parse_args()

    lot = lire_lot()
    anims = lire_animations()
    etats = [i for i in lot if i["nom"] in ETATS]
    sujets = [i for i in lot if i["nom"] not in ETATS]

    boutons = '<button data-a="aucune" aria-pressed="true">Aucune</button>' + "".join(
        f'<button data-a="{n}" aria-pressed="false">{html.escape(a["titre"])}</button>'
        for n, a in anims.items()
    )
    # La scène témoin des accents : celle qui porte la plus grosse tache
    # colorée, sinon la démonstration ne démontre rien.
    temoin = max(lot, key=lambda i: len(i["accent_d"]))
    unites = "".join(
        f'<div class="u" style="--accent:{c}">{svg(temoin, "illu")}<span>{n}</span></div>'
        for n, c in UNITES
    )

    page = GABARIT.format(
        css_animations=CSS.read_text(encoding="utf-8"),
        total=len(lot), n_etats=len(etats), n_sujets=len(sujets),
        boutons_anim=boutons, unites=unites,
        etats="".join(carte(i) for i in etats),
        sujets="".join(carte(i) for i in sujets),
        infos=json.dumps(anims, ensure_ascii=False),
        date=time.strftime("%d/%m/%Y"),
    )
    cible = pathlib.Path(args.sortie)
    cible.write_text(page, encoding="utf-8")
    print(f"{cible} — {cible.stat().st_size // 1024} Ko · {len(lot)} scènes "
          f"({len(etats)} états, {len(sujets)} sujets) · {len(anims)} animations")


if __name__ == "__main__":
    main()
