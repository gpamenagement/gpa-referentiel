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
                page.goto(f"{args.base}/#{vue}", wait_until="load")
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
                    # Le sélecteur suit l'implémentation : les nœuds étaient des
                    # `<circle>` du temps de la simulation de forces, ce sont des
                    # boîtes React Flow depuis la disposition en couches. Une sonde
                    # dont le sélecteur a vieilli compte zéro et accuse la page.
                    points = page.evaluate("document.querySelectorAll('.react-flow__node').length")
                    liens = page.evaluate("document.querySelectorAll('.react-flow__edge').length")
                    if points < 40:
                        defauts.append(f"carte {suffixe} : {points} nœuds dessinés, moins de 40")
                    if liens < 40:
                        defauts.append(f"carte {suffixe} : {liens} liens dessinés, moins de 40")

                # Le catalogue a sa propre sonde : une table de schéma vide est
                # une page valide, et c'est le défaut qu'on ne verrait pas.
                # La carte : un fond qui ne charge pas laisse un cadre gris,
                # et une source vide laisse un fond sans points. Deux pannes
                # silencieuses, deux sondes.
                if vue == "operations":
                    page.wait_for_timeout(2500)
                    toile = page.evaluate(
                        "document.querySelectorAll('.maplibregl-canvas').length")
                    if toile == 0:
                        defauts.append(f"operations {suffixe} : aucune toile MapLibre")
                    tuiles = page.evaluate("""() => performance.getEntriesByType('resource')
                        .filter(r => r.name.includes('data.geopf.fr')).length""")
                    if tuiles == 0:
                        defauts.append(f"operations {suffixe} : aucune tuile IGN demandée")
                    # Le rendu est en WebGL : aucun élément du DOM ne prouve
                    # qu'un point est dessiné. Une carte vide garde son fond,
                    # ses contrôles et son échelle — elle a l'air juste. Seule
                    # la source, interrogée, dit la vérité.
                    points = page.evaluate("""() => {
                        const m = window.__carteGpa;
                        if (!m || !m.getSource('operations')) return -1;
                        // Les features RENDUES, pas celles de la source : une
                        // source pleine dont rien n'est dessiné est exactement
                        // le défaut que maplibre-gl 6.9 produisait en silence.
                        return m.queryRenderedFeatures({layers: ['operations-points']}).length;
                    }""")
                    vue_carte = page.evaluate("""() => {
                        const m = window.__carteGpa;
                        return m ? {lat: m.getCenter().lat, zoom: m.getZoom()} : null;
                    }""")
                    # Le cadrage : une seule coordonnée aberrante (0,0) suffit à
                    # dézoomer la carte à l'échelle du monde, et les points
                    # deviennent invisibles sans qu'aucun compteur ne bouge.
                    if vue_carte and not (46 < vue_carte["lat"] < 51 and vue_carte["zoom"] > 6):
                        defauts.append(
                            f"operations {suffixe} : cadrage hors Île-de-France "
                            f"(lat {vue_carte['lat']:.1f}, zoom {vue_carte['zoom']:.1f})")
                    if points < 40:
                        defauts.append(f"operations {suffixe} : {points} points dans la source, moins de 40")

                if vue == "objets":
                    champs = page.evaluate("document.querySelectorAll('table tbody tr').length")
                    if champs < 8:
                        defauts.append(f"objets {suffixe} : {champs} lignes de schéma, moins de 8")

                if vue in ("accueil", "carte", "objets", "applications", "operations") or suffixe == "390":
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
