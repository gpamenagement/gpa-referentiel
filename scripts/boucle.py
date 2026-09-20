#!/usr/bin/env python3
"""Boucle de jugement du design — passe chaque page au crible, en clair et en sombre.

    python3 scripts/boucle.py [--url http://127.0.0.1:8797] [--pages slug,slug]
    python3 scripts/boucle.py --captures        # écrit aussi les PNG

Ce que le script mesure vraiment, sur la page RENDUE et non sur la source :

  débordement    la page est-elle plus large que la fenêtre ? (le défaut le plus
                 fréquent, et invisible sur un grand écran)
  contraste      chaque texte contre la couleur de fond RÉELLEMENT peinte, en
                 remontant les parents transparents jusqu'à trouver un aplat
  polices        un glyphe rendu en police de repli — vert en local, rouge en CI
  focus          chaque cible tabulable a-t-elle un anneau visible ? (les
                 contre-exemples portent `data-contre-exemple` et sont exclus)
  cibles         24 × 24 px (WCAG 2.2 AA), et seulement quand les DEUX dimensions
                 sont petites : une entrée de menu de 235 × 32 se vise très bien
  images         un `src` qui ne charge pas, un `alt` manquant
  couleur seule  une pastille de statut sans libellé ni forme
  ébauches       une page déclarée au registre mais restée vide

Ce qu'il ne voit PAS, et qui reste au jugement humain : si la page est belle, si
la hiérarchie est juste, si le mot est le bon. `gate.py` valide les tokens, ce
script valide le rendu, le skill `flowdesigndecker` juge le résultat. Aucun des
trois ne remplace les deux autres.

Sortie : `ticks/<horodatage>.md`, un journal lisible et diffable.
"""
from __future__ import annotations

import argparse
import asyncio
import fcntl
import json
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent
TICKS = REPO / "ticks"
CAPTURES = pathlib.Path("/tmp/whiteapp-captures")

# WCAG AA : 4.5 pour du texte courant, 3.0 pour du gros texte (>= 24px, ou
# >= 18.66px en gras). En dessous, le texte n'est pas lisible pour une part
# mesurable des lecteurs — ce n'est pas une préférence.
SEUIL_NORMAL, SEUIL_GROS = 4.5, 3.0

SONDE = r"""
async () => {
  // Attendre que les images soient réellement décodées, plutôt que d'espérer
  // qu'un délai fixe suffise : sans ça la mesure dépend de la charge de la
  // machine, et un faux positif intermittent ressemble à une régression — le
  // pire résultat possible pour un outil de contrôle.
  //
  // La borne porte sur la PAGE, pas sur chaque image. Une borne par image
  // multipliait l'attente par le nombre d'images : 22 SVG sur la page `logos`
  // suffisaient à faire passer une passe de trois minutes à dix.
  const enAttente = [...document.images].filter(i => !i.complete)
  if (enAttente.length) {
    await Promise.race([
      Promise.all(enAttente.map(i => i.decode().catch(() => null))),
      new Promise(r => setTimeout(r, 2500)),
    ])
  }

  const out = { debordement: null, contrastes: [], polices: [], focus: [],
                cibles: [], images: [], couleurSeule: [], ebauche: false };

  const de = document.documentElement;
  if (de.scrollWidth > window.innerWidth + 1) {
    const coupables = [...document.querySelectorAll('*')]
      .filter(e => e.getBoundingClientRect().right > window.innerWidth + 1)
      .slice(0, 4)
      .map(e => e.tagName.toLowerCase() + '.' + String(e.className).slice(0, 60));
    out.debordement = { largeur: de.scrollWidth, fenetre: window.innerWidth, coupables };
  }

  out.ebauche = document.body.innerText.includes('Page en attente de contenu');

  // --- contraste ---------------------------------------------------------
  const lum = (r, g, b) => {
    const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const rgb = s => { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : null };
  // Remonte les parents jusqu'à un fond opaque : un texte sur `transparent`
  // n'est PAS sur du blanc, il est sur ce que peint son ancêtre.
  const fondReel = el => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = rgb(getComputedStyle(n).backgroundColor);
      if (c && (c[3] === undefined || c[3] > 0.85)) return c;
      n = n.parentElement;
    }
    return [255, 255, 255];
  };
  const ratio = (a, b) => {
    const l1 = lum(a[0], a[1], a[2]), l2 = lum(b[0], b[1], b[2]);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  const vus = new Set();
  for (const el of document.querySelectorAll('p,span,a,button,h1,h2,h3,h4,li,td,th,label,code,kbd')) {
    const txt = (el.textContent || '').trim();
    if (!txt || el.children.length) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const st = getComputedStyle(el);
    if (st.visibility === 'hidden' || st.opacity === '0') continue;
    const fg = rgb(st.color); if (!fg) continue;
    const bg = fondReel(el);
    const px = parseFloat(st.fontSize);
    const gros = px >= 24 || (px >= 18.66 && parseInt(st.fontWeight) >= 700);
    const seuil = gros ? 3.0 : 4.5;
    const v = ratio(fg, bg);
    const cle = st.color + '|' + bg.join(',') + '|' + Math.round(px);
    if (v < seuil && !vus.has(cle)) {
      vus.add(cle);
      out.contrastes.push({ texte: txt.slice(0, 50), ratio: +v.toFixed(2), seuil,
                            taille: px, couleur: st.color });
    }
  }

  // --- polices de repli --------------------------------------------------
  // On compare la largeur rendue à celle obtenue en forçant la police de repli.
  // Identiques => la police demandée n'a pas été chargée.
  const mesure = (texte, famille) => {
    const c = document.createElement('canvas').getContext('2d');
    c.font = `700 32px ${famille}`;
    return c.measureText(texte).width;
  };
  for (const [nom, fam] of [['Poppins', 'Poppins'], ['Nunito', 'Nunito'],
                            ['Space Grotesk', '"Space Grotesk"']]) {
    const a = mesure('Flowmetrik 123', fam + ', serif');
    const b = mesure('Flowmetrik 123', 'serif');
    if (Math.abs(a - b) < 0.5) out.polices.push(nom);
  }

  // --- focus et cibles ---------------------------------------------------
  // On FOCALISE réellement chaque cible et on mesure le style obtenu, au lieu
  // de le deviner depuis les noms de classe. L'heuristique précédente cherchait
  // « focus-visible » dans le className : elle validait nos composants Tailwind
  // et accusait à tort toute dépendance tierce, dont AG Grid — dont les
  // contrôles sont pourtant correctement cerclés une fois la règle CSS posée.
  //
  // C'est plus lent (un focus + une lecture de style par cible, plafonné à 60),
  // et c'est le prix d'une mesure au lieu d'une supposition.
  const actif = document.activeElement;
  const tabulables = [...document.querySelectorAll(
    'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')];
  for (const el of tabulables.slice(0, 60)) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;

    // Les contre-exemples de la vitrine montrent ce qu'il ne faut PAS faire.
    // Sans cette sortie, la page qui documente la règle du focus reste
    // éternellement en faute, et on ignore la catégorie entière.
    if (el.hasAttribute('data-contre-exemple')) continue;

    const avant = getComputedStyle(el);
    const repos = avant.outlineStyle + '|' + avant.outlineWidth + '|' + avant.boxShadow
                + '|' + avant.borderColor;
    try { el.focus({ preventScroll: true }) } catch { continue }
    const apres = getComputedStyle(el);
    const focalise = apres.outlineStyle + '|' + apres.outlineWidth + '|' + apres.boxShadow
                   + '|' + apres.borderColor;

    // Un focus est visible si QUELQUE CHOSE change à la prise de focus —
    // anneau, ombre ou bordure. On ne juge pas la forme, seulement qu'elle
    // existe : la charte impose un repère, pas un anneau en particulier.
    if (repos === focalise) {
      out.focus.push(el.tagName.toLowerCase() + '.' + String(el.className).slice(0, 50));
    }

    // WCAG 2.2 AA « Target Size (Minimum) » = 24 × 24 px, et non 44 : le 44
    // est la recommandation Apple, reprise à tort comme une norme. La règle
    // porte sur les DEUX dimensions — une entrée de menu de 235 × 32 se vise
    // sans effort, et la signaler noie les vraies fautes.
    const enveloppe = el.closest('label') || el.parentElement;
    const re = enveloppe ? enveloppe.getBoundingClientRect() : r;
    const cible = { w: Math.max(r.width, re.width), h: Math.max(r.height, re.height) };
    if (cible.w < 24 && cible.h < 24 && el.tagName === 'BUTTON') {
      out.cibles.push({ el: String(el.className).slice(0, 44),
                        w: Math.round(cible.w), h: Math.round(cible.h),
                        libelle: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30) });
    }
  }
  // On rend le focus là où il était : le laisser sur le dernier élément testé
  // changerait ce que les mesures suivantes observent.
  try { (actif instanceof HTMLElement ? actif : document.body).focus({ preventScroll: true }) } catch {}
  window.scrollTo(0, 0);

  // --- images ------------------------------------------------------------
  for (const img of document.querySelectorAll('img')) {
    if (!img.complete || img.naturalWidth === 0) out.images.push({ src: img.src, faute: 'ne charge pas' });
    else if (img.alt === null || (img.alt === '' && img.getAttribute('aria-hidden') !== 'true'))
      out.images.push({ src: img.src.split('/').pop(), faute: 'alt manquant' });
  }

  // --- statut par la couleur seule --------------------------------------
  for (const el of document.querySelectorAll('[class*="rounded-full"]')) {
    const r = el.getBoundingClientRect();
    if (r.width > 3 && r.width < 14 && !el.textContent.trim()
        && el.getAttribute('aria-hidden') !== 'true' && !el.closest('button,[role="status"]')
        && !el.parentElement?.textContent?.trim()) {
      out.couleurSeule.push(String(el.className).slice(0, 60));
    }
  }
  return out;
}
"""


async def registre(url: str) -> list[tuple[str, str, str]]:
    """La liste des pages, lue depuis l'application elle-même.

    Elle était auparavant extraite de `registre.ts` à l'expression régulière —
    et trois pages dont le titre portait une apostrophe échappée lui
    échappaient. Elles n'étaient jamais jugées, en silence. Une source dérivée
    du code source par analyse textuelle ment tôt ou tard ; celle-ci est
    littéralement la liste que la navigation utilise.
    """
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        pg = await nav.new_page()
        await pg.goto(url, wait_until="networkidle")
        pages = await pg.evaluate("() => window.__whiteapp ?? []")
        await nav.close()
    if not pages:
        sys.exit("l'application n'expose pas window.__whiteapp — registre.ts a-t-il changé ?")
    return [(p["slug"], p["titre"], p["famille"]) for p in pages]


async def juger(url: str, pages, captures: bool) -> list[dict]:
    from playwright.async_api import async_playwright
    resultats = []
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        for largeur, etiquette in ((1440, "bureau"), (390, "mobile")):
            ctx = await nav.new_context(viewport={"width": largeur, "height": 900},
                                        device_scale_factor=2)
            pg = await ctx.new_page()
            erreurs: list[str] = []
            pg.on("console", lambda m: erreurs.append(m.text) if m.type == "error" else None)
            pg.on("pageerror", lambda e: erreurs.append(str(e)))
            for theme in ("light", "dark"):
                for slug, titre, famille in pages:
                    await pg.goto(f"{url}/#{slug}", wait_until="networkidle")
                    await pg.evaluate(
                        "t => { document.documentElement.classList.toggle('dark', t === 'dark');"
                        "       document.documentElement.classList.toggle('light', t === 'light');"
                        "       localStorage.setItem('fm-theme', t) }", theme)
                    await pg.wait_for_timeout(300)
                    # Défiler AVANT de mesurer : les images sont en
                    # `loading="lazy"`, et sur un écran étroit la page est assez
                    # haute pour qu'aucune ne se charge sous la ligne de
                    # flottaison. Sans ça, la sonde criait « ne charge pas » sur
                    # des images parfaitement saines.
                    await pg.evaluate(
                        "async () => { const h = document.body.scrollHeight;"
                        " for (let y = 0; y < h; y += 500) { window.scrollTo(0, y);"
                        "   await new Promise(r => setTimeout(r, 45)) } window.scrollTo(0, 0) }")
                    await pg.wait_for_timeout(120)
                    n = len(erreurs)
                    try:
                        r = await pg.evaluate(SONDE)
                    except Exception as e:                       # noqa: BLE001
                        r = {"sonde": f"a échoué : {e}"}
                    r |= {"slug": slug, "titre": titre, "famille": famille,
                          "theme": theme, "largeur": etiquette,
                          "console": erreurs[n:]}
                    resultats.append(r)
                    if captures and theme == "light" and etiquette == "bureau":
                        CAPTURES.mkdir(exist_ok=True)
                        await pg.screenshot(path=str(CAPTURES / f"{slug}.png"), full_page=True)
            await ctx.close()
        await nav.close()
    return resultats


def journal(res: list[dict], horodatage: str) -> str:
    """Un journal lisible : ce qui casse d'abord, le détail ensuite."""
    def cumul(cle):
        d: dict[str, list] = {}
        for r in res:
            for x in r.get(cle) or []:
                d.setdefault(r["slug"], []).append((r["theme"], r["largeur"], x))
        return d

    deb = {r["slug"]: r["debordement"] for r in res if r.get("debordement")}
    con, foc, cib, img, pol = (cumul(k) for k in
                              ("contrastes", "focus", "cibles", "images", "polices"))
    cou = cumul("couleurSeule")
    ebauches = sorted({r["slug"] for r in res if r.get("ebauche")})
    consoles = cumul("console")
    pages = sorted({r["slug"] for r in res})

    total = (len(deb) + len(con) + len(foc) + len(cib) + len(img) + len(pol)
             + len(cou) + len(consoles))
    L = [f"# Tick {horodatage}", "",
         f"{len(pages)} pages · 2 thèmes · 2 largeurs — "
         f"**{total} page(s) avec au moins un défaut**, {len(ebauches)} ébauche(s).", ""]

    def bloc(titre, d, rendu):
        if not d:
            L.append(f"- ✅ **{titre}** — rien à signaler.")
            return
        L.append(f"\n## {titre} — {len(d)} page(s)\n")
        for slug, items in sorted(d.items()):
            L.append(f"**`{slug}`**")
            for it in items[:6]:
                L.append(f"  - {rendu(it)}")
            if len(items) > 6:
                L.append(f"  - … et {len(items) - 6} autre(s)")
        L.append("")

    L.append("## Verdict\n")
    for t, d in (("Débordement horizontal", deb), ("Contraste sous le seuil", con),
                 ("Police de repli", pol), ("Focus invisible", foc),
                 ("Cible tactile trop petite", cib), ("Images", img),
                 ("Statut par la couleur seule", cou), ("Erreurs console", consoles)):
        if not d:
            L.append(f"- ✅ {t}")
    L.append("")

    if deb:
        L.append(f"\n## Débordement horizontal — {len(deb)} page(s)\n")
        for slug, d in sorted(deb.items()):
            L.append(f"- **`{slug}`** : {d['largeur']} px pour {d['fenetre']} px de fenêtre")
            for c in d["coupables"]:
                L.append(f"  - `{c}`")
        L.append("")

    bloc("Contraste sous le seuil", con,
         lambda i: f"[{i[0]}/{i[1]}] {i[2]['ratio']}:1 < {i[2]['seuil']} — "
                   f"« {i[2]['texte']} » ({round(i[2]['taille'])} px, {i[2]['couleur']})")
    bloc("Police de repli", pol, lambda i: f"[{i[0]}/{i[1]}] {i[2]} n'est pas chargée")
    bloc("Focus invisible", foc, lambda i: f"[{i[0]}/{i[1]}] `{i[2]}`")
    bloc("Cible tactile trop petite", cib,
         lambda i: f"[{i[0]}/{i[1]}] {i[2]['w']}×{i[2]['h']} — « {i[2]['libelle']} »")
    bloc("Images", img, lambda i: f"[{i[0]}/{i[1]}] {i[2]['faute']} — {i[2]['src']}")
    bloc("Statut par la couleur seule", cou, lambda i: f"[{i[0]}/{i[1]}] `{i[2]}`")
    bloc("Erreurs console", consoles, lambda i: f"[{i[0]}/{i[1]}] {str(i[2])[:160]}")

    if ebauches:
        L.append(f"\n## Ébauches — {len(ebauches)} page(s)\n")
        L.append("Déclarées au registre, sans contenu :\n")
        L.append(", ".join(f"`{s}`" for s in ebauches))
        L.append("")

    return "\n".join(L) + "\n"


def verrou():
    """Une seule passe à la fois, sur toute la machine.

    Deux passes concurrentes se partagent le même serveur et les mêmes cœurs :
    chacune double sa durée, et l'ensemble ressemble à un gel sans qu'aucune ne
    soit en faute. Le verrou vit ici et non dans `tick.sh` parce que c'est ici
    que le coût est payé — un appel direct à `boucle.py` doit être protégé
    aussi.
    """
    f = open("/tmp/whiteapp-boucle.lock", "w")
    try:
        fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        sys.exit("une passe tourne déjà — la voir avec : pgrep -af boucle.py")
    return f   # gardé ouvert : le verrou tombe à la fin du processus


def main() -> None:
    _v = verrou()
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://127.0.0.1:8797")
    ap.add_argument("--pages", default="")
    ap.add_argument("--captures", action="store_true")
    ap.add_argument("--horodatage", default="", help="passé de l'extérieur — le sandbox n'a pas d'horloge fiable")
    a = ap.parse_args()

    pages = asyncio.run(registre(a.url))
    if a.pages:
        garde = set(a.pages.split(","))
        pages = [p for p in pages if p[0] in garde]

    res = asyncio.run(juger(a.url, pages, a.captures))
    horo = a.horodatage or "tick"
    TICKS.mkdir(exist_ok=True)
    txt = journal(res, horo)
    (TICKS / f"{horo}.md").write_text(txt, encoding="utf-8")
    (TICKS / f"{horo}.json").write_text(json.dumps(res, ensure_ascii=False), encoding="utf-8")
    print(txt)


if __name__ == "__main__":
    main()
