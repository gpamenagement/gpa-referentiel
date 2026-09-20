#!/usr/bin/env python3
"""Fabrique le fichier unique, et prouve qu'il est vraiment autonome.

    pnpm build:autonome && python3 scripts/autonome.py

`vite-plugin-singlefile` inline le JS et le CSS, **mais pas `public/`** : les
fichiers de `public/` sont copiés tels quels et restent référencés par une URL
absolue (`/brand/polices/Rubik-400-latin.woff2`). Ouvert depuis un disque ou
servi ailleurs qu'à la racine, le fichier « autonome » perd alors ses polices,
ses logos et ses icônes — **et rien ne le signale** : la page s'affiche, en
police de repli, sans logo, et on la croit juste.

Ce script remplace chaque `/brand/...` par son data URI, puis **ouvre le
résultat en `file://`** pour vérifier que Rubik est chargée et qu'aucune image
n'a échoué. Une vérification qui ne passe pas par le protocole réel ne vérifie
rien : c'est précisément `file://` qui casse les URL absolues.
"""
from __future__ import annotations

import base64
import mimetypes
import pathlib
import re
import sys

RACINE = pathlib.Path(__file__).resolve().parent.parent
SORTIE = RACINE / "dist-autonome" / "index.html"
PUBLIC = RACINE / "public" / "brand"   # le groupe capturé commence APRÈS /brand/

mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("image/svg+xml", ".svg")


def data_uri(chemin: pathlib.Path) -> str:
    type_, _ = mimetypes.guess_type(chemin.name)
    donnees = base64.b64encode(chemin.read_bytes()).decode("ascii")
    return f"data:{type_ or 'application/octet-stream'};base64,{donnees}"


def inliner() -> tuple[int, list[str]]:
    html = SORTIE.read_text(encoding="utf-8")
    manquants: list[str] = []
    cache: dict[str, str] = {}

    def remplacer(m: re.Match[str]) -> str:
        rel = m.group(1)
        if rel in cache:
            return cache[rel]
        fichier = PUBLIC / rel
        if not fichier.exists():
            manquants.append(rel)
            return m.group(0)
        uri = data_uri(fichier)
        cache[rel] = uri
        return uri

    # Toute occurrence de /brand/<chemin>, qu'elle vienne du CSS (url(...)),
    # du JS (chaîne de composant) ou des données (logos d'éditeur).
    #
    # Le `\.?` n'est pas une précaution : Vite écrit les URL du CSS en
    # RELATIF (`url(./brand/...)`). Sans lui, le point survit au remplacement
    # et produit `url(.data:font/woff2;...)` — une URL invalide qui échoue en
    # silence, donc une police de repli et une page qu'on croit juste.
    html = re.sub(r"\.?/brand/([A-Za-z0-9_\-./]+\.(?:woff2|svg|png|jpg|jpeg|ico))", remplacer, html)
    SORTIE.write_text(html, encoding="utf-8")
    return len(cache), manquants


def verifier() -> list[str]:
    from playwright.sync_api import sync_playwright

    defauts: list[str] = []
    with sync_playwright() as pw:
        nav = pw.chromium.launch()
        page = nav.new_page(viewport={"width": 1440, "height": 1000})
        echecs: list[str] = []
        page.on("requestfailed", lambda r: echecs.append(r.url[:80]))
        page.goto(SORTIE.as_uri(), wait_until="load")
        page.wait_for_timeout(1200)

        if not page.evaluate("document.fonts.check('16px Rubik')"):
            defauts.append("Rubik n'est pas chargée depuis le fichier seul")
        cassees = page.evaluate(
            "[...document.images].filter(i => !i.complete || i.naturalWidth === 0).length"
        )
        if cassees:
            defauts.append(f"{cassees} image(s) non chargée(s)")
        if echecs:
            defauts.append(f"{len(echecs)} requête(s) en échec — ex. {echecs[0]}")
        if page.evaluate("document.querySelectorAll('nav button').length") < 8:
            defauts.append("la navigation ne porte pas ses huit entrées")
        page.close()
        nav.close()
    return defauts


def main() -> None:
    if not SORTIE.exists():
        sys.exit(f"ÉCHEC — lancer d'abord `pnpm build:autonome` ({SORTIE} absent)")

    poses, manquants = inliner()
    poids = SORTIE.stat().st_size / (1024 * 1024)
    print(f"{poses} fichiers inlinés · {SORTIE.name} pèse {poids:.1f} Mo")
    if manquants:
        print(f"  ✗ {len(manquants)} référence(s) introuvable(s) : {manquants[:3]}")

    defauts = verifier() + ([f"{len(manquants)} référence introuvable"] if manquants else [])
    if defauts:
        print("\nDÉFAUT(S) :")
        for d in defauts:
            print(f"  ✗ {d}")
        sys.exit(1)

    # Le dossier copié n'a plus de raison d'être : s'il reste, on peut croire
    # que le HTML en dépend encore, et le déplacer sans s'en apercevoir.
    copie = SORTIE.parent / "brand"
    if copie.exists():
        import shutil
        shutil.rmtree(copie)
        print("  dossier brand/ retiré — le HTML ne dépend plus de rien")

    print("\nFichier autonome vérifié en file:// : Rubik chargée, aucune image cassée, "
          "aucune requête réseau, huit entrées de navigation.")


if __name__ == "__main__":
    main()
