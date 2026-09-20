/**
 * Les animations du lot d'illustrations — cinq, et pas une de plus.
 *
 * ## La règle qui les gouverne : une boucle revient à son point de départ
 *
 * Quatre des cinq tournent en boucle. Pour celles-là, l'image au temps zéro et
 * l'image à la fin d'un cycle sont **identiques au pixel près**. Ce n'est pas
 * une élégance : une boucle qui ne referme pas produit un sursaut à chaque tour,
 * et ce sursaut est exactement ce qu'on voit d'une page avant d'en lire un mot.
 * Le contrôle est automatisé — `scripts/gate_illustrations.py` compare les deux
 * états, keyframes puis pixels, et refuse un cycle qui dérive.
 *
 * La cinquième, `tracer`, est une **entrée** : elle se joue une fois, à
 * l'apparition, et s'arrête sur le dessin complet. Elle n'a pas de point de
 * départ à retrouver puisqu'elle ne recommence pas — et c'est pour ça qu'elle
 * est déclarée à part au lieu d'être une boucle mal fermée.
 *
 * ## Pourquoi pas un « dessin qui s'écrit »
 *
 * Le réflexe, sur du line-art, est d'animer `stroke-dashoffset` pour que le
 * trait se trace. Il ne s'applique pas ici : `potrace` rend des tracés
 * **remplis**, pas des traits — le contour de l'épaisseur, pas la ligne
 * médiane. Les passer en `stroke` dessinerait le contour du contour, soit un
 * trait double et creux. `tracer` procède donc par découpe — `clip-path` qui
 * s'ouvre de gauche à droite. Même effet, sur la bonne matière.
 *
 * ## Où vit le CSS
 *
 * Dans `src/styles/illustrations.css`, comme celui des icônes : c'est la
 * convention du projet, et une feuille importée par `styles/index.css` est ce
 * que Tailwind et Vite savent traiter. La table ci-dessous n'en est pas la
 * source — elle en est la **description**, pour la vitrine et le catalogue. Les
 * deux portent la durée de chaque animation, et
 * `scripts/gate_illustrations.py` refuse qu'elles divergent : une durée
 * corrigée d'un seul côté est exactement le genre d'écart qui ne se voit pas.
 *
 * ## Le mouvement respecte `prefers-reduced-motion`
 *
 * Toutes s'arrêtent sur leur image de repos, qui est le dessin complet — jamais
 * sur un état partiel. Une illustration ne doit rien coûter à quelqu'un qui a
 * demandé moins de mouvement.
 */

export type NomAnimation = 'aucune' | 'flotter' | 'respirer' | 'balayer' | 'pivoter' | 'tracer'

export const ANIMATIONS: Record<
  Exclude<NomAnimation, 'aucune'>,
  {
    titre: string
    usage: string
    boucle: boolean
    /**
     * **Comment la boucle referme.** Deux façons, et la gate ne les contrôle
     * pas de la même manière.
     *
     * - `declaration` — les arrêts `0 %` et `100 %` déclarent la même chose.
     *   C'est le cas ordinaire, vérifiable en lisant le CSS.
     * - `position` — les deux extrémités déclarent des valeurs **différentes**
     *   et produisent pourtant la même image, parce que l'élément animé est
     *   hors cadre aux deux bouts. `balayer` est dans ce cas : une lueur qui
     *   entre à gauche et sort à droite n'est visible ni au début ni à la fin.
     *   La refermer textuellement l'obligerait à revenir en arrière en
     *   traversant le dessin — un aller-retour, pas un balayage.
     *
     * Une fermeture par position n'est donc vérifiable **qu'en rendant** :
     * `gate_illustrations.py --rendu` est la seule autorité pour celles-là.
     */
    fermeture?: 'declaration' | 'position'
    duree: number
  }
> = {
  flotter: {
    titre: 'Flotter',
    usage: "Une page d'accueil, un état vide qu'on regarde longtemps. Le dessin respire sans demander l'attention.",
    boucle: true,
    fermeture: 'declaration',
    duree: 6,
  },
  respirer: {
    titre: 'Respirer',
    usage: "L'accent seul pulse. C'est l'animation à choisir quand la scène désigne une chose précise — le point coloré EST le sujet.",
    boucle: true,
    fermeture: 'declaration',
    duree: 3.2,
  },
  balayer: {
    titre: 'Balayer',
    usage: "Une lueur traverse le dessin de gauche à droite, puis sort du cadre. Pour un écran d'attente ou de traitement en cours.",
    boucle: true,
    fermeture: 'position',
    duree: 4.5,
  },
  pivoter: {
    titre: 'Pivoter',
    usage: "Une oscillation de deux degrés. Sur les scènes isométriques, elle donne le volume que l'ombre portée est interdite de donner.",
    boucle: true,
    fermeture: 'declaration',
    duree: 8,
  },
  tracer: {
    titre: 'Tracer',
    usage: "Le dessin se découvre de gauche à droite. **Une seule fois, à l'apparition** — jamais en boucle, un dessin qui s'efface pour se redessiner est un clignotement.",
    boucle: false,
    duree: 1.6,
  },
}
