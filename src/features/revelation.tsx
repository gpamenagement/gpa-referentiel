import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * La révélation — la transition d'étape en deux temps.
 *
 *   1. la page s'assombrit fortement, jusqu'à ce que le contenu ne soit plus
 *      qu'un souvenir de sa propre forme ;
 *   2. la carte choisie **grandit depuis sa position** vers le centre, en
 *      papier plein, et joue son animation.
 *
 * Ce qui la rend juste, c'est le point de départ : la carte ne surgit pas du
 * centre, elle part d'où l'utilisateur vient de cliquer. Le regard n'a pas à
 * chercher — il est déjà là. Une modale qui apparaît au centre oblige à
 * retrouver le fil ; celle-ci le continue.
 *
 * Deux techniques, et elles règlent chacune un problème réel :
 *
 * **`<dialog>` natif** plutôt qu'un div en `position: fixed`. Il apporte le
 * piège de focus, la fermeture par Échap et l'inertie de l'arrière-plan sans
 * une ligne de code — trois choses qu'une modale maison rate presque toujours,
 * et qui la rendent inutilisable au clavier. Il vit en outre dans la couche du
 * dessus, donc aucune guerre de `z-index`.
 *
 * **FLIP** pour le déplacement : on mesure le rectangle de départ AVANT la
 * peinture, on pose l'élément à cette place, puis on le laisse aller à sa place
 * finale. Mesurer après produirait un saut d'une image — 16 ms, parfaitement
 * visible, et qui ne se reproduit pas quand on ralentit pour le chercher.
 */

export function Revelation(
  { ouvert, depuis, onFerme, duree = 620, titre = 'Étape suivante', children }: {
    ouvert: boolean
    /** L'élément d'où part la carte — typiquement celui qu'on vient de choisir. */
    depuis: HTMLElement | null
    onFerme?: () => void
    duree?: number
    /** Nom accessible de la boîte de dialogue. Sans lui, elle s'annonce « dialogue ». */
    titre?: string
    children: ReactNode
  },
) {
  const [arrive, setArrive] = useState(false)
  const boite = useRef<HTMLDialogElement>(null)
  const carte = useRef<HTMLDivElement>(null)

  // Le rappel de fermeture est lu par référence : le mettre en dépendance de
  // l'effet réabonnerait l'écouteur à chaque rendu du parent.
  const fermer = useRef(onFerme)
  useEffect(() => { fermer.current = onFerme })

  useLayoutEffect(() => {
    const d = boite.current
    if (!d) return
    if (!ouvert) { setArrive(false); return }

    // `showModal` et non `show` : c'est lui qui pose le piège de focus, rend
    // le reste de la page inerte et active la fermeture par Échap.
    if (!d.open) d.showModal()

    const el = carte.current
    const source = depuis?.getBoundingClientRect()
    if (el && source) {
      const cible = el.getBoundingClientRect()
      // Le départ s'exprime comme une TRANSFORMATION de l'arrivée, et non par
      // des coordonnées absolues : une transformation n'entraîne aucun calcul
      // de disposition, donc l'animation tient les 60 images par seconde même
      // sur une page chargée.
      const dx = source.left + source.width / 2 - (cible.left + cible.width / 2)
      const dy = source.top + source.height / 2 - (cible.top + cible.height / 2)
      const k = Math.max(source.width / cible.width, 0.1)
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${k})`
      el.style.opacity = '0.4'
    }
    // Deux images d'attente : une seule suffit en théorie, deux survivent à un
    // navigateur qui regroupe les changements de style.
    //
    // Les deux images sont annulées au démontage : sans ça, un composant démonté
    // entre les deux trames appelle `setArrive` sur un état qui n'existe plus.
    // Le défaut vient du socle — il y est encore.
    let interne = 0
    const externe = requestAnimationFrame(() => {
      interne = requestAnimationFrame(() => setArrive(true))
    })
    return () => {
      cancelAnimationFrame(externe)
      if (interne) cancelAnimationFrame(interne)
    }
  }, [ouvert, depuis])

  // La sortie se joue avant la fermeture réelle, sinon la transition n'existe
  // que dans un sens et le retour est un clignotement.
  useEffect(() => {
    const d = boite.current
    if (!d || ouvert || !d.open) return
    const t = setTimeout(() => d.close(), duree)
    return () => clearTimeout(t)
  }, [ouvert, duree])

  return (
    <dialog
      ref={boite}
      aria-label={titre}
      // Échap déclenche `cancel` : on l'intercepte pour jouer la sortie plutôt
      // que de laisser le navigateur fermer d'un coup.
      onCancel={e => { e.preventDefault(); fermer.current?.() }}
      // Clic sur le fond = fermeture. react-doctor signale ici un gestionnaire
      // de clic sans équivalent clavier ; c'est un faux positif circonscrit :
      // l'équivalent clavier d'un `<dialog>` est Échap, et il est câblé
      // au-dessus par `onCancel`. Ajouter un bouton plein écran pour satisfaire
      // la règle mettrait une cible focusable et annoncée devant le contenu —
      // le remède serait pire que le mal.
      onClick={e => { if (e.target === boite.current) fermer.current?.() }}
      className={cn(
        'm-0 grid size-full max-h-none max-w-none place-items-center bg-transparent p-0',
        'backdrop:bg-neutral-950 backdrop:transition-opacity backdrop:duration-[var(--duree)]',
        arrive ? 'backdrop:opacity-[0.92]' : 'backdrop:opacity-0',
      )}
      style={{ ['--duree' as string]: `${duree}ms` }}
    >
      <div
        ref={carte}
        className={cn(
          'grid size-[200px] place-items-center rounded-[calc(var(--mode-radius-container)*3)]',
          'bg-white text-neutral-950 relief-flottant sm:size-[240px]',
          'transition-[transform,opacity] ease-[var(--motion-ease-out)]',
          'duration-[var(--duree)] will-change-transform',
        )}
        style={arrive ? { transform: 'translate(0,0) scale(1)', opacity: 1 } : undefined}
      >
        {children}
      </div>
    </dialog>
  )
}

/**
 * La marque qui se dessine, au trait, dans la carte de révélation.
 *
 * Le SVG animé de la charte porte déjà son animation en SMIL : on le sert tel
 * quel plutôt que de redessiner le signe — un signe de marque approximé est un
 * signe de marque trahi.
 *
 * `key` et l'URL changent à chaque ouverture pour forcer le rechargement : une
 * animation SMIL ne rejoue pas à la deuxième ouverture, et la carte s'afficherait
 * sur la dernière image du tracé.
 */
export function MarqueQuiSeDessine({ cle }: { cle: string | number }) {
  return (
    <img key={cle} src={`/brand/logo/flowmetrik-mark-draw-animated-ink.svg?r=${cle}`}
         alt="" aria-hidden className="h-16 w-auto" />
  )
}
