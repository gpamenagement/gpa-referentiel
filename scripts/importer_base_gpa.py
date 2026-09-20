#!/usr/bin/env python3
"""Importe la base publique GPA dans le socle de l'application.

Source : le dossier d'offre du marché 202600092, où chaque entrée porte déjà sa
source, sa citation littérale et sa date de relevé. Rien n'est inventé ici, rien
n'est corrigé : on projette, on agrège, et on **conserve le niveau de preuve**.

    python3 scripts/importer_base_gpa.py [--base <chemin>]

Sortie : src/donnees/socle.json — lu à la compilation par les vues.

Le graphe est construit ici, pas dans le navigateur : c'est ce que fait
`flowskills/graphe.py`, et pour la même raison — la topologie est une propriété
des données, pas de l'écran qui les montre.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys
from collections import Counter, defaultdict

BASE_DEFAUT = pathlib.Path(
    "/home/mbakkali/projects/flowmetrik-cowork/flowao/data/dce/686974/base-gpa"
)
SORTIE = pathlib.Path(__file__).resolve().parent.parent / "src" / "donnees" / "socle.json"


def charger(base: pathlib.Path, nom: str):
    chemin = base / nom
    if not chemin.exists():
        sys.exit(f"ÉCHEC — fichier source absent : {chemin}")
    return json.loads(chemin.read_text(encoding="utf-8"))


def cle(texte: str) -> str:
    """Un identifiant stable, dérivé du libellé. Les identifiants font foi :
    un libellé peut être réécrit sans casser une arête déjà posée."""
    t = texte.lower()
    for a, b in (("à", "a"), ("â", "a"), ("é", "e"), ("è", "e"), ("ê", "e"),
                 ("î", "i"), ("ï", "i"), ("ô", "o"), ("ö", "o"), ("û", "u"),
                 ("ù", "u"), ("ç", "c"), ("œ", "oe"), ("’", " "), ("'", " ")):
        t = t.replace(a, b)
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:60]


def nom_application(libelle: str) -> str:
    """« SIMA (suivi de la commercialisation) » → « SIMA ».

    Les objets de données nomment les applications avec une glose entre
    parenthèses. Sans cette normalisation, le graphe porte deux nœuds pour la
    même application et personne ne le voit — les deux libellés sont justes.
    """
    return re.sub(r"\s*\(.*?\)\s*$", "", libelle).strip()


# Le logo d'un outil nommé — règle de maison : une application qui porte un nom
# d'éditeur porte son logo. La table est ici et pas dans une vue : c'est une
# propriété de la donnée, et une vue qui la devinerait se tromperait seule.
# Fichiers : public/brand/vendors/, repris de si-gpa/logos/ (41 pièces).
LOGOS = {
    "microsoft power bi": "powerbi.svg",
    "microsoft sharepoint": "sharepoint.svg",
    "microsoft outlook": "outlook.svg",
    "microsoft visio": "visio.svg",
    "microsoft word / excel / powerpoint": "excel.svg",
    "draw.io / diagrams.net": "drawio.svg",
    "n8n": "n8n.svg",
    "ublo": "ublo.png",
    "sig": "esri.svg",
    "si rh": "quarksup.png",
    "si foncier": "progisem-foncier.png",
    "sima": "outsystems.png",
    "data warehouse": "postgresql.svg",
    "si traçabilité des déchets": "microsoft365.svg",
}


def logo_de(nom: str) -> str | None:
    f = LOGOS.get(nom.strip().lower())
    return f"/brand/vendors/{f}" if f else None


# --- Le catalogue de données -------------------------------------------------
#
# Il ne se tient pas à la main : il se LIT depuis les transformations. Les
# descriptions dbt portent déjà le propriétaire, la classification, la fraîcheur
# et les destinataires ; les tests portent les règles de gestion ; les jeux
# d'amorce portent les types réels et un exemple de valeur. Un catalogue saisi à
# côté du code diverge du code en trois semaines — celui-ci ne peut pas.
DBT = pathlib.Path(
    "/home/mbakkali/projects/flowmetrik-cowork/flowao/data/dce/686974/outillage-dossier/demo-dbt"
)

# Quel modèle repose sur quel jeu d'amorce, quelle application l'alimente, et à
# quel objet de données il correspond.
#
# La table est EXPLICITE et non devinée par sous-chaîne : « sima_operations » ne
# contient pas « socle_operation » (pluriel contre singulier), et un rapprochement
# approximatif rendait huit modèles sur neuf sans type ni exemple — sans erreur,
# et sans que le compteur le dise.
MODELES = {
    "socle_operation": ("sima_operations", "SIMA", "Opération d'aménagement"),
    "socle_lot":       ("sima_lots", "SIMA", "Lot / îlot / charge foncière"),
    "socle_tiers":     ("sima_tiers", "SIMA", "Tiers"),
    "socle_bail":      ("ublo_baux", "Ublo", "Patrimoine locatif / bail"),
    "socle_parcelle":  ("foncier_parcelles", "SI Foncier", "Foncier / parcelle"),
    # Les modèles de référentiel sont CALCULÉS : pas de jeu d'amorce, donc pas
    # d'exemple de valeur — et c'est juste ainsi.
    "ref_operation":   (None, "SIMA + SI Foncier", "Opération d'aménagement"),
    "ref_lot":         (None, "SIMA + Ublo", "Lot / îlot / charge foncière"),
    "ref_tiers":       (None, "SIMA", "Tiers"),
    "qualite_referentiel": (None, "contrôles dbt", None),
}


def typer(valeurs: list[str]) -> str:
    """Le type d'une colonne, déduit de ses valeurs — jamais déclaré à la main."""
    vues = [v for v in valeurs if v not in ("", None)]
    if not vues:
        return "inconnu"
    if all(re.fullmatch(r"\d{4}-\d{2}-\d{2}", v) for v in vues):
        return "date"
    if all(re.fullmatch(r"-?\d+", v) for v in vues):
        return "entier"
    if all(re.fullmatch(r"-?\d+[.,]\d+", v) for v in vues):
        return "décimal"
    return "texte"


def champ_de_texte(texte: str, etiquette: str) -> str | None:
    m = re.search(rf"{etiquette}\s*:\s*([^.\n]+)", texte)
    return m.group(1).strip() if m else None


def catalogue() -> dict:
    import csv
    import yaml

    if not DBT.exists():
        return {"entites": [], "note": f"démonstration dbt absente : {DBT}"}

    # 1. Les jeux d'amorce : types réels et exemples de valeurs.
    amorces: dict[str, dict] = {}
    for f in sorted((DBT / "seeds").glob("*.csv")):
        lignes = list(csv.DictReader(f.read_text(encoding="utf-8").splitlines()))
        if not lignes:
            continue
        amorces[f.stem] = {
            "lignes": len(lignes),
            "colonnes": {
                c: {"type": typer([l[c] for l in lignes]), "exemple": lignes[0][c]}
                for c in lignes[0]
            },
        }

    # 2. Les modèles : description, propriétaire, classification, règles.
    entites = []
    for couche in ("socle", "referentiel"):
        f = DBT / "models" / couche / f"{couche}.yml"
        if not f.exists():
            continue
        doc = yaml.safe_load(f.read_text(encoding="utf-8"))
        for m in doc.get("models", []):
            desc = " ".join((m.get("description") or "").split())
            nom_amorce, source, objet = MODELES.get(m["name"], (None, None, None))
            amorce = amorces.get(nom_amorce) if nom_amorce else None
            champs = []
            for c in m.get("columns", []):
                tests = []
                for t in c.get("data_tests", []) or []:
                    if isinstance(t, str):
                        tests.append(t)
                    elif isinstance(t, dict):
                        for k, v in t.items():
                            if k == "accepted_values":
                                tests.append("valeurs : " + ", ".join(v.get("values", [])))
                            elif k == "relationships":
                                tests.append(f"référence {v.get('to', '?')}")
                            else:
                                tests.append(k)
                meta = (amorce or {}).get("colonnes", {}).get(c["name"], {})
                champs.append({
                    "nom": c["name"],
                    "description": " ".join((c.get("description") or "").split()),
                    "type": meta.get("type"),
                    "exemple": meta.get("exemple"),
                    "regles": tests,
                    "cle": "unique" in tests,
                    "obligatoire": "not_null" in tests,
                })
            # Les colonnes présentes dans les données mais non documentées : ce
            # sont elles, la vraie dette de catalogue. Elles s'affichent.
            documentees = {c["nom"] for c in champs}
            for nom, meta in (amorce or {}).get("colonnes", {}).items():
                if nom not in documentees:
                    champs.append({"nom": nom, "description": None, "type": meta["type"],
                                   "exemple": meta["exemple"], "regles": [],
                                   "cle": False, "obligatoire": False})
            # Un échantillon réel : trois lignes suffisent à rendre un schéma
            # crédible, et à faire voir un format de valeur qu'aucune définition
            # ne décrit aussi bien (« 94081 » est un code INSEE, pas un entier).
            echantillon = []
            if nom_amorce and (DBT / "seeds" / f"{nom_amorce}.csv").exists():
                lignes_csv = list(csv.DictReader(
                    (DBT / "seeds" / f"{nom_amorce}.csv").read_text(encoding="utf-8").splitlines()))
                echantillon = lignes_csv[:3]

            entites.append({
                "echantillon": echantillon,
                "cle": cle(m["name"]),
                "modele": m["name"],
                "couche": couche,
                "objet": objet,
                "source_applicative": source,
                "description": desc,
                "proprietaire": champ_de_texte(desc, "Propriétaire(?: de la donnée)?"),
                "classification": champ_de_texte(desc, "Classification"),
                "fraicheur": champ_de_texte(desc, "Fra[îi]cheur(?: attendue)?"),
                "destinataires": champ_de_texte(desc, "Destinataires"),
                "lignes": (amorce or {}).get("lignes"),
                "champs": champs,
                "champs_documentes": len(documentees),
            })
    # 3. Les dépendances entre modèles, lues dans le SQL : `ref('x')` est la
    #    seule déclaration de lignage qui ne peut pas mentir, puisque c'est elle
    #    qui fait tourner la transformation.
    relations = []
    for f in sorted((DBT / "models").rglob("*.sql")):
        sql = f.read_text(encoding="utf-8")
        for cible in sorted(set(re.findall(r"ref\(\s*['\"]([a-z0-9_]+)['\"]\s*\)", sql))):
            relations.append({"de": cible, "vers": f.stem, "type": "alimente"})

    return {
        "source": "démonstration dbt du dossier d'offre (outillage-dossier/demo-dbt)",
        "entites": entites,
        "relations": relations,
    }


def construire(base: pathlib.Path) -> dict:
    apps_src = charger(base, "applications.json")
    objets_src = charger(base, "objets-donnees.json")
    orga = charger(base, "organisation.json")
    personnes = charger(base, "personnes.json")
    operations = charger(base, "operations.json")
    marches = charger(base, "marches-publics.json")

    # --- applications -----------------------------------------------------
    applications = [
        {
            "cle": cle(a["nom"]),
            "nom": a["nom"],
            "categorie": a.get("categorie"),
            "role": a.get("role_declare"),
            "editeur": a.get("editeur_ou_famille"),
            "volumetrie": a.get("volumetrie"),
            "preuve": a.get("niveau_de_preuve"),
            "citation": a.get("citation_source"),
            "remarque": a.get("remarque"),
            "logo": logo_de(a["nom"]),
        }
        for a in apps_src["applications"]
    ]
    hypotheses = [
        {
            "cle": cle(h.get("nom") or h.get("hypothese", "?")),
            "nom": h.get("nom") or h.get("hypothese", "?"),
            "categorie": h.get("categorie"),
            "role": h.get("role_declare") or h.get("pourquoi"),
            "editeur": h.get("editeur_ou_famille"),
            "volumetrie": None,
            "preuve": "hypothèse",
            "citation": h.get("citation_source"),
            "remarque": h.get("remarque") or h.get("a_verifier"),
            "logo": logo_de(h.get("nom") or ""),
        }
        for h in apps_src.get("hypotheses", [])
    ]

    # --- objets de données ------------------------------------------------
    objets = [
        {
            "cle": cle(o["objet"]),
            "nom": o["objet"],
            "definition": o.get("definition"),
            "processus": o.get("processus_metier", []),
            "applications": [nom_application(x) for x in
                             o.get("applications_qui_le_portent_probablement", [])],
            "attributs": o.get("attributs_pressentis", []),
            "indice": o.get("indice_public_qui_le_fonde"),
            "questions": o.get("questions_a_poser_en_atelier", []),
            "preuve": o.get("niveau_de_preuve", "hypothèse"),
        }
        for o in objets_src["objets"]
    ]

    processus = sorted({p for o in objets for p in o["processus"]})

    # --- organisation -----------------------------------------------------
    def libelles(noeud) -> list[dict]:
        if isinstance(noeud, dict):
            noeud = noeud.get("entites") or noeud.get("liste") or list(noeud.values())
        sortie = []
        for x in noeud if isinstance(noeud, list) else []:
            if isinstance(x, dict):
                nom = x.get("nom") or x.get("libelle") or x.get("entite")
                if nom:
                    sortie.append({"nom": nom, "statut": x.get("statut"),
                                   "note": x.get("objet") or x.get("role") or x.get("note")})
            elif isinstance(x, str):
                sortie.append({"nom": x, "statut": None, "note": None})
        return sortie

    organisation = {
        "directions_territoriales": libelles(orga.get("directions_territoriales")),
        "directions_fonctionnelles": libelles(orga.get("directions_fonctionnelles_declarees")),
        "directions_support": libelles(orga.get("directions_support_et_ressources")),
        "filiales": libelles(orga.get("filiales_et_participations")),
        "directions_cctp": apps_src.get("directions_nommees_par_le_cctp", []),
    }

    # --- personnes --------------------------------------------------------
    # Les 71 entrées sont des instances de gouvernance publiées (conseil
    # d'administration, comité de direction) ou des rôles nommés dans un avis
    # public. Aucune n'est un agent non public : c'est la raison pour laquelle
    # elles sont nommées ici, et la vue Méthodologie le dit.
    gens = [
        {
            "cle": cle(f"{p.get('prenom','')}-{p.get('nom','')}"),
            "nom": p.get("nom"), "prenom": p.get("prenom"),
            "fonction": p.get("fonction"), "direction": p.get("direction"),
            "depuis": p.get("depuis"), "preuve": p.get("niveau_de_preuve"),
            "source": p.get("source_type"), "url": p.get("source_url"),
        }
        for p in personnes
    ]

    # --- opérations -------------------------------------------------------
    ops = []
    for o in operations:
        ops.append({
            "cle": o.get("slug") or cle(o.get("nom", "?")),
            "nom": o.get("nom"),
            "commune": o.get("commune_libelle"),
            "departements": o.get("departements", []),
            "dt": o.get("direction_territoriale"),
            "types": o.get("types", []),
            "surface_ha": o.get("surface_ha_deduite"),
            "logements": o.get("logements_deduits"),
            "photo": o.get("photographie"),
            "url": o.get("url_fiche"),
            # ATTENTION : `perimetre_polygone` de la source est un DRAPEAU
            # (le site publie un périmètre), pas une liste de coordonnées. Les
            # points du polygone ne sont pas dans le jeu public : seul leur
            # nombre l'est. Une vue qui croirait tenir une géométrie dessinerait
            # du vide sans qu'aucune erreur ne le dise.
            "perimetre_publie": bool(o.get("perimetre_polygone")),
            "perimetre_nb_points": o.get("perimetre_nb_points"),
            # « Null Island » : trois opérations portent lat 0 / lon 0, ce qui
            # n'est pas une position mais un géocodage échoué. Gardées, elles
            # étirent l'emprise de la carte jusqu'au golfe de Guinée : le cadrage
            # automatique dézoome à l'échelle du monde et les 55 autres
            # deviennent invisibles — sans la moindre erreur.
            "localisation": (
                o["localisation"]
                if isinstance(o.get("localisation"), dict)
                and (o["localisation"].get("lat") or o["localisation"].get("lon"))
                else None
            ),
        })

    # --- marchés ----------------------------------------------------------
    montants = [m.get("montant_eur") for m in marches if isinstance(m.get("montant_eur"), (int, float))]
    par_annee = Counter(
        (m.get("date_publication") or "")[:4] for m in marches if (m.get("date_publication") or "")[:4].isdigit()
    )
    marches_synthese = {
        "total": len(marches),
        "avec_montant": len(montants),
        "montant_total_eur": round(sum(montants)),
        "par_annee": dict(sorted(par_annee.items())),
        # `titulaire` est parfois une chaîne, parfois une liste (marché attribué
        # à un groupement). Compter sans aplatir lève sur « unhashable type ».
        "top_titulaires": Counter(
            t for m in marches for t in (
                m["titulaire"] if isinstance(m.get("titulaire"), list)
                else [m["titulaire"]] if m.get("titulaire") else []
            ) if isinstance(t, str)
        ).most_common(10),
    }

    # --- le graphe : processus → objet de données → application -----------
    noeuds: dict[str, dict] = {}
    aretes: list[dict] = []
    connus = {a["nom"]: a["cle"] for a in applications + hypotheses}

    def noeud(cle_: str, libelle: str, type_: str, preuve: str | None = None):
        noeuds.setdefault(cle_, {"id": cle_, "libelle": libelle, "type": type_, "preuve": preuve})

    for p in processus:
        noeud(f"pro:{cle(p)}", p, "processus", "déduit du métier d'aménageur")
    for a in applications + hypotheses:
        noeud(f"app:{a['cle']}", a["nom"], "application", a["preuve"])
    for o in objets:
        noeud(f"obj:{o['cle']}", o["nom"], "objet", o["preuve"])
        for p in o["processus"]:
            aretes.append({"source": f"pro:{cle(p)}", "cible": f"obj:{o['cle']}", "type": "produit"})
        for nom in o["applications"]:
            c = connus.get(nom)
            if c is None:                      # une application citée par un objet mais
                c = cle(nom)                   # absente de l'inventaire : elle existe,
                noeud(f"app:{c}", nom, "application", "citée par un objet de données")
            aretes.append({"source": f"obj:{o['cle']}", "cible": f"app:{c}", "type": "porte"})

    orphelins = [n["id"] for n in noeuds.values()
                 if not any(a["source"] == n["id"] or a["cible"] == n["id"] for a in aretes)]

    compteurs = {
        "applications": len(applications),
        "applications_hypothese": len(hypotheses),
        "objets": len(objets),
        "processus": len(processus),
        "interfaces": 0,                       # à remplir en atelier — jamais un chiffre inventé
        "operations": len(ops),
        "operations_avec_perimetre": sum(1 for o in ops if o["perimetre_publie"]),
        "operations_geolocalisees": sum(1 for o in ops if o["localisation"]),
        "personnes": len(gens),
        "filiales": len(organisation["filiales"]),
        "directions_territoriales": len(organisation["directions_territoriales"]),
        "marches": marches_synthese["total"],
        "noeuds": len(noeuds),
        "aretes": len(aretes),
        "orphelins": len(orphelins),
    }

    cat = catalogue()
    compteurs["catalogue_entites"] = len(cat["entites"])
    compteurs["catalogue_champs"] = sum(len(e["champs"]) for e in cat["entites"])
    compteurs["catalogue_champs_documentes"] = sum(e["champs_documentes"] for e in cat["entites"])

    return {
        "genere_le": __import__("datetime").date.today().isoformat(),
        "catalogue": cat,
        "source": "flowao/data/dce/686974/base-gpa — marché 202600092",
        "avertissement": objets_src.get("AVERTISSEMENT"),
        "compteurs": compteurs,
        "niveaux_de_preuve": apps_src.get("niveaux_de_preuve", []),
        "applications": applications,
        "applications_hypothese": hypotheses,
        "objets": objets,
        "processus": processus,
        "organisation": organisation,
        "personnes": gens,
        "operations": ops,
        "marches": marches_synthese,
        "graphe": {"noeuds": list(noeuds.values()), "aretes": aretes, "orphelins": orphelins},
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", type=pathlib.Path, default=BASE_DEFAUT)
    args = ap.parse_args()

    socle = construire(args.base)
    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    SORTIE.write_text(json.dumps(socle, ensure_ascii=False, indent=1), encoding="utf-8")

    c = socle["compteurs"]
    poids = SORTIE.stat().st_size / 1024
    print(f"{SORTIE.relative_to(SORTIE.parent.parent.parent)} — {poids:.0f} Ko")
    for k, v in c.items():
        print(f"  {k:28s} {v}")
    if c["noeuds"] == 0 or c["aretes"] == 0:
        sys.exit("ÉCHEC — le graphe est vide, ce qui n'est pas un résultat possible")


if __name__ == "__main__":
    main()
