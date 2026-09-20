import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Les fonds à motif — la variante de FOND du circuit gravé.
 *
 * `src/features/circuit.tsx` dessine la même chose au premier plan : pistes,
 * pastilles, modules, en relief, avec un tiret d'accent qui parcourt les
 * pistes. Ici, tout ce qui attire l'œil est retiré. Il ne reste que la
 * gravure, dix fois plus claire, immobile, sans accent — voir les bornes
 * écrites dans `src/styles/trame.css`.
 *
 * **Pourquoi deux dessins et non un seul redimensionné.** Un motif tracé pour
 * une section de 1600 px, recadré dans une carte de 400 px, n'en montre plus
 * qu'un fragment : deux coudes et une pastille, que l'œil lit comme une
 * salissure, pas comme une texture. Les deux dessins ont donc des mailles
 * différentes — `section` respire, `carte` est plus gros et plus simple, avec
 * moins d'éléments et des tracés plus longs.
 *
 * Le troisième usage, la texture des blocs sombres, n'a pas besoin d'un dessin :
 * c'est `.trame-quadrillee`, en CSS pur.
 */

type Echelle = 'section' | 'carte'

export function TrameCircuit(
  { echelle = 'section', estompe = true, className }: {
    echelle?: Echelle
    /** Estompe les bords pour que la trame appartienne à la page. */
    estompe?: boolean
    className?: string
  },
) {
  // `useId` : deux trames sur la même page partageraient sinon leur `<pattern>`,
  // et la seconde hériterait du dessin de la première. Exactement le piège déjà
  // rencontré sur `circuit.tsx`.
  const id = useId().replace(/:/g, '')
  const d = echelle === 'section' ? DESSIN_SECTION : DESSIN_CARTE

  return (
    <svg
      aria-hidden
      className={cn(
        'trame-couche size-full',
        estompe && (echelle === 'section' ? 'trame-estompe' : 'trame-estompe-haut'),
        className,
      )}
    >
      <defs>
        <pattern
          id={`trame-${id}`}
          width={d.pas}
          height={d.pas}
          patternUnits="userSpaceOnUse"
        >
          {/* `vector-effect` : la trame est étirée sur toute la surface de son
              hôte. Sans lui, le trait s'épaissit avec la mise à l'échelle et le
              motif passe de 3 % de contraste à bien plus, sans qu'on ait touché
              une valeur. C'est ce qui rend une trame « soudain trop visible »
              sur grand écran uniquement. */}
          <path
            d={d.chemin}
            fill="none"
            stroke={d.encre}
            strokeWidth={d.trait}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {d.pastilles.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={d.rayon} fill={d.encre} />
          ))}
          {d.plots.map(([x, y, w, h], i) => (
            <rect
              key={i}
              x={x} y={y} width={w} height={h}
              rx={2}
              fill="none"
              stroke={d.encre}
              strokeWidth={d.trait}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#trame-${id})`} />
    </svg>
  )
}

/**
 * L'enveloppe prête à l'emploi : un hôte positionné, sa trame, et le contenu
 * au-dessus. Évite d'avoir à se rappeler `trame-hote` + `trame-couche` à
 * chaque usage — l'oubli de `trame-hote` fait sortir la trame du conteneur et
 * couvrir la page entière, en silence.
 */
export function FondTrame(
  { echelle = 'section', diagonale = false, quadrille = false, inverse = quadrille,
    className, children }: {
    echelle?: Echelle
    /** La bande de lumière large qui empêche le fond d'être plat. */
    diagonale?: boolean
    /** Bloc sombre : quadrillage au lieu du circuit. Un motif de points
        disparaît sur fond noir ; une ligne continue tient. */
    quadrille?: boolean
    /**
     * La surface hôte est sombre, quel que soit le thème de la page.
     *
     * Ce n'est pas déductible : un bloc noir posé dans une page claire n'a
     * aucun `.dark` au-dessus de lui, donc la trame y prend les valeurs
     * claires — un gris pâle qui, sur du noir, crève l'écran au lieu de
     * s'effacer. Par défaut, `quadrille` l'implique : un quadrillage ne
     * s'emploie que sur surface inversée.
     */
    inverse?: boolean
    className?: string
    children?: React.ReactNode
  },
) {
  return (
    <div className={cn('trame-hote', inverse && 'trame-inversee', className)}>
      {quadrille
        ? <div className="trame-couche trame-quadrillee trame-estompe" />
        : <TrameCircuit echelle={echelle} />}
      {diagonale && <div className="trame-couche trame-diagonale" />}
      {children}
    </div>
  )
}

/* ── Les deux dessins ────────────────────────────────────────────────────────

   Chacun est une maille carrée qui se répète. La contrainte de dessin : les
   tracés doivent SORTIR de la maille exactement là où ils y entrent, sinon la
   répétition produit une grille de fragments coupés au lieu d'un réseau
   continu. C'est la seule difficulté réelle de ce fichier, et c'est ce qui
   interdit de dessiner « à l'œil ».
   ────────────────────────────────────────────────────────────────────────── */

type Dessin = {
  pas: number
  trait: number
  rayon: number
  /* L'encre est portée par le DESSIN, pas par le composant. Les deux échelles
     n'ont pas la même densité d'éléments, donc pas la même valeur perçue à
     surface égale : la maille serrée paraît plus foncée. Câbler la même
     variable pour les deux — le bug d'origine — rendait la trame de section
     nettement trop visible, sans que la valeur écrite dans `trame.css` soit
     en cause. */
  encre: string
  chemin: string
  pastilles: Array<[number, number]>
  plots: Array<[number, number, number, number]>
}

/** Maille large et aérée : beaucoup de vide, quelques coudes longs.
    Pour un fond de section pleine largeur. */
const DESSIN_SECTION: Dessin = {
  pas: 160,
  trait: 1,
  rayon: 2,
  encre: 'var(--trame-encre-section)',
  chemin: [
    // Horizontale traversante, avec un coude arrondi au tiers.
    'M0 40 H44 Q56 40 56 52 V96 Q56 108 68 108 H160',
    // Verticale traversante, décalée pour ne pas croiser la première au centre.
    'M112 0 V28 Q112 40 124 40 H160',
    // Antenne courte qui meurt sur une pastille — le détail qui empêche le
    // motif de se lire comme une grille.
    'M0 128 H28',
    'M96 160 V132 Q96 120 84 120 H56',
  ].join(' '),
  pastilles: [[28, 128], [124, 40], [56, 120]],
  plots: [[136, 84, 16, 12]],
}

/** Maille serrée mais avec MOINS d'éléments : les tracés sont plus courts et
    plus épais en proportion, pour rester lisibles dans une carte de 400 px.
    Ce n'est pas le dessin de section réduit — voir la borne 3. */
const DESSIN_CARTE: Dessin = {
  pas: 72,
  trait: 1,
  rayon: 1.6,
  encre: 'var(--trame-encre-carte)',
  chemin: [
    'M0 20 H26 Q36 20 36 30 V52 Q36 62 46 62 H72',
    'M52 0 V14 Q52 24 62 24 H72',
    'M0 56 H16',
  ].join(' '),
  pastilles: [[16, 56], [62, 24]],
  plots: [],
}
