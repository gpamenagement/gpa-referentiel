#!/usr/bin/env python3
"""Regarde l'application, et refuse de se taire.

Trois sondes, toutes nées d'un défaut déjà produit ailleurs :
  1. **Rubik est réellement embarquée** — un rendu qui retombe sur Arial est
     valide, joli, et hors charte : rien ne le signale.
  2. **Aucun débordement horizontal** — la cause n'est jamais le texte, c'est un
     enfant flex qui refuse de se comprimer.
  3. **Aucun texte invisible** — un jeton CSS inconnu ne lève pas : la couleur
     tombe sur `transparent` ou sur la couleur du fond, et la page paraît
     simplement vide à cet endroit.

    python3 scripts/verifier.py            # suppose `pnpm preview` déjà lancé
    python3 scripts/verifier.py --base http://127.0.0.1:5312
"""
from __future__ import annotations

import argparse
import pathlib
import sys

from playwright.sync_api import sync_playwright

VUES = ["accueil", "applications", "objets", "carte", "organisation",
        "operations", "qualite", "methodologie"]
CAPTURES = pathlib.Path(__file__).resolve().parent.parent / "captures"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:5312")
    args = ap.parse_args()
    CAPTURES.mkdir(exist_ok=True)

    defauts: list[str] = []
    with sync_playwright() as pw:
        nav = pw.chromium.launch()

        for largeur, hauteur, suffixe in ((1440, 1000, "1440"), (390, 844, "390")):
            page = nav.new_page(viewport={"width": largeur, "height": hauteur},
                                device_scale_factor=2)
            for vue in VUES:
                page.goto(f"{args.base}/#{vue}", wait_until="networkidle")
                page.wait_for_timeout(700)      # la simulation de force, puis le rendu

                if not page.evaluate("document.fonts.check('16px Rubik')"):
                    defauts.append(f"{vue} {suffixe} : Rubik n'est pas chargée")

                debord = page.evaluate(
                    "() => { const d = document.documentElement;"
                    " return d.scrollWidth - d.clientWidth }"
                )
                if debord > 1:
                    defauts.append(f"{vue} {suffixe} : débordement horizontal de {debord} px")

                invisible = page.evaluate("""() => {
                  const mauvais = [];
                  for (const el of document.querySelectorAll('h1,h2,h3,p,li,td,th,span,button,a')) {
                    if (!el.textContent || !el.textContent.trim()) continue;
                    const s = getComputedStyle(el);
                    if (s.visibility === 'hidden' || s.display === 'none') continue;
                    const c = s.color;
                    if (c === 'rgba(0, 0, 0, 0)' || c === 'transparent') {
                      mauvais.push(el.tagName + ' « ' + el.textContent.trim().slice(0, 30) + ' »');
                    }
                  }
                  return mauvais.slice(0, 5);
                }""")
                if invisible:
                    defauts.append(f"{vue} {suffixe} : texte invisible — {invisible}")

                # Quatrième sonde, propre à la carte : un graphe vide est une
                # page valide. Si la simulation échoue ou si les positions ne
                # sont jamais posées, le SVG existe, le cadre existe, et il ne
                # contient rien — aucune erreur, aucune trace.
                if vue == "carte":
                    points = page.evaluate("document.querySelectorAll('svg circle').length")
                    if points < 50:
                        defauts.append(f"carte {suffixe} : {points} nœuds dessinés, moins de 50")

                if vue in ("accueil", "carte", "applications", "operations") or suffixe == "390":
                    cible = CAPTURES / f"{vue}-{suffixe}.png"
                    page.screenshot(path=str(cible), full_page=(suffixe == "1440"))
            page.close()
        nav.close()

    captures = sorted(CAPTURES.glob("*.png"))
    print(f"{len(captures)} captures dans {CAPTURES.name}/")
    for c in captures:
        print(f"  {c.name:28s} {c.stat().st_size // 1024} Ko")

    if defauts:
        print(f"\n{len(defauts)} DÉFAUT(S) :")
        for d in defauts:
            print(f"  ✗ {d}")
        sys.exit(1)
    print("\nAucun défaut : Rubik chargée, pas de débordement, pas de texte invisible.")


if __name__ == "__main__":
    main()
