import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * L'étiquette d'état.
 *
 * Règle de charte tenue par le composant lui-même : **un état ne se signale
 * jamais par la seule couleur**. La pastille est donc dessinée d'office, et
 * elle n'est pas optionnelle — la rendre optionnelle revenait, en pratique, à
 * ce que personne ne la mette. Pour un daltonien comme pour une impression en
 * noir et blanc, c'est la pastille et le libellé qui portent l'information.
 */
const variantesEtiquette = cva(
  'inline-flex items-center gap-1.5 rounded-[var(--mode-radius-badge)] border px-2.5 py-0.5 ' +
  'font-mono text-[11px] font-bold uppercase tracking-[0.06em] whitespace-nowrap',
  {
    variants: {
      ton: {
        neutre: 'border-border bg-secondary text-muted-foreground',
        succes: 'border-succes/35 bg-succes/10 text-succes',
        alerte: 'border-alerte/35 bg-alerte/10 text-alerte',
        danger: 'border-danger/35 bg-danger/10 text-danger',
        info: 'border-info/35 bg-info/10 text-info',
        /* En sombre, la teinte bascule sur `accentOnDark` pour les TROIS
           couches, pas seulement pour le texte. L'accent de la marque mère est
           l'encre `#111111` : mélangé à 10 % et à 40 % sur un fond sombre, il
           ne peint rien, et l'étiquette perd sa pastille et son cadre sans
           qu'aucune mesure ne s'en plaigne — le texte, lui, restait lisible.
           Le défaut ne se voyait pas tant que `ton="unite"` n'était utilisé que
           sous une filiale colorée. */
        unite: 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accentInk)] ' +
               'dark:border-[var(--color-accentOnDark)]/40 dark:bg-[var(--color-accentOnDark)]/10 dark:text-[var(--color-accentOnDark)]',
        fort: 'border-primary bg-primary text-primary-foreground',
      },
    },
    defaultVariants: { ton: 'neutre' },
  },
)

export function Badge(
  { className, ton, children, ...props }:
  React.ComponentProps<'span'> & VariantProps<typeof variantesEtiquette>,
) {
  return (
    <span className={cn(variantesEtiquette({ ton }), className)} {...props}>
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  )
}
