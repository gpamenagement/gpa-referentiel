#!/usr/bin/env python3
"""Ce que fait le petit bonhomme — une phrase de mouvement par scène.

Une illustration animée n'est pas une illustration qui bouge : c'est une
illustration **où quelqu'un fait quelque chose**. Mehdi l'a dit en une phrase en
regardant le lot statique : *« les petits bonhommes doivent bouger et faire des
actions. C'est ça que j'appelle une animation. »*

Ce fichier ne contient donc pas des effets — pas de zoom, pas de panoramique,
pas de « la caméra tourne lentement ». Il contient des **gestes**, et chacun
répond à la même question : qu'est-ce que cette personne est en train de faire,
et qu'on ne voyait pas sur le dessin fixe ?

## La règle du geste qui revient

Chaque mouvement part de la pose du dessin et **y revient**. Ce n'est pas une
coquetterie : la vidéo tourne en boucle sur une carte, et un geste qui ne revient
pas produit un saut à chaque tour. La chaîne double d'ailleurs la sécurité en
montant la vidéo en aller-retour (`animer.py`), ce qui referme la boucle même
quand le modèle dérive — mesuré : 5,63/255 d'écart moyen sur le rush brut,
1,13/255 une fois monté, c'est-à-dire du bruit de compression.

## Le socle de consigne, et pourquoi il est aussi long

Un modèle de vidéo à qui on donne un dessin au trait le **repeint** : il ajoute
des ombres, des dégradés, de la couleur, un fond. Ces six phrases ne sont pas du
zèle — chacune correspond à une dérive observée sur les premiers essais. Le
`frame_images` ancre la première image ; le reste tient le style sur les cent
vingt suivantes.
"""

from __future__ import annotations

SOCLE_MOUVEMENT = (
    "Keep the drawing EXACTLY as it is: flat vector line art, uniform thin black "
    "strokes on the plain light background. No shading, no gradient, no texture, "
    "no new colour — the single small red accent stays the only coloured thing. "
    "Faces stay blank: no eyes, no mouth, no nose, ever. "
    "The camera does not move, does not zoom, does not pan. "
    "The scene starts and ends in the pose of the first frame."
)

# Un geste par scène. Les états d'interface d'abord, les sujets ensuite — le même
# ordre que `scenes.py`, pour que les deux fichiers se relisent côte à côte.
MOUVEMENTS: dict[str, str] = {
    # ── Les états d'interface ──────────────────────────────────────────────
    "vide": "The person leans over the empty box, looks inside, then straightens up again.",
    "recherche-vide": "The person sweeps the magnifying glass slowly left, then right, and back to the centre.",
    "erreur": "The person reaches toward the loose panel, touches it, then pulls their hand back.",
    "succes": "The person raises the sheet a little higher with both arms, holds it, then lowers it.",
    "attente": "The person shifts their weight from one foot to the other, and settles back.",
    "acces-refuse": "The person lifts one hand toward the closed door, stops short of it, and lowers it.",
    "entretien": "The seated person gestures once with the open hand while speaking, then rests it again.",
    "analyse": "The person moves a finger across the chart from left to right, then back to the start.",
    "feuille-de-route": "The person points at the far end of the road, holds, then lowers the arm.",
    "equipe": "Each figure turns slightly toward the centre, then back to facing forward.",
    "automatisation": "The machine's wheel turns half a revolution and returns; a sheet slides out and back.",
    "confiance": "The person places one hand flat on the strongbox, holds it there, then withdraws it.",

    # ── Les sujets ─────────────────────────────────────────────────────────
    "quest-ce-quun-agent-ia": "The thin arm of the third block reaches out to the flat sheet, touches it, then folds back.",
    "construire-un-agent-ia": "The kneeling person places one folder into the box, then reaches for the next from the stack.",
    "quest-ce-quun-connecteur": "The person pushes the cable into the cabinet socket, holds, then eases it back out.",
    "quest-ce-quun-llm": "The person pulls one sheet from the wall of shelves, looks at it, then slides it back.",
    "les-meilleurs-cli-agentiques": "The person's hand moves over the row of tools, hovers above the second, then lifts it slightly.",
    "le-cloud-et-lia": "The person raises one hand toward the floating server blocks, holds it, then lowers it. The blocks drift gently up and down.",
    "quest-ce-quun-skill": "The person turns the recipe card toward the jars, looks at the middle one, then back to the card.",
    "une-dsi-pour-lia": "One person points at a zone of the floor plan; the other leans in to look, then both straighten up.",
    "combien-coute-un-agent-ia": "The person pulls the receipt a little further out of the machine, reads it, then lets it settle.",
    "deployer-lia-a-lechelle": "The front person holds up the sheet; one by one the boxes on the desks behind blink their small light, then rest.",
    "du-poc-au-budget": "The person carries the scale model one step closer to the platform, then steps back.",
    "routines-boucles-autonomie": "The wheel turns half a revolution and returns; a sheet emerges from the slot and slides back.",
    "les-gates-dun-agent": "The person lifts the barrier arm a little, the top sheet of the stack slides forward, the arm comes back down.",
    "brancher-vos-donnees": "The person pulls a sheet out of the open drawer, looks at it, and slides it back in.",
    "securite-rgpd-souverainete": "The person places the sheet inside the safe, then swings the heavy door half shut and back open.",
    "ecrire-un-serveur-mcp": "The person files the key blank in the vice twice, then lifts it to check the edge.",
    "les-explorateurs": "The person lifts one card away from the board, holds it up, then places it back.",
    "fiabilite-et-hallucination": "The person turns the sheet slightly; the thin broken duplicate behind it drifts apart, then realigns.",
    "comparer-deux-modeles": "The balance beam tips a little to one side, then the other, and returns level.",
    "le-savoir-dune-entreprise": "The person places the sheet into the drawer; the thin lines to the empty frames light up one by one, then rest.",
    "une-prospection-qui-tient": "The kneeling person sets a marker on the map, sits back to look, then reaches for the next.",
    "git-pour-une-equipe-qui-ne-code-pas": "The person walks two steps along one branch of the track, stops at the junction, and steps back.",
    "les-agents-de-code": "The mechanical arm lowers the panel onto the bench, the person's hand pushes the lever, and both return.",
    "mesurer-un-agent-en-production": "The needles of the four dials swing up, hold, and swing back; the person's raised hand follows the third.",
    "ecrire-un-agents-md": "The person writes one line in the open ledger, lifts the pen, then lowers it to write again.",
}


def consigne(nom: str) -> str:
    """La consigne complète envoyée au modèle de vidéo pour une scène."""
    if nom not in MOUVEMENTS:
        raise KeyError(
            f"« {nom} » n'a pas de mouvement écrit. Une scène sans geste ne "
            "s'anime pas : on ne sait pas ce que la personne ferait."
        )
    return f"{MOUVEMENTS[nom]} {SOCLE_MOUVEMENT}"
