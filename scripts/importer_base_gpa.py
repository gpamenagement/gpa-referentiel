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
            "localisation": o.get("localisation"),
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

    return {
        "genere_le": __import__("datetime").date.today().isoformat(),
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
