import * as React from 'react'
import { cn } from '@/lib/utils'
import './degrade.css'

/**
 * Une carte teintée par l'accent de sa filiale : filet en tête, lavis qui
 * s'éteint en diagonale.
 *
 * Elle ne remplace pas `<Card>` — elle se réserve aux surfaces qui ONT une
 * filiale à annoncer : la tuile d'une unité, la fiche d'un membre rattaché, la
 * carte d'une référence. Une grille entière de cartes dégradées annule l'effet
 * qu'on cherchait : si tout est teinté, plus rien ne se distingue, et la charte
 * redevient un fond coloré.
 *
 * Comme tout le reste du socle, elle ne teste jamais la filiale : la teinte
 * arrive par `data-unit`, posé par `<FournisseurUnite>` au-dessus.
 */
export function CarteDegrade(
  { className, dose = 'douce', filet = true, children, ...props }:
  React.ComponentProps<'div'> & { dose?: 'douce' | 'franche'; filet?: boolean },
) {
  return (
    <div
      data-slot="carte-degrade"
      data-dose={dose}
      className={cn(
        'carte-degrade relative overflow-hidden bg-card text-card-foreground',
        'border border-border rounded-[var(--mode-radius-container)] relief-pose',
        className,
      )}
      {...props}
    >
      {/* `aria-hidden` : le filet redit ce que le libellé de la carte dit déjà.
          Annoncé, il ferait lire une décoration à chaque tabulation. */}
      {filet && <span aria-hidden className="carte-degrade__filet absolute inset-x-0 top-0 h-0.5" />}
      {children}
    </div>
  )
}
