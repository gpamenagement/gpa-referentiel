#!/usr/bin/env python3
"""Anime une illustration — le petit bonhomme fait quelque chose.

    python3 scripts/illustrations/animer.py --scene le-cloud-et-lia
    python3 scripts/illustrations/animer.py --scene a --scene b   # en parallèle
    python3 scripts/illustrations/animer.py --toutes              # les 37, PAYANT
    python3 scripts/illustrations/animer.py --liste
    python3 scripts/illustrations/animer.py --monter              # remonte les rushs

Le lot statique répond à « montre-moi le sujet ». Il ne répond pas à « montre-moi
le geste » — et c'est ce que Mehdi appelle une animation : *« les petits
bonhommes doivent bouger et faire des actions. »* Les cinq animations CSS du
socle déplacent le dessin entier ; elles ne font rien bouger **dans** le dessin.

## La chaîne

1. **Le rush** — `alibaba/wan-3.0` via OpenRouter, en image-vers-vidéo : le PNG de
   la scène est passé en `frame_images` avec `frame_type: "first_frame"`, et le
   geste vient de `mouvements.py`. La vidéo part donc du dessin exact, pas d'une
   réinterprétation.
2. **Le montage en aller-retour** — le rush est joué à l'endroit puis à l'envers.
   C'est ce qui **referme la boucle**, et ce n'est pas un choix esthétique :
   mesuré sur le premier essai, l'écart entre la première et la dernière image
   d'un rush brut est de 5,63/255 en moyenne, avec 25 ‰ de pixels franchement
   différents — un saut visible à chaque tour. Monté en aller-retour, l'écart
   tombe à 1,13/255 et 0,4 ‰, c'est-à-dire au bruit de compression.
3. **Les trois fichiers** — un WebM (VP9), un MP4 (H.264) pour Safari, et une
   affiche WebP. La vidéo est muette et sans piste audio du tout : une piste
   vide empêche la lecture automatique sur certains navigateurs.

## Ce que ça coûte, et pourquoi c'est une gate

**0,56 $ par scène** avec le modèle par défaut — la table des prix mesurés est
plus bas dans le fichier, et elle a été relevée sur la même scène pour les cinq
candidats. Les trente-sept du lot font une vingtaine de dollars. C'est au-dessus
du plafond de dépense des gates FlowVideo, donc `--toutes` demande une
confirmation explicite : générer par erreur le lot entier est le genre
d'accident qu'on ne remarque que sur la facture.

**Le détour par les poses clés n'est pas moins cher**, contrairement à
l'intuition. Faire redessiner deux poses par un modèle d'image puis interpoler
coûte 0,138 $ l'image, soit 0,41 $ pour trois poses — le prix d'une vidéo
entière, avec en prime une scène qui se décale légèrement d'une pose à l'autre.

## Les deux pièges déjà payés

- **Le paramètre d'image ne s'appelle pas `image`.** Passé comme `image` ou
  `input_image`, il est **ignoré sans erreur** : la requête réussit, la vidéo
  sort, et elle ne montre pas votre dessin — elle en invente un autre à partir du
  texte. Le bon nom est `frame_images`, avec la forme
  `{"type": "image_url", "frame_type": "first_frame", "image_url": {"url": …}}`.
- **Sora ne sait pas faire d'image de départ.** `openai/sora-2-pro` accepte la
  requête puis rend `does not support first_frame frame_images`. Pour partir d'un
  dessin existant, c'est `alibaba/wan-3.0`.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from mouvements import MOUVEMENTS, consigne  # noqa: E402

RACINE = pathlib.Path(__file__).resolve().parents[2]
SOURCES = RACINE / "moodboard" / "illustrations"
RUSHS = RACINE / "moodboard" / "illustrations-rushs"
SORTIE = RACINE / "public" / "brand" / "illustrations-animees"
REGISTRE = RUSHS / "_rushs.json"

# Les modèles qui savent partir d'une image, mesurés le 2026-09-19 sur la MÊME
# scène et la MÊME consigne. Le prix est celui rendu par l'API, pas un tarif
# affiché — et il ne suit pas la qualité perçue : la résolution du rush, si.
#
# | modèle                    | 5 s      | rush        | verdict                      |
# |---------------------------|----------|-------------|------------------------------|
# | x-ai/grok-imagine-video   | 0,40 $   |   544×544   | trop mou une fois monté à 900 |
# | minimax/hailuo-2.3        | 0,49 $   |   768×768   | suffisant pour une carte     |
# | kwaivgi/kling-video-o1    | 0,56 $   | 1440×1440   | **le meilleur rapport**      |
# | alibaba/wan-3.0           | 0,85 $   | 1440×1440   | même résolution, +52 %       |
# | bytedance/seedance-2.5    | 1,17 $   |      —      | le plus cher                 |
#
# `openai/sora-2-pro` est hors jeu : il refuse `first_frame`, donc il ne sait pas
# partir d'un dessin existant. `google/veo-3.1` existe mais rend un 401 amont.
#
# Le montage ramène tout à 900 px de large : au-delà, la résolution du rush ne
# sert plus à rien. C'est pour ça que Grok est écarté et pas Hailuo — 544 px
# agrandis à 900 se voient, 768 non.
MODELES = {
    "kling": ("kwaivgi/kling-video-o1", 0.56),
    "hailuo": ("minimax/hailuo-2.3", 0.49),
    "grok": ("x-ai/grok-imagine-video", 0.40),
    "wan": ("alibaba/wan-3.0", 0.85),
}
MODELE, COUT_UNITAIRE = MODELES["kling"]
LARGEUR_WEB = 900


def cle() -> str:
    if (k := os.environ.get("OPENROUTER_API_KEY")):
        return k
    env = pathlib.Path.home() / "projects" / "flowmetrik-cowork" / ".env"
    if env.is_file():
        for ligne in env.read_text(encoding="utf-8").splitlines():
            if (m := re.match(r"\s*(?:export\s+)?OPENROUTER_API_KEY\s*=\s*(.+)", ligne)):
                return m.group(1).strip().strip("\"'")
    sys.exit("OPENROUTER_API_KEY introuvable.")


# --------------------------------------------------------------------------
# 1. Le rush
# --------------------------------------------------------------------------


def _post(k: str, corps: dict) -> dict:
    r = urllib.request.Request(
        "https://openrouter.ai/api/v1/videos", data=json.dumps(corps).encode(),
        headers={"Authorization": f"Bearer {k}", "Content-Type": "application/json"})
    with urllib.request.urlopen(r, timeout=180) as rep:
        return json.load(rep)


def _get(k: str, url: str) -> dict:
    r = urllib.request.Request(url, headers={"Authorization": f"Bearer {k}"})
    with urllib.request.urlopen(r, timeout=180) as rep:
        return json.load(rep)


def generer(k: str, nom: str) -> tuple[pathlib.Path, float]:
    """Lance la génération, attend, et écrit le rush. Rend (fichier, coût)."""
    src = SOURCES / f"{nom}.png"
    if not src.is_file():
        raise FileNotFoundError(src)
    b64 = "data:image/png;base64," + base64.b64encode(src.read_bytes()).decode()

    d = _post(k, {
        "model": MODELE,
        "prompt": consigne(nom),
        # La forme exacte compte : voir l'en-tête. Un `image` tout court est
        # accepté et ignoré, et la vidéo ne part pas du dessin.
        "frame_images": [{"type": "image_url", "frame_type": "first_frame",
                          "image_url": {"url": b64}}],
    })
    if "id" not in d:
        raise RuntimeError(str(d)[:200])

    url = d["polling_url"]
    for _ in range(60):  # jusqu'à quinze minutes
        etat = _get(k, url)
        s = etat.get("status")
        if s == "completed":
            break
        if s in ("failed", "error"):
            raise RuntimeError(f"génération échouée : {str(etat)[:200]}")
        time.sleep(15)
    else:
        raise RuntimeError("délai dépassé")

    lien = (etat.get("unsigned_urls") or [None])[0]
    if not lien:
        raise RuntimeError("terminé sans fichier")
    req = urllib.request.Request(lien, headers={"Authorization": f"Bearer {k}"})
    RUSHS.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        with urllib.request.urlopen(req, timeout=600) as rep:
            tmp.write(rep.read())
        brut = pathlib.Path(tmp.name)

    # Le rush est **réencodé avant d'être archivé**, pas stocké tel quel. Le
    # fichier du modèle fait 7 à 8 Mo ; trente-sept feraient près de trois cents
    # mégaoctets dans l'historique, pour une matière dont on ne se sert qu'à
    # remonter. À 1440 px et CRF 20 il en reste largement assez pour rejouer un
    # montage, et le lot tient dans une cinquantaine de mégaoctets.
    #
    # Il est archivé, et il le faut : deux générations du même prompt ne rendent
    # jamais la même vidéo, et chacune coûte. Sans le rush, retoucher le montage
    # — une durée, un cadrage — obligerait à tout repayer.
    f = RUSHS / f"{nom}.mp4"
    ffmpeg("-i", str(brut), "-c:v", "libx264", "-crf", "20", "-preset", "slow",
           "-pix_fmt", "yuv420p", "-an", str(f))
    brut.unlink(missing_ok=True)
    return f, float((etat.get("usage") or {}).get("cost") or COUT_UNITAIRE)


# --------------------------------------------------------------------------
# 2. Le montage
# --------------------------------------------------------------------------

# `split` puis `reverse` puis `concat` : la vidéo est jouée à l'endroit, puis à
# l'envers. La dernière image du montage EST la première — la boucle se referme
# par construction, quoi que le modèle ait fait de la fin du rush.
FILTRE_ALLER_RETOUR = f"scale={LARGEUR_WEB}:-2,fps=24,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1"


def ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args], check=True)


def monter(nom: str) -> dict:
    """Rush → WebM, MP4 et affiche. Rend les poids."""
    rush = RUSHS / f"{nom}.mp4"
    if not rush.is_file():
        raise FileNotFoundError(rush)
    SORTIE.mkdir(parents=True, exist_ok=True)
    webm, mp4, affiche = (SORTIE / f"{nom}.webm", SORTIE / f"{nom}.mp4",
                          SORTIE / f"{nom}.webp")

    # `-an` : aucune piste audio, pas même vide. Une piste muette mais présente
    # fait refuser la lecture automatique sur certains navigateurs mobiles.
    ffmpeg("-i", str(rush), "-vf", FILTRE_ALLER_RETOUR, "-an",
           "-c:v", "libvpx-vp9", "-crf", "38", "-b:v", "0", "-row-mt", "1", str(webm))
    ffmpeg("-i", str(rush), "-vf", FILTRE_ALLER_RETOUR, "-an",
           "-c:v", "libx264", "-crf", "30", "-preset", "slow",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(mp4))
    ffmpeg("-i", str(rush), "-vframes", "1", "-vf", f"scale={LARGEUR_WEB}:-2", str(affiche))
    return {n: f.stat().st_size for n, f in
            (("webm", webm), ("mp4", mp4), ("affiche", affiche))}


def mesurer_boucle(nom: str) -> float:
    """L'écart moyen entre la première et la dernière image du montage, sur 255.

    C'est le critère de recette de Mehdi, rendu mesurable : *« les animations
    reviennent au point de départ »*. Au-delà de 2/255, la boucle saute à l'œil.
    """
    from PIL import Image, ImageChops, ImageStat

    mp4 = SORTIE / f"{nom}.mp4"
    n = int(subprocess.run(
        ["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0",
         "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", str(mp4)],
        capture_output=True, text=True, check=True).stdout.strip())
    import tempfile
    with tempfile.TemporaryDirectory() as t:
        d = pathlib.Path(t)
        ffmpeg("-i", str(mp4), "-vf", "select=eq(n\\,0)", "-vsync", "0",
               "-vframes", "1", str(d / "a.png"))
        ffmpeg("-i", str(mp4), "-vf", f"select=eq(n\\,{n - 1})", "-vsync", "0",
               "-vframes", "1", str(d / "b.png"))
        a = Image.open(d / "a.png").convert("RGB")
        b = Image.open(d / "b.png").convert("RGB")
        st = ImageStat.Stat(ImageChops.difference(a, b))
    return sum(st.mean) / 3


# --------------------------------------------------------------------------


def main() -> None:
    global MODELE, COUT_UNITAIRE
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--scene", action="append", default=[], metavar="NOM")
    ap.add_argument("--toutes", action="store_true", help="les 37 — PAYANT")
    ap.add_argument("--monter", action="store_true", help="remonte les rushs déjà là")
    ap.add_argument("--liste", action="store_true")
    ap.add_argument("--oui", action="store_true", help="confirme la dépense de --toutes")
    ap.add_argument("--modele", choices=sorted(MODELES), default="kling",
                    help="kling (défaut) · hailuo, moins cher et suffisant pour une carte")
    ap.add_argument("--parallele", type=int, default=3)
    args = ap.parse_args()

    if args.liste:
        for nom in MOUVEMENTS:
            r = "rush ✓" if (RUSHS / f"{nom}.mp4").is_file() else "rush —"
            m = "montée ✓" if (SORTIE / f"{nom}.webm").is_file() else "montée —"
            print(f"  {nom:<40} {r:<8} {m:<10} {MOUVEMENTS[nom][:52]}")
        return

    if args.monter:
        faits = [n for n in MOUVEMENTS if (RUSHS / f"{n}.mp4").is_file()]
        for nom in faits:
            p = monter(nom)
            print(f"  {nom:<40} webm {p['webm']//1024:>4} Ko · mp4 {p['mp4']//1024:>4} Ko "
                  f"· boucle {mesurer_boucle(nom):.2f}/255")
        return

    noms = list(MOUVEMENTS) if args.toutes else args.scene
    if not noms:
        sys.exit("rien à faire : --scene <nom>, --toutes ou --monter")
    if inconnus := [n for n in noms if n not in MOUVEMENTS]:
        sys.exit("scène(s) sans mouvement écrit : " + ", ".join(inconnus))

    MODELE, COUT_UNITAIRE = MODELES[args.modele]
    cout = len(noms) * COUT_UNITAIRE
    if args.toutes and not args.oui:
        sys.exit(f"--toutes coûterait environ {cout:.0f} $ ({len(noms)} scènes à "
                 f"{COUT_UNITAIRE} $). Relancer avec --oui pour confirmer.")

    k = cle()
    print(f"{len(noms)} scène(s) · modèle {MODELE} · environ {cout:.2f} $")
    registre = json.loads(REGISTRE.read_text(encoding="utf-8")) if REGISTRE.is_file() else {}
    total = 0.0

    def une(nom: str) -> str:
        nonlocal total
        try:
            _, c = generer(k, nom)
        except Exception as e:
            return f"  {nom:<40} ÉCHEC — {e}"
        total += c
        poids = monter(nom)
        ecart = mesurer_boucle(nom)
        registre[nom] = {"modele": MODELE, "mouvement": MOUVEMENTS[nom],
                         "date": time.strftime("%Y-%m-%d"), "cout": c,
                         "boucle": round(ecart, 2)}
        alerte = "" if ecart <= 2.0 else "  ⚠ la boucle saute"
        return (f"  {nom:<40} webm {poids['webm']//1024:>4} Ko · "
                f"boucle {ecart:.2f}/255 · {c} ${alerte}")

    with ThreadPoolExecutor(max_workers=args.parallele) as pool:
        for ligne in pool.map(une, noms):
            print(ligne)

    RUSHS.mkdir(parents=True, exist_ok=True)
    REGISTRE.write_text(json.dumps(dict(sorted(registre.items())), ensure_ascii=False,
                                   indent=2) + "\n", encoding="utf-8")
    print(f"\n{total:.2f} $ dépensés · rushs dans {RUSHS.relative_to(RACINE)} "
          f"· montages dans {SORTIE.relative_to(RACINE)}")


if __name__ == "__main__":
    main()
