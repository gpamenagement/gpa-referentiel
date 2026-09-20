import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { variantesBouton } from './button-variants'

/**
 * Le bouton. Relief par défaut — décision du 2026-08-28.
 *
 * `relief-controle` n'écrit AUCUNE couleur : il pose un éclairage par-dessus la
 * couleur de fond du variant. Changer `--primary` rhabille donc le bouton sans
 * toucher ce fichier, et une filiale n'a rien à surcharger ici.
 *
 * Deux variants restent délibérément plats : `ghost` et `link`. Un bouton
 * discret qui se soulève cesse d'être discret, et on se retrouve avec trois
 * objets en relief côte à côte dont aucun ne dit lequel est l'action première.
 */
export interface ProprietesBouton
  extends React.ComponentProps<'button'>, VariantProps<typeof variantesBouton> {
  asChild?: boolean
}

export function Button(
  { className, variant, taille, asChild = false, ...props }: ProprietesBouton,
) {
  const Comp = asChild ? Slot : 'button'
  return <Comp data-slot="button" className={cn(variantesBouton({ variant, taille, className }))} {...props} />
}
