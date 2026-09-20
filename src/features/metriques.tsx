import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Suspense, lazy } from 'react'
/* Recharts pèse ~400 ko à lui seul — plus que tout le reste du socle réuni.
   En chargement différé, un écran sans graphique ne le paie pas du tout, et
   l'écran qui en a un l'obtient pendant que le reste s'affiche déjà. */
const Aire = lazy(() => import('./courbe-recharts'))
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Les tuiles de chiffres du cockpit — le module le plus copié d'une app à
 * l'autre, et celui où les mêmes deux erreurs reviennent :
 *
 *  - le chiffre n'est pas tabulaire, donc une colonne de tuiles danse ;
 *  - la variation est signalée par la seule couleur (rouge/vert), donc elle
 *    disparaît à l'impression et pour un daltonien. D'où la flèche, qui n'est
 *    pas décorative : c'est elle qui porte le sens.
 */

export function TuileMetrique(
  { etiquette, valeur, precision, variation, icone }: {
    etiquette: string; valeur: string; precision?: string
    variation?: number; icone?: ReactNode
  },
) {
  const sens = variation === undefined ? null : variation > 0 ? 'hausse' : variation < 0 ? 'baisse' : 'stable'
  const Fleche = sens === 'hausse' ? ArrowUpRight : sens === 'baisse' ? ArrowDownRight : Minus
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="etiquette">{etiquette}</span>
        {icone && <span className="text-muted-foreground [&_svg]:size-4">{icone}</span>}
      </div>
      <div className="metric mt-2 text-[34px]">{valeur}</div>
      <div className="mt-1 flex items-center gap-2">
        {sens && (
          <span className={cn('inline-flex items-center gap-0.5 font-mono text-xs font-bold tabular-nums',
            sens === 'hausse' && 'text-succes',
            sens === 'baisse' && 'text-danger',
            sens === 'stable' && 'text-muted-foreground')}>
            <Fleche className="size-3.5" strokeWidth={2.5} />
            {variation! > 0 ? '+' : ''}{variation} %
          </span>
        )}
        {precision && <p className="text-xs text-muted-foreground">{precision}</p>}
      </div>
    </Card>
  )
}

export function GrilleMetriques({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
}

/**
 * La courbe. Monochrome par défaut — la charte réserve les couleurs
 * sémantiques aux statuts de données, jamais à la décoration. Une seule série
 * n'a donc pas besoin de couleur : elle est seule.
 *
 * Le dégradé sous la courbe est le SEUL dégradé autorisé en surface d'app : il
 * dérive de la couleur du trait et s'éteint vers le bas. Tout dégradé qui
 * introduit une teinte absente de la charte est un refus.
 */
export function Courbe(
  { donnees, cleX, cleY, hauteur = 220, accent = false }: ProprietesCourbe,
) {
  return (
    <div style={{ height: hauteur }} className="w-full">
      <Suspense
        fallback={<div className="anim-onde size-full rounded-[var(--mode-radius-control)] bg-muted" />}
      >
        <Aire donnees={donnees} cleX={cleX} cleY={cleY} accent={accent} />
      </Suspense>
    </div>
  )
}

export type ProprietesCourbe = {
  donnees: Array<Record<string, string | number>>
  cleX: string; cleY: string; hauteur?: number; accent?: boolean
}
