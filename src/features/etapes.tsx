import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Le bandeau d'étapes — parcours d'accueil, assistant, dépôt de dossier.
 *
 * Repris de flowstart, où la décision qui compte avait été prise et écrite :
 * **la couleur ne distingue plus rien, c'est la FORME qui distingue**. L'étape
 * courante est remplie et porte un halo ; les franchies portent une coche ;
 * les suivantes sont creuses. Rien de tout cela ne dépend d'une teinte, donc
 * tout survit à l'impression, au daltonisme et au thème sombre.
 */
export function Etapes(
  { etapes, courante }: { etapes: Array<{ cle: string; titre: string }>; courante: number },
) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {etapes.map((e, i) => {
        const faite = i < courante
        const active = i === courante
        return (
          <li key={e.cle} className="flex items-center gap-2">
            <span
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full',
                'font-mono text-[11px] font-bold tabular-nums',
                'transition-all duration-[var(--motion-rapide)] ease-[var(--motion-ease-out)]',
                faite && 'bg-primary text-primary-foreground',
                active && 'bg-primary text-primary-foreground relief-controle ring-4 ring-primary/15',
                !faite && !active && 'border border-input bg-secondary text-muted-foreground relief-creux',
              )}
            >
              {faite ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn('text-sm whitespace-nowrap',
                                active ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
              {e.titre}
            </span>
            {i < etapes.length - 1 && (
              <span aria-hidden className="mx-1 hidden h-px w-8 bg-border sm:block" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** Une section de réglages : titre, explication, contrôle à droite. */
export function LigneReglage(
  { titre, texte, children }: { titre: string; texte?: string; children: ReactNode },
) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border py-4 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{titre}</p>
        {texte && <p className="mt-0.5 max-w-[60ch] text-sm text-muted-foreground">{texte}</p>}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  )
}
