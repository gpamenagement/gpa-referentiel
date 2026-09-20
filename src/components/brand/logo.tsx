import { cn } from '@/lib/utils'
import './logo.css'

// Les fichiers sont IMPORTÉS, pas référencés par une URL construite.
// Une URL fabriquée à la volée (`/brand/logo-gpa/${base}.svg`) n'existe pour
// l'assembleur que sous forme de morceaux : il ne peut ni la réécrire, ni
// l'inliner, ni vérifier que le fichier existe. Le seul symptôme, dans la
// sortie autonome, est un logo absent — sans la moindre erreur.
import gpaLogo from '@/assets/marque/gpa-logo.svg'
import gpaLogoBlanc from '@/assets/marque/gpa-logo-white.svg'
import gpaSymbole from '@/assets/marque/gpa-symbole.svg'
import flowmetrikBlanc from '@/assets/marque/flowmetrik-logo-horizontal-white.svg'

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

const LOGO: Record<'clair' | 'sombre', string> = { clair: gpaLogo, sombre: gpaLogoBlanc }

/** Le symbole seul — barre latérale, favicon, pastille d'agent. */
export function Marque({ className, ton = 'auto' }: { className?: string; ton?: Ton }) {
  if (ton === 'auto') {
    return (
      <img src={gpaSymbole} alt="Grand Paris Aménagement"
           className={cn('block h-7 w-auto', className)} />
    )
  }
  // Le symbole GPA n'a pas de version blanche : la ligature reste corail, et
  // elle tient sur le marine comme sur le blanc.
  return <img src={gpaSymbole} alt="Grand Paris Aménagement"
              className={cn('block h-7 w-auto', className)} />
}

/** Le lockup symbole + nom — écran de connexion, en-tête, pied de page. */
export function Logo({ className, ton = 'auto' }: { className?: string; ton?: Ton }) {
  if (ton === 'auto') {
    return (
      <img src={LOGO.clair} alt="Grand Paris Aménagement"
           className={cn('block h-7 w-auto', className)} />
    )
  }
  return <img src={LOGO[ton]} alt="Grand Paris Aménagement"
              className={cn('block h-7 w-auto', className)} />
}

/* `LoaderMarque` du socle a été retiré : il dessine le signe Flowmetrik en
   masque SVG, et il n'a rien à faire au milieu d'une application qui porte la
   marque d'un client. Il reste disponible dans la whiteapp. */

export function SignatureFlowmetrik({ className }: { className?: string }) {
  return (
    <a href="https://flowmetrik.com" target="_blank" rel="noreferrer"
       className={cn('group block no-underline', className)}>
      <span className="gpa-surtitre block text-[10px] text-white/45">Réalisé par</span>
      <img src={flowmetrikBlanc} alt="Flowmetrik"
           className="mt-1 h-3.5 w-auto opacity-70 transition-opacity group-hover:opacity-100" />
    </a>
  )
}
