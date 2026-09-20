import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * L'architecture agentique, dessinée comme une carte de circuit imprimé.
 *
 * Pourquoi cette métaphore plutôt qu'un schéma à flèches : un agent n'est pas
 * une étape dans un tuyau, c'est un composant câblé à des sources et à des
 * sorties, et le flux circule dans les deux sens. Une carte le montre d'un coup
 * d'œil ; un diagramme en boîtes demande de lire les libellés.
 *
 * Elle s'inscrit dans la charte sans concession :
 *
 *  - le fond, les pistes gravées, les pastilles et les modules sont **en
 *    relief** — c'est la même grammaire que le reste de l'application, à une
 *    autre échelle ;
 *  - la seule chose qui porte de la couleur est **la donnée qui circule** :
 *    un tiret qui parcourt la piste. C'est un usage exemplaire de l'accent —
 *    il désigne exactement ce qui est vivant, et il occupe moins de 1 % de la
 *    surface ;
 *  - tout le reste est monochrome. En niveaux de gris, la carte reste lisible :
 *    on perd le mouvement, pas la structure.
 */

/** Hauteur d'un module, et écart entre deux. Voir `hauteur` plus bas. */
const HAUTEUR_MODULE = 50
const ECART = 10
const PAS = HAUTEUR_MODULE + ECART

export type Module = {
  cle: string
  titre: string
  detail?: string
  icone?: ReactNode
  /** `attente` grise la pastille, `actif` la fait battre. */
  etat?: 'inactif' | 'attente' | 'actif'
}

export function CircuitAgent(
  { sources, sorties, titre, sousTitre, marque, anime = true, className }: {
    sources: Module[]
    sorties: Module[]
    titre: string
    sousTitre?: string
    marque?: ReactNode
    anime?: boolean
    className?: string
  },
) {
  // `useId` : deux circuits sur la même page partageraient sinon leurs motifs
  // SVG, et le second hériterait des pistes du premier.
  const id = useId().replace(/:/g, '')
  const n = Math.max(sources.length, sorties.length)
  // Le pas est FIXE et partagé entre la pile de modules et les pistes. Le
  // déduire à l'exécution suppose de mesurer, donc de rendre deux fois ; le
  // fixer ici fait tomber les deux sur la même grille par construction, et
  // c'est la seule façon que les pistes rejoignent vraiment les modules.
  const hauteur = n * PAS - ECART

  return (
    <div className={cn('relative overflow-hidden rounded-[var(--mode-radius-container)]',
                       'border border-border bg-secondary relief-creux', className)}>
      {/* --- La carte gravée ------------------------------------------------
          Un motif SVG répété plutôt que des milliers de nœuds : la trame de
          pastilles couvre toute la surface pour le coût d'un seul élément. */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full">
        <defs>
          <pattern id={`grille-${id}`} width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" className="fill-border" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grille-${id})`} opacity="0.7" />
      </svg>

      <div className="relative grid items-stretch gap-4 p-4
                      md:grid-cols-[minmax(0,220px)_1fr_minmax(0,240px)_1fr_minmax(0,220px)]
                      md:gap-0 md:p-6">
        <div className="flex flex-col justify-center" style={{ gap: ECART }}>
          {sources.map(m => <ModuleCircuit key={m.cle} module={m} cote="gauche" />)}
        </div>

        <Pistes id={`g-${id}`} n={n} hauteur={hauteur} anime={anime} sens="entrant" />

        {/* --- Le module central --------------------------------------------
            Plus grand, plus haut, en papier plein : c'est le seul objet de la
            carte qui porte `relief-flottant`, et cela suffit à dire que tout le
            reste lui est branché. */}
        <div className="relative z-10 mx-auto grid w-full place-items-center self-center
                        rounded-[calc(var(--mode-radius-container)*2)] border border-border
                        bg-card p-5 text-center relief-flottant md:order-none">
          {marque && <div className="mb-2.5">{marque}</div>}
          <p className="font-display text-[15px] leading-tight font-bold">{titre}</p>
          {sousTitre && (
            <p className="mt-1 font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground">
              {sousTitre}
            </p>
          )}
          {/* Le connecteur de bas de module — purement graphique, il ancre le
              module dans la carte au lieu de le laisser flotter dessus. */}
          <span aria-hidden className="mt-4 h-1.5 w-2/3 rounded-full bg-secondary relief-creux" />
        </div>

        <Pistes id={`d-${id}`} n={n} hauteur={hauteur} anime={anime} sens="sortant" />

        <div className="flex flex-col justify-center" style={{ gap: ECART }}>
          {sorties.map(m => <ModuleCircuit key={m.cle} module={m} cote="droite" />)}
        </div>
      </div>
    </div>
  )
}

function ModuleCircuit({ module: m, cote }: { module: Module; cote: 'gauche' | 'droite' }) {
  return (
    <div
      style={{ height: HAUTEUR_MODULE }}
      className={cn(
        'flex items-center gap-2.5 rounded-[var(--mode-radius-control)] border border-border',
        'bg-card px-2.5 relief-pose',
        cote === 'droite' && 'flex-row-reverse text-right',
      )}
    >
      {m.icone && (
        <span className="flex size-7 shrink-0 items-center justify-center
                         rounded-[calc(var(--mode-radius-control)-2px)] bg-secondary
                         text-muted-foreground relief-creux [&_svg]:size-3.5">
          {m.icone}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-[10px] font-bold tracking-[0.08em]
                         uppercase">
          {m.titre}
        </span>
        {m.detail && (
          <span className="block truncate text-[11px] text-muted-foreground">{m.detail}</span>
        )}
      </span>
      {/* La pastille d'état. Elle bat quand le module travaille — et c'est
          l'unique endroit, avec les pistes, où l'accent apparaît. */}
      <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full',
        // `--color-trace` et non `--color-accent` : une puce est un filet au
        // sens de la charte, et elle relève du seuil de 3:1. En aplat, le jaune
        // FlowImmo ne tient que 1,82:1 — il disparaîtrait à cette taille.
        m.etat === 'actif' && 'animate-pulse bg-[var(--color-trace)]',
        m.etat === 'attente' && 'bg-muted-foreground/40',
        (!m.etat || m.etat === 'inactif') && 'bg-border')} />
      <span className="sr-only">
        {m.etat === 'actif' ? 'actif' : m.etat === 'attente' ? 'en attente' : 'inactif'}
      </span>
    </div>
  )
}

/**
 * Les pistes gravées, et la donnée qui les parcourt.
 *
 * Le mouvement se fait par `stroke-dashoffset` sur un trait pointillé : une
 * seule propriété animée, sur le GPU, pour autant de pistes qu'on veut. La
 * technique naïve — un point déplacé le long d'un chemin — coûte un calcul de
 * position par image et par point.
 */
function Pistes(
  { id, n, hauteur, anime, sens }: {
    id: string; n: number; hauteur: number; anime: boolean; sens: 'entrant' | 'sortant'
  },
) {
  // Une unité du viewBox = un pixel sur l'axe vertical : les pistes tombent
  // exactement au centre de chaque module, sans mesure ni ajustement à l'œil.
  const H = hauteur
  const chemins = Array.from({ length: n }, (_, i) => {
    const y = i * PAS + HAUTEUR_MODULE / 2
    const yc = H / 2
    // Un coude à angle droit adouci — le tracé d'une vraie piste, qui ne part
    // jamais en diagonale libre.
    // Le coude s'arrondit du côté où il tourne. `Math.sign(0)` vaut 0, donc la
    // piste du milieu reste droite sans cas particulier.
    const s = Math.sign(yc - y)
    return sens === 'entrant'
      ? `M0 ${y} H24 Q36 ${y} 36 ${y + s * 8} V${yc - s * 8} Q36 ${yc} 48 ${yc} H72`
      : `M72 ${y} H48 Q36 ${y} 36 ${y + s * 8} V${yc - s * 8} Q36 ${yc} 24 ${yc} H0`
  })

  return (
    // `preserveAspectRatio="none"` étire le dessin sur un seul axe : sans
    // `vector-effect`, le trait s'épaissit d'autant et les coudes deviennent
    // des taches. C'est ce qui rend ce genre de schéma illisible sans qu'on
    // comprenne pourquoi.
    <svg aria-hidden viewBox={`0 0 72 ${H}`} preserveAspectRatio="none"
         style={{ height: H }} className="hidden w-full self-center md:block">
      {chemins.map((d, i) => (
        <g key={i}>
          {/* La piste gravée : creusée, immobile. */}
          <path d={d} fill="none" className="stroke-border" strokeWidth="2.5"
                vectorEffect="non-scaling-stroke" />
          {/* La donnée qui circule. Le tiret parcourt la piste par décalage —
              une seule propriété animée, quel que soit le nombre de pistes. */}
          {anime && (
            <path
              d={d} fill="none" strokeWidth="2.5" strokeLinecap="round"
              stroke="var(--color-trace)" strokeDasharray="10 62"
              vectorEffect="non-scaling-stroke" className="fm-piste"
              style={{ animationDelay: `${i * 380}ms` }}
            />
          )}
        </g>
      ))}
      <defs>
        <style>{`
          @keyframes fm-flux-${id} { to { stroke-dashoffset: -72; } }
          .fm-piste {
            animation: fm-flux-${id} 2.6s linear infinite;
          }
          /* Le mouvement s'arrête sur demande du système. Une carte de circuit
             qui pulse en continu est exactement le genre d'animation qui
             déclenche un malaise vestibulaire. */
          @media (prefers-reduced-motion: reduce) { .fm-piste { animation: none; opacity: .35 } }
        `}</style>
      </defs>
    </svg>
  )
}
