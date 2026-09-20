import { cn } from '@/lib/utils'

/**
 * Une photo de la bibliothèque, passée en niveaux de gris.
 *
 * La règle de charte : les photos sortent en gris pour tenir la direction
 * monochrome. L'exception est FlowImmo, en couleur depuis le 2026-08-16 — et
 * c'est une décision datée, pas un oubli. D'où la prop explicite `couleur` :
 * on ne peut pas laisser passer de la couleur sans l'avoir écrit.
 *
 * Le gris est appliqué en CSS et non au fichier : la même image sert aux deux
 * régimes, et on ne stocke pas deux fois le même octet.
 */
export function Photo(
  { src, alt, couleur = false, className, ratio = 'aspect-[3/2]' }:
  { src: string; alt: string; couleur?: boolean; className?: string; ratio?: string },
) {
  return (
    <div className={cn('overflow-hidden rounded-[var(--mode-radius-container)] bg-muted', ratio, className)}>
      <img
        src={src} alt={alt} loading="lazy"
        className={cn('h-full w-full object-cover', !couleur && 'grayscale')}
      />
    </div>
  )
}

/**
 * Un visuel d'ambiance généré. Toujours accompagné de son prompt dans le
 * catalogue : un visuel dont on a perdu le prompt ne se réitère plus.
 */
export function VisuelAmbiance(
  { src, alt, className }: { src: string; alt: string; className?: string },
) {
  return (
    <div className={cn('overflow-hidden rounded-[var(--mode-radius-container)] bg-muted', className)}>
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
    </div>
  )
}
