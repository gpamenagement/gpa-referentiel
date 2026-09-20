import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Les révélations au défilement du site Flowmetrik, portées dans le socle.
 *
 * Le site les tient en CSS pur + un `IntersectionObserver` de six lignes, et
 * cette simplicité est un choix : une bibliothèque d'animation au défilement
 * pèse plus lourd que la page qu'elle anime.
 *
 * Deux décisions du site méritent d'être reprises telles quelles, parce
 * qu'elles ne se devinent pas :
 *
 *  - **`@media (scripting: enabled)`** — le contenu n'est masqué que si le
 *    JavaScript tourne. Sans lui, tout reste visible : pas de page blanche
 *    devant un lecteur d'écran, un moteur d'indexation ou un navigateur dont le
 *    script a échoué. C'est la différence entre une animation et une panne.
 *  - **`unobserve` après le premier passage** — l'élément ne se réanime pas au
 *    défilement inverse. Une page qui rejoue ses entrées à chaque aller-retour
 *    devient insupportable au bout de deux minutes.
 *
 * Le hero du site ne porte JAMAIS `reveal` : il doit s'afficher immédiatement,
 * sinon le plus grand élément visible arrive 600 ms trop tard et la mesure de
 * performance s'effondre.
 */

export function useRevelationAuDefilement(actif = true) {
  const zone = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!actif || !zone.current) return
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (!e.isIntersecting) return
        e.target.classList.add('est-entre')
        // Une seule fois : voir plus haut.
        io.unobserve(e.target)
      }),
      // `-6%` en bas : l'élément se révèle un peu AVANT d'être pleinement
      // visible, sinon l'animation démarre alors qu'on le regarde déjà.
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
    )
    zone.current.querySelectorAll('.reveler, .reveler-cascade').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [actif])
  return zone
}

export function Reveler({ className, children, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('reveler', className)} {...props}>{children}</div>
}

/** Chaque enfant entre à son tour, décalé de 70 ms. */
export function RevelerCascade({ className, children, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('reveler-cascade', className)} {...props}>{children}</div>
}

/** Le survol qui soulève — repris de `.lift` du site. */
export function Souleve({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('souleve', className)}>{children}</div>
}
