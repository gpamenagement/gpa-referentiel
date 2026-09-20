#!/usr/bin/env python3
"""Le lot d'illustrations — ce qu'on dessine, et sous quelles contraintes.

Ce fichier est la **source de vérité du lot**. Il ne contient pas d'images : il
contient les consignes qui les produisent, pour que le lot reste reproductible
et, surtout, **cohérent entre lui**. C'est la seule chose qu'un pack acheté ne
donne jamais : douze illustrations de trois auteurs différents se voient au
premier coup d'œil, et aucune retouche ne les rattrape.

Le socle ci-dessous est repris mot pour mot pour chaque scène. Le modifier
change tout le lot — et c'est voulu : une direction artistique se corrige à un
seul endroit.

## Pourquoi ces contraintes-là

- **Trait uniforme, aucun aplat de gris.** La charte Flowmetrik mère est noir et
  blanc ; une illustration qui introduit des gris introduit une troisième valeur
  que rien ne gouverne, et elle se dégrade à l'impression.
- **Pas de traits de visage.** Une illustration qui donne un visage donne un âge,
  une origine et une humeur. Le produit parle à des salariés qu'on ne connaît
  pas ; le silhouettage est le seul choix qui ne trahit personne.
- **Un seul élément d'accent, moins de 3 % de la surface.** C'est la règle de la
  charte (accent plafonné à ~5 %), et c'est ce qui rend l'illustration
  recoloriable par filiale : un seul chemin à repeindre.
- **Perspective isométrique pour les objets, figures à plat.** L'isométrie donne
  la matière et la profondeur sans ombre portée ; la figure à plat empêche le
  dessin de basculer dans le rendu 3D, que la charte refuse.
- **Le corail sert de repère de fabrication, pas de couleur finale.** Il est
  choisi parce qu'il est la seule teinte saturée de l'image : `fabriquer.py`
  l'isole par la différence rouge−vert, et le remplace par un jeton. Le changer
  ici casse l'extraction.
"""

# La teinte de fabrication. Voir la dernière note ci-dessus avant d'y toucher.
ACCENT_FABRICATION = "#E8503A"
PAPIER_FABRICATION = "#F7F5F1"

SOCLE = f"""Flat vector line illustration, editorial style. STRICT RULES:
- Pure line art: uniform 2px black strokes on a plain {PAPIER_FABRICATION} background.
  No shading, no gradients, no grey tones, no hatching. Solid black fills only for
  hair, shoes and very small props.
- Figures are stylised and elongated, with NO facial features at all — no eyes,
  no mouth, no nose. Only a head silhouette with hair.
- Exactly ONE small accent element in {ACCENT_FABRICATION}, covering less than 3%
  of the image: a single dot, a small solid shape or one short path. It must be the
  ONLY coloured thing in the whole image. Everything else is strictly black on the
  background colour.
- Light isometric perspective for objects, furniture and blocks; figures stay flat.
- Generous empty space around the subject. One single scene, centred, no border,
  no frame, no text, no lettering, no logo, no watermark, no signature.
- Landscape composition, subject occupying the middle half of the frame."""


class Scene:
    def __init__(self, nom: str, titre: str, usage: str, prompt: str):
        self.nom = nom
        self.titre = titre
        #: À quoi elle sert dans une interface — ce qui empêche d'en dessiner
        #: une douzième « parce qu'elle serait jolie ».
        self.usage = usage
        self.prompt = prompt


SCENES = [
    # ── États d'interface — le besoin le plus fréquent d'une application ────
    Scene(
        "vide", "Rien encore",
        "État vide d'une liste, d'un tableau ou d'un espace qu'on vient d'ouvrir",
        "A person standing beside a large empty isometric open box, one hand resting "
        "on its rim, looking into it. A few flat geometric shapes lie scattered on the "
        "ground nearby. The accent is one small shape at the bottom of the box.",
    ),
    Scene(
        "recherche-vide", "Aucun résultat",
        "Une recherche ou un filtre qui ne rend rien",
        "A person holding a large magnifying glass angled toward the ground, walking "
        "slowly. Under the lens the ground is bare except for a few dots. The accent is "
        "one single dot under the lens.",
    ),
    Scene(
        "erreur", "Quelque chose a cassé",
        "Erreur serveur, écran de repli, incident",
        "A person kneeling beside an isometric machine box whose side panel has come "
        "off and leans against it; a few loose cables spill out. The accent is one small "
        "warning dot on the machine's front face.",
    ),
    Scene(
        "succes", "C'est fait",
        "Fin de parcours, confirmation, envoi réussi",
        "A person standing with both arms raised holding a single large flat sheet "
        "above their head; a few small shapes float upward around them. The accent is "
        "one small shape among those floating.",
    ),
    Scene(
        "attente", "En cours",
        "Traitement long, génération, file de travaux",
        "A person sitting sideways on a tall isometric block, legs crossed, watching a "
        "slow circular arc of small shapes orbit in front of them. The accent is the "
        "leading shape of the orbit.",
    ),
    Scene(
        "acces-refuse", "Pas pour vous",
        "403, cloisonnement entre organisations, espace privé",
        "A person standing in front of a tall closed isometric door set in a low wall, "
        "one hand flat against it. The accent is one small dot on the lock.",
    ),
    # ── Scènes produit — ce que Flowmetrik fait réellement ──────────────────
    Scene(
        "entretien", "L'entretien",
        "Conversation avec l'agent, page d'accueil du collaborateur",
        "A person sitting cross-legged on a flat isometric mat wearing headphones, one "
        "hand open mid-gesture while speaking; three concentric sound arcs rise toward a "
        "small floating isometric card. The accent is one dot on that card.",
    ),
    Scene(
        "analyse", "L'extraction",
        "Traitement de la matière, lecture de documents, extraction citée",
        "A person standing beside a tall stack of loose sheets, pulling one sheet out "
        "and holding it up; small flat geometric fragments float away from the stack. "
        "The accent is one of the floating fragments.",
    ),
    Scene(
        "feuille-de-route", "La feuille de route",
        "Priorisation, plan, livrable final",
        "A person walking to the right along a path of separate isometric stepping "
        "blocks that rise gradually; the highest block is furthest right. The accent is "
        "one dot on the highest block.",
    ),
    Scene(
        "equipe", "L'équipe",
        "Invitations, membres, collaboration",
        "Three people standing at different distances, each holding a flat card; thin "
        "straight lines connect the cards to one another. The accent is one dot at the "
        "junction of the lines.",
    ),
    Scene(
        "automatisation", "L'agent au travail",
        "Routine, tâche de fond, agent autonome",
        "A person leaning against a tall isometric console, arms folded, while a small "
        "simple machine on wheels carries a flat sheet across the ground in front of "
        "them. The accent is one dot on the small machine.",
    ),
    Scene(
        "confiance", "Ce qui reste chez vous",
        "Confidentialité, NDA, résidence des données",
        "A person placing a flat sheet into a tall isometric safe box with an open "
        "front; the box has a simple dial. The accent is one dot on the dial.",
    ),

    # ── Les sujets du site — une scène par page de /ressources ─────────────
    # Elles sont arrivées le 2026-09-19 avec le catalogue de `flowmetrik.com/
    # ressources`. Leur place est ici et pas dans le dépôt du site : la
    # direction artistique est celle du socle, et un lot qui vit à deux endroits
    # diverge au premier ajout. Le site consomme les PNG, le socle porte les
    # consignes et les tracés.
    Scene(
        "quest-ce-quun-agent-ia", "Qu'est-ce qu'un agent IA ?",
        "La différence entre un modèle, un assistant et un agent, les cinq pièces qui le composent, et ce qu'il fait vraiment dans une entreprise.",
        "A person standing beside three isometric blocks of different sizes lined "
        "up on the ground; the first is a plain cube, the second has a small "
        "screen on its face, the third has a thin arm reaching out to a flat "
        "sheet. The accent is the whole front panel of the third block, filled "
        "solid. ",
    ),
    Scene(
        "construire-un-agent-ia", "Comment construire un agent IA",
        "La méthode du dossier, geste par geste : arborescence métier, outil branché dessus, skills en fichiers, connecteurs et synchronisation.",
        "A person kneeling on the floor arranging labelled flat folders into an "
        "isometric open box, several more folders stacked neatly beside them. The "
        "accent is one small tab on the folder being placed. ",
    ),
    Scene(
        "quest-ce-quun-connecteur", "Qu'est-ce qu'un connecteur ?",
        "La pièce qui laisse un agent agir sur vos systèmes : quatre familles, une grille de choix, et les pannes silencieuses à connaître avant d'ouvrir un accès.",
        "A person holding a thick cable and plugging it into the side of a large "
        "isometric cabinet; two other cables already run from the cabinet to "
        "smaller boxes on the ground. The accent is the plug in their hand, drawn "
        "as one solid filled shape. ",
    ),
    Scene(
        "quest-ce-quun-llm", "Qu'est-ce qu'un LLM ?",
        "Le modèle, les jetons, la fenêtre de contexte, la date de coupure et les hallucinations — expliqués pour décider, pas pour briller en réunion.",
        "A person standing in front of an enormous isometric wall of identical "
        "flat shelves stretching sideways, holding one single sheet pulled from "
        "it. The accent is that sheet, filled solid. ",
    ),
    Scene(
        "les-meilleurs-cli-agentiques", "Les meilleurs CLI agentiques",
        "Le panorama des agents en ligne de commande, la grille des six critères qui décident, et pourquoi nous refusons de publier un classement figé.",
        "A person standing before an isometric workbench with four different hand "
        "tools laid out in a row, reaching for the second one. The accent is the "
        "dot on the handle of the tool being chosen. ",
    ),
    Scene(
        "le-cloud-et-lia", "Le cloud et l'IA",
        "Des machines louées à l'heure, trois étages de responsabilité, et un appel qui sort de chez vous. Ce qui part, ce qui reste, et ce que ça coûte vraiment.",
        "A person standing on the ground looking up at three large isometric "
        "server blocks floating above, connected to a small box at the person's "
        "feet by long thin lines. The accent is the dot on the nearest floating "
        "block. ",
    ),
    Scene(
        "quest-ce-quun-skill", "Qu'est-ce qu'un skill ?",
        "La recette de cuisine d'un agent : ce qu'on met dedans, la phrase de déclenchement qui décide de tout, et comment un skill naît puis meurt.",
        "A person holding an open recipe card in both hands, standing beside an "
        "isometric kitchen counter with three labelled jars in a row. The accent "
        "is the shape on the middle jar. ",
    ),
    Scene(
        "une-dsi-pour-lia", "Une DSI pour l'IA",
        "Recensement, entretiens, cartographie, tri, premiers agents, transfert : le déroulé d'une mission de bout en bout, et pourquoi elle se termine.",
        "Two people standing on either side of a large isometric floor plan laid "
        "flat on a low table, one pointing at a zone of it. The accent is the "
        "marker on the zone being pointed at. ",
    ),
    Scene(
        "combien-coute-un-agent-ia", "Combien coûte un agent IA ?",
        "Les quatre lignes de la facture, celle que tout le monde oublie, et les trois façons de faire exploser la note sans s'en rendre compte.",
        "A person holding one end of a very long paper receipt that unrolls down "
        "to the ground and curls; an isometric counting machine sits on a block "
        "beside them. The accent is the figure printed near the top of the "
        "receipt. ",
    ),
    Scene(
        "deployer-lia-a-lechelle", "Déployer l'IA à l'échelle",
        "De trois personnes à trois cents : les licences, les droits hérités, les postes, les deux modèles de déploiement et le coût qui ne suit pas la courbe.",
        "One person at the front holding a flat sheet, with three rows of "
        "identical isometric desks receding behind them, each desk bearing the "
        "same small box. The accent is the dot on the box of the front desk. ",
    ),
    Scene(
        "du-poc-au-budget", "Du POC au budget",
        "Le POC a marché et rien ne se passe : ce qu'il faut produire pour qu'un dossier passe — les trois chiffres, le nom, le risque, le critère d'arrêt.",
        "A person carrying a small isometric scale model of a building with both "
        "hands toward a much larger empty platform on the ground. The accent is "
        "the flag planted on the model's roof. ",
    ),
    Scene(
        "routines-boucles-autonomie", "Routines, boucles et autonomie",
        "Ce qui sépare un assistant d'un agent qui travaille : les trois formes de déclenchement, le critère d'arrêt, le journal, et l'échec muet.",
        "A person standing beside a tall isometric machine with a large circular "
        "wheel on its side, mid-turn, a single flat sheet emerging from a slot at "
        "its base. The accent is the dot on the wheel's hub. ",
    ),
    Scene(
        "les-gates-dun-agent", "Les gates d'un agent",
        "Ce qu'un agent ne fait jamais seul : une liste fermée de six gestes, tenue dans l'outil et non dans la consigne, et la file qui se tranche en une ligne.",
        "A person standing beside a tall isometric barrier arm lowered across a "
        "path; a stack of flat sheets waits on the near side. One hand rests on "
        "the arm. The accent is the dot on the barrier's counterweight. ",
    ),
    Scene(
        "brancher-vos-donnees", "Brancher vos données",
        "Les quatre endroits où vivent réellement les documents d'une entreprise, ce que chacun donne à un agent, et ce qui casse en silence à la lecture.",
        "A person pulling one flat sheet from a tall isometric filing cabinet "
        "with several open drawers; two more cabinets stand behind. The accent is "
        "the tab on the open drawer. ",
    ),
    Scene(
        "securite-rgpd-souverainete", "Sécurité, RGPD et souveraineté",
        "Les trois questions qu'on vous posera sur un projet d'agent, et des réponses vérifiables : rétention côté éditeur, obligations RGPD réelles, hébergement.",
        "A person standing beside a heavy isometric safe with its thick door "
        "swung open, holding one flat sheet ready to place inside. The accent is "
        "the safe's round dial, a large filled circle. ",
    ),
    Scene(
        "ecrire-un-serveur-mcp", "Écrire un serveur MCP",
        "Quand le connecteur n'existe pas, on l'écrit. Anatomie d'un serveur, ce qui fait un bon outil, et les quatre pièges qui coûtent une semaine chacun.",
        "A person at an isometric workbench filing a key blank held in a small "
        "vice, a row of finished keys hanging on the wall behind. The accent is "
        "the key held in the vice, filled solid. ",
    ),
    Scene(
        "les-explorateurs", "Les explorateurs",
        "De cent idées à dix agents : la grille de tri, le rôle du volontaire dont l'idée est retenue, et les cinq façons connues de tuer le dispositif.",
        "A person standing before a large isometric board covered in many small "
        "identical cards, lifting one card away from the crowd. The accent is the "
        "mark on the card being lifted. ",
    ),
    Scene(
        "fiabilite-et-hallucination", "Fiabilité et hallucination",
        "La cause réelle de l'invention, ses quatre formes, et le dispositif qui la ramène à un niveau acceptable sans faire relire chaque phrase par un humain.",
        "A person holding a flat sheet at arm's length and looking at it; behind "
        "them the same sheet appears a second time, drawn in a thinner, broken "
        "line, slightly offset. The accent is the dot on the solid sheet. ",
    ),
    Scene(
        "comparer-deux-modeles", "Comparer deux modèles",
        "La méthode du jeu de cas maison : trente cas réels, un protocole reproductible, et le plancher de bruit sans lequel on conclut sur du vent.",
        "A person standing between two identical isometric boxes placed on either "
        "side of a simple balance beam resting on a block, one hand on each box. "
        "The accent is one small dot at the centre of the beam. ",
    ),
    Scene(
        "le-savoir-dune-entreprise", "Le savoir d'une entreprise",
        "La règle du fait unique, le fichier qui fait foi, la date de dernière vérification — et pourquoi un agent rend visible un désordre qui dormait.",
        "A person placing one flat sheet into a single isometric drawer, while "
        "thin lines run from that drawer out to four small empty frames standing "
        "around the room. The accent is the mark on the sheet in the drawer. ",
    ),
    Scene(
        "une-prospection-qui-tient", "Une prospection qui tient",
        "Les sources publiques qui suffisent en France, l'enrichissement payé à l'unité, et le partage exact entre ce qu'un agent fait bien et ce qu'il fait mal.",
        "A person kneeling over a large isometric map spread on the ground, "
        "placing a small marker on it; a compass and a closed notebook rest on "
        "one corner. The accent is the marker being placed. ",
    ),
    Scene(
        "git-pour-une-equipe-qui-ne-code-pas", "Git pour une équipe qui ne code pas",
        "Pourquoi l'historique d'un dossier de règles vaut celui d'un logiciel, et les cinq gestes qui suffisent à le tenir sans savoir programmer.",
        "A person standing where a path splits into two isometric tracks that "
        "curve apart and rejoin further on, holding a flat sheet. The accent is "
        "the dot at the point where the tracks rejoin. ",
    ),
    Scene(
        "les-agents-de-code", "Les agents de code",
        "Migration, revue, tests, reprise d'un code oublié : ce qu'un agent de code fait bien, ce qu'il fait mal, et comment on encadre ses propositions.",
        "A person standing beside a long isometric workbench on which a "
        "mechanical arm holds a flat panel; the person's hand rests on a lever at "
        "the bench's near end. The accent is the dot on the lever. ",
    ),
    Scene(
        "mesurer-un-agent-en-production", "Mesurer un agent en production",
        "Les quatre chiffres qui disent si un agent sert encore, ceux qu'on essaie de compter en vain, et le point de bascule où il devient une dette.",
        "A person standing before an isometric panel of four round dials mounted "
        "on a wall, one hand raised toward the third dial. The accent is the "
        "needle of that third dial. ",
    ),
    Scene(
        "ecrire-un-agents-md", "Écrire un AGENTS.md",
        "Le fichier de règles à la racine d'un dossier d'agent : les cinq rubriques qui comptent, le plafond de lignes, et la relecture trimestrielle.",
        "A person writing in a large open ledger that lies flat on an isometric "
        "stand, a row of closed identical ledgers on a shelf behind. The accent "
        "is the ribbon marking a page of the open ledger. ",
    ),
    # ── Cartographie et gouvernance d'un système d'information ─────────────
    #
    # Le schéma directeur n'est pas ici, et c'est voulu : « Priorisation, plan,
    # livrable final » de `feuille-de-route` couvre déjà la vision cible et sa
    # trajectoire, et `une-dsi-pour-lia` dessine déjà deux personnes devant un
    # plan. Une trente-huitième scène qui redit l'une et redessine l'autre.
    Scene(
        "cartographier-un-si", "Cartographier un SI",
        "La cartographie d'un système d'information : processus, applications, données, et les liens entre eux.",
        "A person standing before a tall isometric wall covered with a grid of "
        "small flat cards joined by thin straight lines, both hands drawing a "
        "new line from one card across to another. The accent is the dot where "
        "that new line meets the second card. ",
    ),
    Scene(
        "le-catalogue-de-donnees", "Le catalogue de données",
        "Le référentiel et le catalogue de données : une fiche par objet, sa définition, son propriétaire.",
        "A person standing at a tall isometric rack of identical upright filing "
        "cards, holding one card tilted forward and reading it; a small flat tag "
        "hangs from the top corner of that card. The accent is the tag on the "
        "card being read. ",
    ),
    Scene(
        "designer-un-proprietaire", "Désigner un propriétaire",
        "La désignation des propriétaires de données, l'arbitrage de gouvernance.",
        "Two people seated on either side of a low isometric table, one holding "
        "out a small flat name tag toward the other, whose open hand is already "
        "reaching for it; two closed folders lie on the table between them. The "
        "accent is the name tag being handed over. ",
    ),
    Scene(
        "lanalyse-dimpact", "L'analyse d'impact",
        "L'analyse d'impact : ce qui dépend d'un objet, et ce qui casse si on le change.",
        "A person pulling on one thread of a large isometric network of small "
        "round nodes joined by thin lines; three nodes along that thread are "
        "filled solid black while the rest stay open outlines. The accent is the "
        "node at the far end of the thread being pulled. ",
    ),
    Scene(
        "la-passation", "La passation",
        "Le transfert de compétences, la fin de mission, l'autonomie du client.",
        "One person handing a large open binder to another with both hands, the "
        "receiver's hands already under it; the giver's shoulder and feet are "
        "turned away toward the edge of the frame, a closed bag in their other "
        "hand. The accent is the small tag on the spine of the binder. ",
    ),
]
