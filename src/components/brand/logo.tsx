import { useId } from 'react'
import { cn } from '@/lib/utils'
import './logo.css'

/**
 * Le logo GRAND PARIS AMÉNAGEMENT, servi depuis ses SVG officiels.
 *
 * Ce livrable est émis pour GPA : c'est SA marque qui tient la coquille, et la
 * nôtre qui signe discrètement (`SignatureFlowmetrik`). Le fichier blanc n'est
 * PAS le fichier couleur inversé : `gpa-logo-white.svg` porte son mot-logo en
 * `fill="white"`. Posé sur du blanc, il ne resterait que le pictogramme et le
 * nom de l'établissement disparaîtrait SANS qu'aucune erreur ne le signale.
 * Il ne sert donc que sur la latérale marine et le pied.
 *
 * Chaque fichier est vectoriel et propre : il n'y a AUCUNE raison de recourir
 * au bricolage `mix-blend-mode` qu'on trouve dans flowstart, où un WebP sans
 * canal alpha devait être neutralisé contre son fond. Ce contournement était
 * la conséquence d'un mauvais fichier, pas d'un besoin réel.
 *
 * Le renversement sur fond sombre se fait en changeant de FICHIER, pas en
 * inversant les pixels : `flowmetrik-mark-white.svg` existe pour ça, et le
 * signe y est redessiné, pas retourné.
 */

type Ton = 'auto' | 'clair' | 'sombre'

function fichier(base: string, ton: Ton) {
  if (ton === 'sombre') return `/brand/logo-gpa/${base}-white.svg`
  return `/brand/logo-gpa/${base}.svg`
}

/** Le symbole seul — barre latérale, favicon, pastille d'agent. */
export function Marque({ className, ton = 'auto' }: { className?: string; ton?: Ton }) {
  if (ton === 'auto') {
    return (
      <img src={fichier('gpa-symbole', 'clair')} alt="Grand Paris Aménagement"
           className={cn('block h-7 w-auto', className)} />
    )
  }
  return <img src={fichier('gpa-symbole', ton)} alt="Grand Paris Aménagement"
              className={cn('block h-7 w-auto', className)} />
}

/** Le lockup symbole + nom — écran de connexion, en-tête, pied de page. */
export function Logo({ className, ton = 'auto' }: { className?: string; ton?: Ton }) {
  if (ton === 'auto') {
    return (
      <>
        <img src={fichier('gpa-logo', 'clair')} alt="Grand Paris Aménagement"
             className={cn('block h-7 w-auto dark:hidden', className)} />
        <img src={fichier('gpa-logo', 'sombre')} alt="Grand Paris Aménagement"
             className={cn('hidden h-7 w-auto dark:block', className)} />
      </>
    )
  }
  return <img src={fichier('gpa-logo', ton)} alt="Grand Paris Aménagement"
              className={cn('block h-7 w-auto', className)} />
}

/**
 * Le loader de marque. Un flux continu parcourt le symbole et disparaît aux
 * quatre coutures : il passe ainsi sous le ruban, puis revient au premier plan.
 * Préférer ce loader au spinner générique dès que l'attente dépasse la seconde
 * et occupe l'écran : il dit à qui on parle.
 *
 * Pour une attente courte à l'intérieur d'un contrôle, garder le spinner
 * discret : sortir le logo à chaque clic le banalise.
 */
export function LoaderMarque({
  className,
  libelle = 'Chargement en cours',
}: {
  className?: string
  libelle?: string
}) {
  const masque = `flowmetrik-flux-${useId().replace(/:/g, '')}`

  return (
    <svg
      viewBox="0 0 240 128"
      role="status"
      aria-label={libelle}
      className={cn('flowmetrik-loader h-10 w-auto text-foreground', className)}
    >
      <defs>
        <mask
          id={masque}
          x="0"
          y="0"
          width="240"
          height="128"
          maskUnits="userSpaceOnUse"
          style={{ maskType: 'alpha' }}
        >
          <image
            href="/brand/logo/flowmetrik-mark.svg"
            x="0"
            y="0"
            width="240"
            height="128"
          />
        </mask>
      </defs>

      <g mask={`url(#${masque})`}>
        <rect className="flowmetrik-loader__ruban" width="240" height="128" />
        <path
          className="flowmetrik-loader__flux flowmetrik-loader__flux--trainee"
          pathLength="1"
          d="M20 64 C20 32 51 25 73 46 L103 76 C113 86 127 86 137 76 L167 46 C189 25 220 32 220 64 C220 96 189 103 167 82 L137 52 C127 42 113 42 103 52 L73 82 C51 103 20 96 20 64 Z"
        />
        <path
          className="flowmetrik-loader__flux flowmetrik-loader__flux--tete"
          pathLength="1"
          d="M20 64 C20 32 51 25 73 46 L103 76 C113 86 127 86 137 76 L167 46 C189 25 220 32 220 64 C220 96 189 103 167 82 L137 52 C127 42 113 42 103 52 L73 82 C51 103 20 96 20 64 Z"
        />
      </g>
    </svg>
  )
}


/**
 * La signature de l'émetteur. Un livrable porté par la charte d'un tiers reste
 * co-brandé : leur logotype tient l'écran, le nôtre signe en pied de latérale.
 */
export function SignatureFlowmetrik({ className }: { className?: string }) {
  return (
    <a href="https://flowmetrik.com" target="_blank" rel="noreferrer"
       className={cn('group block no-underline', className)}>
      <span className="gpa-surtitre block text-[10px] text-white/45">Réalisé par</span>
      <img src="/brand/flowmetrik/flowmetrik-logo-horizontal-white.svg" alt="Flowmetrik"
           className="mt-1 h-3.5 w-auto opacity-70 transition-opacity group-hover:opacity-100" />
    </a>
  )
}
