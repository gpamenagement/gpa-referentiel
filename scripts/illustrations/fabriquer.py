#!/usr/bin/env python3
"""Fabrique le lot d'illustrations : génère, sépare, vectorise, tokenise.

    python3 scripts/illustrations/fabriquer.py               # les scènes manquantes
    python3 scripts/illustrations/fabriquer.py --tout        # tout, même l'existant
    python3 scripts/illustrations/fabriquer.py --scene vide  # une seule
    python3 scripts/illustrations/fabriquer.py --vectoriser  # sans régénérer

Quatre étapes, et chacune répond à un défaut précis d'une étape unique.

1. **Génération** — un modèle d'image sur OpenRouter, avec le socle de
   `scenes.py`. Sorti dans `moodboard/illustrations/<nom>.png`, versionné : sans
   la source, une retouche du pipeline oblige à tout repayer, et le lot dérive
   parce qu'aucune regénération ne rend deux fois le même dessin.

2. **Séparation** — l'image est coupée en deux masques, l'encre et l'accent.
   L'accent s'isole par la **différence rouge moins vert** : le corail est la
   seule teinte saturée de l'image, et c'est ce qui rend le tri trivial. Deux
   pistes plus évidentes ont été essayées et échouent : la distance
   colorimétrique avec `-fuzz` attrape aussi le noir, et le canal de saturation
   HSL attrape le bruit de compression du fond crème — il rendait un masque
   entièrement moucheté.

3. **Vectorisation** — `potrace` sur chaque masque. `vtracer` a été essayé
   d'abord et **segfault** sur ces images, quels que soient les réglages ; il
   rendait par ailleurs cent soixante-treize chemins et une vingtaine de nuances
   de noir là où il n'y a qu'une encre.

4. **Tokenisation** — l'encre devient `currentColor`, l'accent devient
   `var(--color-accent)`. C'est **tout l'intérêt de la chaîne** : un PNG généré
   porte sa couleur cuite dans le fichier, et une filiale ne peut pas la
   changer. Ici, FlowImmo rend le même dessin en jaune sans rien redessiner.

Le résultat est un module TypeScript unique, `src/components/brand/illustrations/lot.ts`.
Pas un dossier de `.svg` : Vite les servirait comme URL, et `currentColor` n'a
aucun effet dans une image chargée par `<img src>` — l'illustration sortirait
noire sur toutes les filiales, sans qu'aucune erreur ne le dise.
"""
from __future__ import annotations

import argparse
import base64
import json
import pathlib
import re
import subprocess
import sys
import tempfile
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from scenes import ACCENT_FABRICATION, SCENES, SOCLE  # noqa: E402

RACINE = pathlib.Path(__file__).resolve().parents[2]
SOURCES = RACINE / "moodboard" / "illustrations"
SORTIE = RACINE / "src" / "components" / "brand" / "illustrations" / "lot.ts"
ENV_COWORK = pathlib.Path.home() / "projects" / "flowmetrik-cowork" / ".env"

MODELE = "google/gemini-3-pro-image"

# Largeur de travail, et tolérance d'optimisation des courbes.
#
# Mesuré : à 1400 px et la tolérance par défaut, le lot pèse 462 ko de
# JavaScript — potrace suit alors le bruit de compression, pas le dessin. À
# 900 px avec `-O 2`, il tombe sous 200 ko sans qu'un trait change de forme.
# Le module est chargé à la demande, mais 462 ko se sentent même ainsi.
LARGEUR = 900
TOLERANCE = "2"


def cle_openrouter() -> str:
    for ligne in ENV_COWORK.read_text(encoding="utf-8").splitlines():
        if ligne.startswith("OPENROUTER_API_KEY="):
            return ligne.split("=", 1)[1].strip()
    raise SystemExit(f"OPENROUTER_API_KEY absente de {ENV_COWORK}")


def generer(scene, cle: str) -> None:
    corps = json.dumps({
        "model": MODELE,
        "modalities": ["image", "text"],
        "messages": [{"role": "user", "content": f"{SOCLE}\n\nSCENE: {scene.prompt}"}],
    }).encode()
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions", data=corps,
        headers={"Authorization": f"Bearer {cle}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=300) as rep:
        donnees = json.load(rep)
    images = (donnees.get("choices") or [{}])[0].get("message", {}).get("images") or []
    if not images:
        raise SystemExit(f"{scene.nom} : le modèle n'a rendu aucune image.")
    b64 = images[0]["image_url"]["url"].split(",", 1)[1]
    SOURCES.mkdir(parents=True, exist_ok=True)
    cible = SOURCES / f"{scene.nom}.png"
    cible.write_bytes(base64.b64decode(b64))

    # Palettisation à 48 couleurs, et ce n'est pas qu'une question de poids.
    # Elle fait tomber le lot de 8,6 Mo à 1 Mo — douze images versionnées, on
    # les sent — mais elle **améliore aussi la vectorisation** : le bruit de
    # compression que potrace suivait disparaît, et le module TypeScript passe
    # de 219 à 135 ko sans qu'un trait change. Un dessin au trait n'a que
    # quelques valeurs ; les 16 millions du PNG d'origine ne codaient que du
    # bruit.
    magick(str(cible), "-colors", "48", "-strip", str(cible))


def magick(*args: str) -> None:
    subprocess.run(["magick", *args], check=True, capture_output=True)


def chemin_potrace(pbm: pathlib.Path) -> tuple[str, int, int]:
    """Rend le `d` du tracé, et les dimensions du dessin."""
    svg = pbm.with_suffix(".svg")
    # `-a 1` : coins un peu arrondis, cohérent avec le trait du dessin.
    # `-t 4` : supprime les taches de moins de 4 pixels — le bruit de
    # compression, pas le dessin.
    subprocess.run(["potrace", "-s", "-o", str(svg), "--flat", "-t", "4", "-a", "1",
                    "-O", TOLERANCE, str(pbm)],
                   check=True, capture_output=True)
    texte = svg.read_text(encoding="utf-8")
    d = re.search(r'\sd="([^"]+)"', texte)
    vue = re.search(r'viewBox="([^"]+)"', texte)
    transform = re.search(r'<g transform="([^"]+)"', texte)
    if not d or not vue:
        raise SystemExit(f"potrace n'a rendu aucun tracé pour {pbm.name}")
    largeur, hauteur = (float(v) for v in vue.group(1).split()[2:4])
    return f'{transform.group(1) if transform else ""}|{d.group(1)}', round(largeur), round(hauteur)


def vectoriser(scene) -> dict:
    source = SOURCES / f"{scene.nom}.png"
    if not source.exists():
        raise SystemExit(f"{scene.nom} : {source} absent — générer d'abord.")

    with tempfile.TemporaryDirectory() as tmp:
        t = pathlib.Path(tmp)
        encre, accent = t / "encre.pbm", t / "accent.pbm"

        # L'accent : rouge moins vert. Le corail sort à ~0,45, le noir et le
        # papier à ~0. Le seuil à 18 % laisse donc une marge des deux côtés.
        magick(str(source), "-resize", f"{LARGEUR}x", "-colorspace", "sRGB",
               "(", "-clone", "0", "-channel", "R", "-separate", "+channel", ")",
               "(", "-clone", "0", "-channel", "G", "-separate", "+channel", ")",
               "-delete", "0", "-compose", "MinusSrc", "-composite",
               "-threshold", "18%", "-negate", str(accent))

        # L'encre : ce qui est sombre **et** non saturé. Sans le masque de
        # saturation en `Lighten`, la tache d'accent passerait aussi en encre et
        # serait dessinée deux fois, en noir sous la couleur.
        magick(str(source), "-resize", f"{LARGEUR}x", "-colorspace", "sRGB",
               "(", "+clone", "-colorspace", "HSL", "-channel", "G", "-separate",
               "+channel", "-threshold", "35%", ")",
               "-compose", "Lighten", "-composite",
               "-colorspace", "Gray", "-threshold", "60%", str(encre))

        d_encre, largeur, hauteur = chemin_potrace(encre)
        d_accent, _, _ = chemin_potrace(accent)

    return {"nom": scene.nom, "titre": scene.titre, "usage": scene.usage,
            "largeur": largeur, "hauteur": hauteur,
            "encre": d_encre, "accent": d_accent}


def ecrire(lot: list[dict]) -> None:
    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    entrees = []
    for i in lot:
        t_encre, d_encre = i["encre"].split("|", 1)
        t_accent, d_accent = i["accent"].split("|", 1)
        entrees.append(
            f"  {i['nom'].replace('-', '_')}: {{\n"
            f"    titre: {json.dumps(i['titre'], ensure_ascii=False)},\n"
            f"    usage: {json.dumps(i['usage'], ensure_ascii=False)},\n"
            f"    largeur: {i['largeur']}, hauteur: {i['hauteur']},\n"
            f"    encre: {{ t: {json.dumps(t_encre)}, d: {json.dumps(d_encre)} }},\n"
            f"    accent: {{ t: {json.dumps(t_accent)}, d: {json.dumps(d_accent)} }},\n"
            f"  }},"
        )
    SORTIE.write_text(
        "/* Généré par scripts/illustrations/fabriquer.py — ne pas éditer.\n"
        " *\n"
        " * Le dessin de chaque scène, en deux tracés : `encre`, qui prend la couleur\n"
        " * du texte, et `accent`, qui prend celle de la filiale. C'est cette séparation\n"
        " * qui rend le lot recoloriable ; un PNG ne l'est pas.\n"
        " *\n"
        " * Les consignes qui produisent ces dessins vivent dans\n"
        " * scripts/illustrations/scenes.py, et elles seules font foi.\n"
        " */\n\n"
        "export type TraceIllustration = { t: string; d: string }\n\n"
        "export type EntreeIllustration = {\n"
        "  titre: string\n"
        "  usage: string\n"
        "  largeur: number\n"
        "  hauteur: number\n"
        "  encre: TraceIllustration\n"
        "  accent: TraceIllustration\n"
        "}\n\n"
        "export const LOT = {\n" + "\n".join(entrees) + "\n} as const satisfies Record<string, EntreeIllustration>\n\n"
        "export type NomIllustration = keyof typeof LOT\n",
        encoding="utf-8",
    )
    poids = SORTIE.stat().st_size / 1024
    print(f"✓ {len(lot)} illustrations → {SORTIE.relative_to(RACINE)} ({poids:.0f} ko)")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tout", action="store_true", help="régénère même les scènes déjà dessinées")
    ap.add_argument("--vectoriser", action="store_true", help="ne génère rien, revectorise l'existant")
    ap.add_argument("--scene", help="une seule scène, par son nom")
    args = ap.parse_args()

    scenes = [s for s in SCENES if not args.scene or s.nom == args.scene]
    if args.scene and not scenes:
        raise SystemExit(f"scène inconnue : {args.scene}")

    if not args.vectoriser:
        cle = cle_openrouter()
        for s in scenes:
            if not args.tout and (SOURCES / f"{s.nom}.png").exists():
                print(f"  = {s.nom} (déjà dessinée)")
                continue
            print(f"  → {s.nom}")
            generer(s, cle)

    # Le module est écrit en entier à chaque fois : n'y garder que les scènes
    # demandées ferait disparaître les autres de l'application sans prévenir.
    lot = [vectoriser(s) for s in SCENES if (SOURCES / f"{s.nom}.png").exists()]
    if not lot:
        raise SystemExit("aucune source à vectoriser.")
    ecrire(lot)


if __name__ == "__main__":
    main()
