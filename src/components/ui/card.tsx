import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * La carte. Trois profondeurs, pas une de plus : `pose` (défaut), `souleve`
 * (survol d'un élément cliquable), `plat` (imbriquée dans une autre carte).
 *
 * Empiler deux cartes en relief produit une bouillie où plus rien ne se
 * détache — d'où `plat`, qui est le bon choix pour tout ce qui vit DANS une
 * carte. C'est l'erreur la plus fréquente une fois le relief adopté.
 */
export function Card(
  { className, profondeur = 'pose', ...props }:
  React.ComponentProps<'div'> & { profondeur?: 'plat' | 'pose' | 'souleve' },
) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground border border-border relief-liseré',
        'rounded-[var(--mode-radius-container)]',
        profondeur === 'pose' && 'relief-pose',
        profondeur === 'souleve' && 'relief-souleve',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-header"
              className={cn('flex flex-col gap-1 p-5 pb-3', className)} {...props} />
}
export function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return <h3 data-slot="card-title" className={cn('text-base leading-snug', className)} {...props} />
}
export function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="card-description"
            className={cn('text-sm text-muted-foreground', className)} {...props} />
}
export function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('p-5 pt-0', className)} {...props} />
}
export function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-footer"
              className={cn('flex items-center gap-2 p-5 pt-0', className)} {...props} />
}
