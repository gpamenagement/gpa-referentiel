import { cn } from '@/lib/utils'
import { LOT, type NomIllustration } from './lot'
import { ANIMATIONS, type NomAnimation } from './animations'

export { LOT, ANIMATIONS }
export type { NomIllustration, NomAnimation }

/**
 * Les illustrations de la marque — un trait, une seule touche d'accent.
 *
 * ## Ce que le composant garantit, et qu'un fichier image ne garantit pas
 *
 * Le dessin est **tokenisé** : l'encre prend `currentColor`, l'accent prend
 * `--color-accent`. Une illustration posée dans une page FlowImmo sort donc en
 * jaune sans qu'on ait redessiné quoi que ce soit, et la même illustration sur
 * fond sombre s'inverse toute seule. Un PNG, lui, porte sa couleur cuite dans
 * le fichier : c'est précisément ce qu'on a refusé, alors que le dessin vient
 * d'un modèle d'image — voir `scripts/illustrations/fabriquer.py`.
 *
 * ## Les bornes
 *
 * Quatre tailles, pas cinq. Elles correspondent aux quatre endroits où une
 * illustration a du sens dans une application, et rien d'autre :
 *
 * | Taille | Où | Pourquoi pas ailleurs |
 * |---|---|---|
 * | `vignette` | à côté d'un titre de section, d'une carte | en dessous, le trait se referme et la scène devient une tache |
 * | `carte`    | dans une carte, un état vide de tableau | — |
 * | `panneau`  | un état vide plein écran, une page de fin de parcours | — |
 * | `heros`    | une page d'accueil, une page de marque | une seule par page : deux héros, et aucun des deux ne l'est |
 *
 * ## Ce que le composant refuse
 *
 * - **Deux illustrations dans le même bloc visuel.** Elles se concurrencent, et
 *   l'accent — qui est censé désigner une seule chose — apparaît deux fois.
 * - **Une illustration en fond de texte.** Le trait est à pleine valeur ; il
 *   n'existe pas de variante estompée, et il ne doit pas en exister une. Pour un
 *   fond, c'est `FondTrame` qu'il faut, dont les encres sont mesurées pour ça.
 * - **Une illustration décorative.** Chaque scène du lot porte un `usage` écrit
 *   dans `scenes.py`. Si aucun ne correspond à l'écran, l'écran n'a pas besoin
 *   d'illustration — il a besoin d'une phrase.
 */

const TAILLES = {
  vignette: 'w-24',
  carte: 'w-44',
  panneau: 'w-72',
  heros: 'w-[28rem]',
} as const

export type TailleIllustration = keyof typeof TAILLES

export function Illustration({
  nom,
  taille = 'carte',
  animation = 'aucune',
  titre,
  className,
}: {
  nom: NomIllustration
  taille?: TailleIllustration
  /**
   * Le mouvement. `aucune` par défaut, et c'est le bon défaut : une
   * illustration animée par accident dans une liste de vingt lignes fait
   * bouger toute la page. Les cinq animations et leur usage sont décrits dans
   * `animations.ts` — quatre bouclent, `tracer` se joue une fois.
   */
  animation?: NomAnimation
  /**
   * Le texte alternatif. Par défaut le titre de la scène — mais une
   * illustration qui répète le titre déjà écrit à côté d'elle est du bruit pour
   * un lecteur d'écran : passer `titre=""` la rend alors décorative, ce qui est
   * la vérité dans ce cas.
   */
  titre?: string
  className?: string
}) {
  const scene = LOT[nom]
  const libelle = titre ?? scene.titre
  const decorative = libelle === ''

  return (
    <svg
      viewBox={`0 0 ${scene.largeur} ${scene.hauteur}`}
      data-anim={animation === 'aucune' ? undefined : animation}
      className={cn('illu h-auto max-w-full text-foreground', TAILLES[taille], className)}
      // Une illustration décorative disparaît de l'arbre d'accessibilité ;
      // annoncée, elle est une image avec son texte. Le cas intermédiaire —
      // `role="img"` sans titre — fait annoncer « image » et rien d'autre.
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': libelle })}
    >
      {/* L'encre d'abord, l'accent par-dessus : les deux tracés se recouvrent
          au pixel près là où le dessin porte la couleur, et l'ordre inverse
          ferait disparaître l'accent sous le noir. */}
      <g transform={scene.encre.t} fill="currentColor" stroke="none">
        <path d={scene.encre.d} />
      </g>
      <g className="illu-accent" transform={scene.accent.t} fill="var(--color-accent)" stroke="none">
        <path d={scene.accent.d} />
      </g>
      {/* La lueur de `balayer`. Elle est toujours dans le balisage et masquée
          par le CSS plutôt que conditionnée en JavaScript : une bande ajoutée
          au montage ferait sauter le dessin au premier rendu, et le composant
          serait à re-rendre à chaque changement d'animation. */}
      <rect
        className="illu-lueur"
        x={-scene.largeur * 0.25}
        y={0}
        width={scene.largeur * 0.25}
        height={scene.hauteur}
        fill="var(--color-accent)"
        opacity={0.13}
      />
    </svg>
  )
}

/**
 * Un état vide complet — l'illustration, la phrase, et l'action.
 *
 * C'est le seul motif où une illustration est vraiment utile, et c'est celui
 * qu'on rate le plus souvent : un tableau vide sans rien est indiscernable d'un
 * tableau qui charge. Le composant impose l'ordre — dessin, titre, explication,
 * action — parce que l'ordre inverse fait lire l'action avant d'avoir compris
 * pourquoi l'écran est vide.
 */
export function EtatVide({
  illustration = 'vide',
  titre,
  detail,
  action,
  className,
}: {
  illustration?: NomIllustration
  titre: string
  detail?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 px-6 py-12 text-center', className)}>
      <Illustration nom={illustration} taille="panneau" titre="" />
      <div className="space-y-1.5">
        <p className="font-display text-lg font-semibold tracking-tight">{titre}</p>
        {detail && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{detail}</p>}
      </div>
      {action}
    </div>
  )
}
