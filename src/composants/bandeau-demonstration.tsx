import { useEffect, useRef } from 'react'
import { Info } from 'lucide-react'

/**
 * Le bandeau qui dit ce que ce site est.
 *
 * Il n'est pas décoratif, il ne se referme pas, et il est **collé en haut de la
 * fenêtre** : un site public portant le logotype et la charte d'un établissement
 * public, construit sans lui, doit dire d'où viennent ses données à la première
 * ligne de chaque écran. Un visiteur qui arrive par un lien direct sur `#objets`
 * ne lira pas la page méthodologie ; il lira cette ligne.
 *
 * Sa hauteur est **mesurée**, pas déclarée : la latérale et la barre haute s'y
 * collent par `--hauteur-bandeau`, et le texte ne fait pas le même nombre de
 * lignes en 1440 et en 390 px. Une constante en dur laisserait un trou ou un
 * recouvrement sur l'une des deux largeurs, et seule celle qu'on regarde serait
 * corrigée.
 */
export function BandeauDemonstration() {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const poser = () =>
      document.documentElement.style.setProperty('--hauteur-bandeau', `${el.offsetHeight}px`)
    poser()
    const observateur = new ResizeObserver(poser)
    observateur.observe(el)
    return () => observateur.disconnect()
  }, [])

  return (
    <aside
      ref={ref}
      role="note"
      className="sticky top-0 z-[60] flex items-start gap-2.5 border-b-2 border-b-[var(--gpa-rouge)]
                 bg-[var(--gpa-bleu)] px-4 py-2.5 text-white sm:items-center"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" aria-hidden />
      <p className="text-[12.5px] leading-snug">
        <strong className="font-semibold">Démonstration.</strong>{' '}
        Maquette fonctionnelle construite par <strong className="font-semibold">Flowmetrik</strong> à
        partir de <strong className="font-semibold">données publiques uniquement</strong>, en réponse
        à l’appel d’offres n° 202600092 de Grand Paris Aménagement.{' '}
        <span className="text-white/75">
          Aucune donnée interne de l’établissement, aucune connexion à ses systèmes ; les objets de
          données sont des hypothèses de travail, signalées comme telles.
        </span>
      </p>
    </aside>
  )
}
