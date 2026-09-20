#!/usr/bin/env python3
"""Génère `src/lib/catalogue.ts` — l'inventaire des assets servis par la whiteapp.

Un catalogue écrit à la main ment dès qu'on ajoute un fichier. Celui-ci est
dérivé de `public/brand/`, donc il ne peut pas mentir.

Les références clients font exception : elles sont lues depuis `clients.json`, parce
qu'un fichier déposé dans le dossier n'apporte aucun accord de nommage (gate G1).

Pour les visuels générés, le prompt est lu depuis le `.prompt.txt` déposé à côté
par `assets/tools/gen_image.py` : un visuel dont on a perdu le prompt ne se
réitère plus, et c'est précisément ce qu'on veut éviter en le remontant ici.
"""
from __future__ import annotations

import json
import pathlib
import re

REPO = pathlib.Path(__file__).resolve().parent.parent
BRAND = REPO / "public" / "brand"
OUT = REPO / "src" / "lib" / "catalogue.ts"

USAGES = {
    "flowmetrik-mark": "Symbole principal, sur fond clair",
    "flowmetrik-mark-white": "Symbole renversé, sur fond sombre",
    "flowmetrik-mark-outline": "Contour seul — filigrane, tampon",
    "flowmetrik-mark-charcoal": "Symbole charcoal, hiérarchie secondaire",
    "flowmetrik-mark-graphite": "Dégradé graphite — historique",
    "flowmetrik-mark-teal": "Accent Flow teal — historique",
    "flowmetrik-mark-gradient": "Dégradé teal — historique",
    "flowmetrik-mark-accent": "Duotone, losange accentué — historique",
    "flowmetrik-wordmark": "Nom vectorisé (tracés Poppins)",
    "flowmetrik-wordmark-white": "Nom vectorisé, renversé",
    "flowmetrik-logo-horizontal": "Lockup principal",
    "flowmetrik-logo-horizontal-white": "Lockup renversé",
    "flowmetrik-logo-horizontal-gradient": "Lockup dégradé — historique",
    "flowmetrik-logo-stacked": "Lockup empilé",
    "flowmetrik-favicon": "Icône d'app / favicon",
    "flowmetrik-mark-animated": "Animé — onde lumineuse",
    "flowmetrik-mark-animated-ink": "Animé — onde, version encre (active)",
    "flowmetrik-mark-draw-animated": "Animé — la marque se dessine",
    "flowmetrik-mark-draw-animated-ink": "Animé — tracé, version encre (active)",
    "flowmetrik-loader": "Spinner de chargement",
    "flowmetrik-loader-ink": "Spinner, version encre (active)",
}
# Les variantes teal et gradient sont historiques : la charte interdit de les
# poser dans un artefact neuf. Le catalogue les montre en le disant.
HISTORIQUES = {"teal", "gradient", "accent", "graphite"}


def logos() -> list[dict]:
    out = []
    for f in sorted((BRAND / "logo").glob("*.svg")):
        slug = f.stem
        out.append({
            "slug": slug,
            "src": f"/brand/logo/{f.name}",
            "usage": USAGES.get(slug, "—"),
            "anime": "animated" in slug or "loader" in slug,
            "historique": any(h in slug for h in HISTORIQUES),
            "sombre": "white" in slug,
        })
    return out


def visuels() -> list[dict]:
    """Les visuels d'ambiance générés, avec leur prompt exact."""
    out = []
    for f in sorted((BRAND / "motion").glob("*.webp")):
        p = f.with_suffix("").with_suffix(".prompt.txt")
        p = f.parent / (f.stem + ".prompt.txt")
        prompt = p.read_text(encoding="utf-8").strip() if p.exists() else ""
        # Le préfixe monochrome est réinjecté par l'outil : le montrer une fois
        # dans la doc suffit, le répéter sur 20 vignettes est du bruit.
        prompt = re.sub(r"^.*?grayscale[^.]*\.\s*", "", prompt, flags=re.S | re.I).strip()
        famille = f.stem.split("-")[0]
        out.append({
            "slug": f.stem, "src": f"/brand/motion/{f.name}",
            "prompt": prompt, "famille": famille,
        })
    return out


def clients() -> list[dict]:
    """Les références clients, lues depuis `public/brand/clients.json`.

    Elles ne se dérivent PAS du dossier, contrairement aux logos de marque : un
    fichier posé là n'apporte aucun accord. La gate G1 — le droit de nommer un
    client et de montrer son logo — vit dans `references/<slug>/reference.md` du
    cowork, et le manifeste n'en est qu'une copie servable. Un logo déposé sans
    entrée dans le manifeste est donc ignoré, pas affiché.

    Le sens de lecture est l'inverse pour le fichier : une entrée dont le logo
    manque casse la génération. Un mur de références avec une case vide se
    remarque en réunion client, jamais avant.
    """
    src = BRAND / "clients.json"
    if not src.exists():
        return []
    out = []
    for c in json.loads(src.read_text(encoding="utf-8")).get("clients", []):
        f = BRAND / "clients" / c["logo"]
        if not f.exists():
            raise SystemExit(f"clients.json : {c['slug']} déclare {c['logo']}, absent de public/brand/clients/")
        out.append({
            "slug": c["slug"],
            "nom": c["nom"],
            "src": f"/brand/clients/{c['logo']}",
            "secteur": c["secteur"],
            "unites": c["unites"],
            "travail": c["travail"],
            "statut": c["statut"],
            # Un JPEG n'a pas de canal alpha : son fond blanc est opaque, et il
            # se voit sur toute surface qui ne l'est pas. Le rendu le sait.
            "opaque": f.suffix.lower() in {".jpg", ".jpeg"},
        })
    return out


def photos() -> list[dict]:
    meta = {}
    pj = BRAND / "photos.json"
    if pj.exists():
        for p in json.loads(pj.read_text(encoding="utf-8")).get("photos", []):
            meta[pathlib.Path(p["file"]).name] = p.get("query", "")
    return [{"slug": f.stem, "src": f"/brand/photos/{f.name}",
             "requete": meta.get(f.name, "")}
            for f in sorted((BRAND / "photos").glob("*.jpg"))]


def ts(nom: str, data: list[dict]) -> str:
    return f"export const {nom} = {json.dumps(data, ensure_ascii=False, indent=2)} as const\n"


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    L, V, P, C = logos(), visuels(), photos(), clients()
    OUT.write_text(
        "/* GÉNÉRÉ par scripts/build_catalogue.py — ne pas éditer.\n"
        "   Dérivé de public/brand/. Un catalogue écrit à la main ment dès\n"
        "   qu'on ajoute un fichier ; celui-ci ne le peut pas. */\n\n"
        + ts("LOGOS", L) + "\n" + ts("VISUELS", V) + "\n" + ts("PHOTOS", P)
        + "\n" + ts("CLIENTS", C),
        encoding="utf-8")
    print(f"OK — {len(L)} logos, {len(V)} visuels générés, {len(P)} photos, {len(C)} clients.")


if __name__ == "__main__":
    main()
