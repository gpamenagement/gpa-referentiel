import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { tonDePreuve, type Preuve } from '@/donnees/socle'

/**
 * Le vocabulaire visuel commun aux vues.
 *
 * Il n'y a rien ici qu'une vue ne puisse redessiner elle-même — sauf que si
 * chacune le fait, la charte s'effrite d'une vue à l'autre. Le filet court sous
 * un titre est le geste le plus caractéristique de GPA : il est ici, une fois.
 */

export function Titre(
  { surtitre, children, note, icone }:
  { surtitre?: string; children: ReactNode; note?: ReactNode; icone?: ReactNode },
) {
  return (
    <header className="mb-5">
      {surtitre && <p className="gpa-surtitre">{surtitre}</p>}
      <h2 className="flex items-center gap-2 font-display text-[22px] leading-tight font-medium">
        {icone && <span className="[&_svg]:size-5 text-[var(--gpa-rouge)]" aria-hidden>{icone}</span>}
        {children}
      </h2>
      <span className="gpa-filet" aria-hidden />
      {note && <p className="max-w-[68ch] text-sm text-muted-foreground">{note}</p>}
    </header>
  )
}

/** Un chiffre et ce qu'il compte. Le chiffre est en Rubik 600, jamais en corail. */
export function Tuile(
  { valeur, libelle, precision, ton = 'neutre', icone }:
  { valeur: ReactNode; libelle: string; precision?: string
    ton?: 'neutre' | 'accent'; icone?: ReactNode },
) {
  return (
    <Card className="p-4">
      <p className="gpa-surtitre flex items-center gap-1.5">
        {icone && <span className="[&_svg]:size-3.5 text-[var(--gpa-rouge)]" aria-hidden>{icone}</span>}
        {libelle}
      </p>
      <p className={cn('mt-1 font-display text-[30px] leading-none font-semibold tabular-nums',
                       ton === 'accent' ? 'text-[var(--color-accentInk)]' : 'text-[var(--gpa-bleu)]')}>
        {valeur}
      </p>
      {precision && <p className="mt-1.5 text-xs text-muted-foreground">{precision}</p>}
    </Card>
  )
}

export function Tuiles({ children }: { children: ReactNode }) {
  return <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
}

/**
 * L'étiquette de niveau de preuve.
 *
 * Aucune entité ne s'affiche sans elle. C'est la règle qui distingue ce
 * référentiel d'un inventaire : il sait ce qu'il ne sait pas, et il le montre à
 * l'endroit où la donnée est lue, pas dans une note de bas de page.
 */
export function EtiquettePreuve({ preuve }: { preuve: Preuve }) {
  if (!preuve) return <Badge ton="neutre">sans source</Badge>
  return <Badge ton={tonDePreuve(preuve)}>{preuve}</Badge>
}

/** Un encadré d'avertissement — hypothèse, manque, question d'atelier. */
export function Encadre(
  { titre, children, ton = 'neutre' }:
  { titre: string; children: ReactNode; ton?: 'neutre' | 'accent' },
) {
  return (
    <aside className={cn('mb-6 border-l-[4px] bg-muted p-4',
                         ton === 'accent' ? 'border-l-[var(--gpa-rouge)]' : 'border-l-[var(--gpa-bleu)]')}>
      <p className="gpa-surtitre">{titre}</p>
      <div className="mt-1.5 max-w-[72ch] text-sm [&_p]:mb-2 [&_p:last-child]:mb-0">{children}</div>
    </aside>
  )
}

/** Le pied de vue : d'où viennent les données affichées, et de quand. */
export function Provenance({ source, date }: { source: string; date: string }) {
  return (
    <p className="mt-8 border-t border-border pt-3 text-xs text-muted-foreground">
      Source : {source} · relevé le {date}
    </p>
  )
}
