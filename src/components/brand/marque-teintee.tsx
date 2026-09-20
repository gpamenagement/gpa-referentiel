import { cn } from '@/lib/utils'
import './teinte.css'

/**
 * La marque, rendue dans l'encre courante.
 *
 * Sert exactement à un cas : montrer une filiale sous son propre accent. Partout
 * ailleurs — en-tête, connexion, pied de page — c'est `<Marque>` et `<Logo>` qui
 * s'utilisent : ils servent le fichier tel quel, donc le signe reste conforme
 * même si le CSS de la page tombe.
 *
 * Le composant ne teste jamais la filiale : il ne fait que porter `currentColor`.
 * C'est `data-unit`, posé une fois par `<FournisseurUnite>`, qui décide de la
 * teinte — et c'est pourquoi ajouter une huitième filiale ne touche pas ce
 * fichier.
 */

const SOURCES = {
  symbole: { url: '/brand/logo/flowmetrik-mark.svg', ratio: '240 / 128' },
  lockup: { url: '/brand/logo/flowmetrik-logo-horizontal.svg', ratio: '786 / 128' },
} as const

export function MarqueTeintee(
  { variante = 'symbole', className, titre }:
  { variante?: keyof typeof SOURCES; className?: string; titre?: string },
) {
  const { url, ratio } = SOURCES[variante]
  return (
    <span
      role={titre ? 'img' : undefined}
      aria-label={titre}
      aria-hidden={titre ? undefined : true}
      className={cn('marque-teintee h-7', className)}
      style={{ '--marque-source': `url("${url}")`, aspectRatio: ratio } as React.CSSProperties}
    />
  )
}
