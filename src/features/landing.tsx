import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Les primitives d'une page d'atterrissage.
 *
 * Elles vivent à part du socle applicatif parce qu'elles obéissent à un autre
 * régime : le **mode éditorial**. Rayon nul, respiration large, entrées de
 * 600 ms. Une page qu'on lit une fois n'a pas les mêmes contraintes qu'un
 * cockpit consulté quarante fois par jour — et confondre les deux donne soit
 * un site sec, soit une application lente.
 */

/* ── Le titre qui monte, ligne par ligne ────────────────────────────────────
   La mécanique du modèle : chaque ligne vit dans un masque, et remonte depuis
   sa propre hauteur. C'est ce qui produit l'impression que le texte se
   « compose » plutôt qu'il n'apparaît.

   Le point qui rend l'effet propre : le masque doit être plus haut que la
   ligne. Un `overflow: hidden` calé au pixel coupe les jambages des lettres
   descendantes — le p de « pilotée » perd sa queue pendant toute l'animation.
   D'où le `pb` compensé par un `mb` négatif. */
export function TitreMasque(
  { lignes, delai = 0, className, tailleClassName = 'text-[clamp(30px,6.4cqw,62px)]' }: {
    /** Chaque ligne porte sa propre clé : une ligne est identifiée par son
        texte, pas par sa position. Réordonner le titre ne doit pas rejouer
        l'animation des lignes qui n'ont pas bougé. */
    lignes: Array<string | { cle: string; contenu: ReactNode }>
    delai?: number
    className?: string
    tailleClassName?: string
  },
) {
  return (
    // La taille est en `cqw` — pourcentage de la largeur du CONTENEUR, pas de
    // la fenêtre. Un hero posé dans une colonne de 570 px sous une barre
    // latérale se croit sinon à 1 280 et déborde sur quatre lignes au lieu de
    // trois. C'est le défaut classique d'une maquette pleine largeur réutilisée
    // dans une mise en page imbriquée.
    <h2 className={cn('font-display leading-[1.06] font-bold tracking-[-0.035em]',
                      tailleClassName, className)}>
      {lignes.map((l, i) => {
        const { cle, contenu } = typeof l === 'string' ? { cle: l, contenu: l } : l
        return (
          <span key={cle} className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
            <span className="anim-ligne block"
                  style={{ animationDelay: `${delai + i * 110}ms` }}>
              {contenu}
            </span>
          </span>
        )
      })}
    </h2>
  )
}

/* ── La lumière balayante ───────────────────────────────────────────────────
   Une bande claire qui traverse le fond en diagonale, lentement. C'est ce qui
   donne au fond blanc du modèle sa profondeur sans y poser une seule couleur.

   Elle est en `background-position` et non en élément déplacé : aucun nœud
   supplémentaire, aucun calcul de disposition, et elle ne peut pas provoquer
   de débordement horizontal. */
export function LumiereBalayante({ className }: { className?: string }) {
  return <div aria-hidden className={cn('lumiere-balayante pointer-events-none absolute inset-0',
                                        className)} />
}

/* ── L'objet qui vole ───────────────────────────────────────────────────────
   Une carte entre depuis un bord, en rotation, et se pose. Le modèle en fait
   son ressort principal : le téléphone, l'enveloppe et les cartes arrivent
   ainsi.

   `depuis` donne la direction, pas une position absolue : la carte part
   toujours de l'extérieur du cadre quelle que soit la taille de l'écran, et
   l'effet ne se casse pas sur mobile. */
export function ObjetVolant(
  { depuis = 'droite', delai = 0, rotation = 8, className, children }: {
    depuis?: 'gauche' | 'droite' | 'bas'
    delai?: number
    rotation?: number
    className?: string
    children: ReactNode
  },
) {
  const dep = depuis === 'gauche' ? '-46%' : depuis === 'droite' ? '46%' : '0%'
  const depY = depuis === 'bas' ? '44%' : '14%'
  return (
    <div
      className={cn('anim-vole', className)}
      style={{
        ['--dx' as string]: dep,
        ['--dy' as string]: depY,
        ['--rot' as string]: `${depuis === 'gauche' ? -rotation : rotation}deg`,
        animationDelay: `${delai}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ── Le compteur ────────────────────────────────────────────────────────────
   Il ne démarre qu'à l'entrée dans la vue — un chiffre qui a fini de compter
   avant qu'on le regarde n'a servi à rien — et il ne compte qu'une fois.

   `prefers-reduced-motion` le pose directement à sa valeur finale : le but est
   de communiquer un chiffre, pas de l'animer. */
export function Compteur(
  { vers, suffixe = '', duree = 1400, decimales = 0, className }: {
    vers: number; suffixe?: string; duree?: number; decimales?: number; className?: string
  },
) {
  // `v` n'est pas une valeur dérivée de `vers` : c'est l'état d'une animation
  // qui converge vers lui. react-doctor signale ici un `no-derived-state` ;
  // c'est un faux positif circonscrit — la copier serait le défaut, l'animer
  // est le but.
  const [v, setV] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const fait = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(vers); return }

    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || fait.current) return
      fait.current = true
      io.disconnect()
      const t0 = performance.now()
      const pas = (t: number) => {
        const p = Math.min((t - t0) / duree, 1)
        // Une décélération cubique : le chiffre ralentit en approchant, ce qui
        // laisse le temps de lire les derniers rangs. Un décompte linéaire
        // s'arrête net et on rate la valeur finale.
        setV(vers * (1 - Math.pow(1 - p, 3)))
        if (p < 1) requestAnimationFrame(pas)
      }
      requestAnimationFrame(pas)
    }, { threshold: 0.4 })

    io.observe(el)
    return () => io.disconnect()
  }, [vers, duree])

  return (
    <span ref={ref} className={cn('metric tabular-nums', className)}>
      {v.toLocaleString('fr-FR', {
        minimumFractionDigits: decimales, maximumFractionDigits: decimales,
      })}
      {suffixe}
    </span>
  )
}

/* ── La scène épinglée ──────────────────────────────────────────────────────
   Le titre reste pendant que le contenu défile à côté. Le modèle l'utilise
   pour enchaîner trois arguments sous une même promesse.

   `position: sticky` et non un calcul de défilement en JavaScript : le
   navigateur le fait sur le fil de composition, donc sans saccade, et il
   dégrade proprement là où il n'est pas supporté — le titre défile
   normalement, la page reste lisible. */
export function ScenePinglee(
  { titre, chapeau, children }: { titre: ReactNode; chapeau?: ReactNode; children: ReactNode },
) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,42%)_1fr] lg:gap-16">
      <div className="lg:sticky lg:top-24 lg:h-fit lg:self-start">
        {titre}
        {chapeau && (
          <p className="mt-4 max-w-[46ch] text-[17px] leading-[1.55] text-muted-foreground">
            {chapeau}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
