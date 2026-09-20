import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Le tableau kanban. Repris de flowgo, où il tenait en 44 lignes sans états.
 *
 * Le compteur par colonne n'est pas un ornement : c'est la seule chose qui
 * signale une colonne qui déborde, et c'est le premier symptôme d'un flux
 * bloqué. Une colonne vide affiche une zone en creux plutôt que du blanc,
 * sinon on ne sait pas si elle est vide ou si l'écran n'a pas fini de charger.
 */

export type Carte = {
  id: string; titre: string; meta?: string
  ton?: 'neutre' | 'succes' | 'alerte' | 'danger' | 'info'; etiquette?: string
}
export type ColonneKanban = { cle: string; titre: string; cartes: Carte[] }

export function Kanban(
  { colonnes, surCarte }: { colonnes: ColonneKanban[]; surCarte?: (c: Carte) => void },
) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {colonnes.map(col => (
        <section key={col.cle} className="flex w-[280px] shrink-0 flex-col gap-2">
          <header className="flex items-center justify-between px-1">
            <span className="etiquette">{col.titre}</span>
            <span className="font-mono text-xs font-bold tabular-nums text-muted-foreground">
              {col.cartes.length}
            </span>
          </header>
          <div className={cn('flex flex-col gap-2 rounded-[var(--mode-radius-container)] p-2',
                             'bg-secondary relief-creux min-h-[120px]')}>
            {col.cartes.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">Aucune carte</p>
            ) : col.cartes.map(c => (
              <Card
                key={c.id} profondeur="pose"
                onClick={surCarte ? () => surCarte(c) : undefined}
                className={cn('cursor-pointer p-3 transition-shadow duration-[var(--motion-rapide)]',
                              'hover:relief-souleve')}
              >
                <p className="text-sm leading-snug font-semibold">{c.titre}</p>
                {c.meta && <p className="mt-1 font-mono text-[11px] text-muted-foreground">{c.meta}</p>}
                {c.etiquette && (
                  <Badge ton={c.ton ?? 'neutre'} className="mt-2">{c.etiquette}</Badge>
                )}
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/* Hors du composant : une table constante reconstruite à chaque rendu casse
   la comparaison de référence chez tout ce qui la reçoit en prop. */
const TONS = {
  neutre: 'bg-muted-foreground', succes: 'bg-succes', alerte: 'bg-alerte',
  danger: 'bg-danger', info: 'bg-info',
} as const

/** Un pas de temps dans un journal ou une chronologie d'incident. */
export function Chronologie({ entrees }: {
  entrees: Array<{ id: string; horodatage: string; titre: string; texte?: string
                   ton?: 'neutre' | 'succes' | 'alerte' | 'danger' | 'info'
                   contenu?: ReactNode }>
}) {
  return (
    <ol className="relative space-y-5 pl-5">
      {/* Le filet vertical est décoratif et doit être invisible aux lecteurs
          d'écran, sinon il se lit comme un élément de liste vide. */}
      <span aria-hidden className="absolute top-1.5 bottom-1.5 left-[3.5px] w-px bg-border" />
      {entrees.map(e => (
        <li key={e.id} className="relative">
          <span aria-hidden
                className={cn('absolute top-1.5 -left-5 size-2 rounded-full ring-2 ring-background',
                              TONS[e.ton ?? 'neutre'])} />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="text-sm font-semibold">{e.titre}</p>
            <time className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {e.horodatage}
            </time>
          </div>
          {e.texte && <p className="mt-0.5 text-sm text-muted-foreground">{e.texte}</p>}
          {e.contenu}
        </li>
      ))}
    </ol>
  )
}
