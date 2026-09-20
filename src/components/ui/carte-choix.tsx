import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * La carte de choix — une grille d'options exclusives, chacune portant une
 * icône au trait et un libellé.
 *
 * Sa mécanique de sélection est **l'inversion** : la carte choisie passe en
 * encre pleine, son icône et son libellé en papier, et elle se soulève. C'est
 * le signal le plus fort qu'un système monochrome puisse produire — et il ne
 * consomme aucune couleur, donc il survit au niveau de gris, à l'impression et
 * au daltonisme.
 *
 * Trois choix qui ne se devinent pas :
 *
 *  - la carte non sélectionnée porte `relief-pose`, la sélectionnée
 *    `relief-souleve` ET une mise à l'échelle de 3 % : sans l'échelle,
 *    l'inversion seule se lit comme un changement d'état, pas comme un choix.
 *    Le mouvement est ce qui dit « c'est celle-ci que je viens de prendre » ;
 *  - l'échelle est plafonnée à 1,03 et l'espacement de la grille la couvre :
 *    au-delà, la carte mord sur ses voisines et la grille tremble ;
 *  - c'est un `<button>` dans un `role="radiogroup"`, pas un `<div onClick>` :
 *    les flèches du clavier parcourent le groupe, et la sélection s'annonce.
 */

export type Choix = { cle: string; libelle: string; icone: ReactNode; detail?: string }

export function GrilleChoix(
  { choix, valeur, onChoisir, etiquette, largeur = 132 }: {
    choix: Choix[]
    valeur: string | null
    onChoisir: (cle: string) => void
    etiquette: string
    /** Largeur maximale d'une carte, en pixels. */
    largeur?: number
  },
) {
  return (
    <div
      role="radiogroup" aria-label={etiquette}
      // La grille remplit par cartes de largeur BORNÉE, elle ne divise pas
      // l'espace en colonnes égales. C'est ce qui fait la densité du modèle :
      // une carte de choix reste petite — on doit pouvoir en embrasser douze
      // d'un regard. Étirée sur un écran large, elle devient une bannière et
      // la grille cesse de se lire comme un ensemble.
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(96px, ${largeur}px))` }}
    >
      {choix.map(c => {
        const pris = valeur === c.cle
        return (
          <button
            key={c.cle}
            type="button" role="radio" aria-checked={pris}
            data-cle={c.cle}
            onClick={() => onChoisir(c.cle)}
            className={cn(
              // 4:5 — la proportion du modèle : l'icône occupe les deux tiers
              // hauts, le libellé se pose sous elle sans la serrer.
              'group flex aspect-[4/5] flex-col items-center justify-between gap-2 px-2 py-3.5',
              'rounded-[var(--mode-radius-container)] border border-border',
              // La transition ne porte que sur trois propriétés nommées. Un
              // `transition: all` animerait aussi la disposition, et la grille
              // sauterait à chaque survol.
              'transition-[background-color,color,box-shadow,transform]',
              'duration-[var(--motion-rapide)] ease-[var(--motion-ease-out)]',
              'focus-visible:ring-[3px] focus-visible:ring-ring/40 outline-none',
              pris
                ? 'z-10 scale-[1.03] border-foreground bg-foreground text-background relief-souleve'
                : 'bg-card text-foreground relief-pose hover:bg-secondary hover:relief-souleve',
            )}
          >
            {/* L'icône domine — c'est elle qu'on reconnaît avant de lire.
                `stroke-1` : le trait fin est ce qui donne au jeu son air de
                dessin technique plutôt que de pictogramme d'application. */}
            <span className={cn('flex flex-1 items-center [&_svg]:size-11 [&_svg]:stroke-1',
                                pris ? 'text-background' : 'text-foreground')}>
              {c.icone}
            </span>
            <span className="w-full text-center">
              <span className="block truncate text-[12px] leading-tight font-semibold">
                {c.libelle}
              </span>
              {c.detail && (
                <span className={cn('mt-0.5 block truncate font-mono text-[9px]',
                                    pris ? 'text-background/70' : 'text-muted-foreground')}>
                  {c.detail}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
