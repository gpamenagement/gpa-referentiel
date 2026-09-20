import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Le jeu d'icônes animées — trente signes au trait, chacun portant un mouvement
 * qui **dit ce que fait l'action**.
 *
 * La règle qui les tient toutes : le mouvement n'est pas un ornement, il est la
 * définition du verbe. Une flèche de téléchargement descend, une flèche d'envoi
 * part, un rafraîchissement tourne, une recherche balaie. Si l'animation
 * pouvait être remplacée par n'importe quelle autre sans que le sens change,
 * c'est qu'elle ne sert à rien — et elle est alors une distraction.
 *
 * Trois contraintes techniques, chacune pour une raison :
 *
 *  - **elles s'animent au survol et au focus**, pas en boucle. Une icône qui
 *    bouge en permanence dans une barre d'outils attire l'œil quarante fois par
 *    heure pour ne rien dire ;
 *  - **le trait ne s'épaissit jamais** : `vector-effect="non-scaling-stroke"`,
 *    pour qu'une mise à l'échelle ne change pas le poids du dessin ;
 *  - **`prefers-reduced-motion` les fige**, sans les faire disparaître : l'icône
 *    reste lisible dans son état final.
 *
 * Elles héritent de `currentColor` : posées sur une carte inversée, elles
 * passent en papier sans une ligne de plus.
 */

type P = ComponentProps<'svg'> & { taille?: number }

function Svg({ taille = 24, className, children, ...p }: P) {
  return (
    <svg
      width={taille} height={taille} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      vectorEffect="non-scaling-stroke" aria-hidden
      className={cn('fm-ico', className)} {...p}
    >
      {children}
    </svg>
  )
}

/* ── Actions ─────────────────────────────────────────────────────────────── */

export const Telecharger = (p: P) => (
  <Svg {...p}>
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    {/* La flèche descend et revient : c'est le geste du téléchargement. */}
    <g className="a-descend"><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /></g>
  </Svg>
)

export const Televerser = (p: P) => (
  <Svg {...p}>
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    <g className="a-monte"><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /></g>
  </Svg>
)

export const Envoyer = (p: P) => (
  <Svg {...p}>
    {/* L'avion part vers le haut à droite, puis rentre : l'envoi, pas le vol. */}
    <g className="a-part"><path d="M21 3 10.5 13.5" /><path d="M21 3 14.5 21l-4-7.5L3 9.5z" /></g>
  </Svg>
)

export const Rafraichir = (p: P) => (
  <Svg {...p}>
    <g className="a-tourne" style={{ transformOrigin: '12px 12px' }}>
      <path d="M21 12a9 9 0 1 1-3.5-7.1" /><path d="M21 4v5h-5" />
    </g>
  </Svg>
)

export const Chercher = (p: P) => (
  <Svg {...p}>
    {/* La loupe balaie — le geste de fouiller, pas de pointer. */}
    <g className="a-balaie"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 5 5" /></g>
  </Svg>
)

export const Filtrer = (p: P) => (
  <Svg {...p}>
    <path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" />
    <g className="a-glisse"><circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" /></g>
    <g className="a-glisse-2"><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" /></g>
  </Svg>
)

export const Trier = (p: P) => (
  <Svg {...p}>
    <g className="a-monte-court"><path d="M7 20V4" /><path d="m3 8 4-4 4 4" /></g>
    <g className="a-descend-court"><path d="M17 4v16" /><path d="m13 16 4 4 4-4" /></g>
  </Svg>
)

export const Ajouter = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <g className="a-tourne-45" style={{ transformOrigin: '12px 12px' }}>
      <path d="M12 8v8" /><path d="M8 12h8" />
    </g>
  </Svg>
)

export const Supprimer = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h16" /><path d="M10 4h4" />
    {/* Le couvercle se soulève, le corps reste : le geste d'ouvrir la corbeille. */}
    <g className="a-couvercle"><path d="M3 7h18" /></g>
    <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
    <path d="M10 11v6" /><path d="M14 11v6" />
  </Svg>
)

export const Modifier = (p: P) => (
  <Svg {...p}>
    <path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16z" className="a-ecrit" />
    <path d="M14 6l4 4" />
  </Svg>
)

export const Dupliquer = (p: P) => (
  <Svg {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" className="a-decale" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Svg>
)

export const Partager = (p: P) => (
  <Svg {...p}>
    <path d="M8.6 13.5 15.4 17" /><path d="M15.4 7 8.6 10.5" />
    <circle cx="18" cy="5.5" r="2.5" className="a-noeud-1" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" className="a-noeud-2" />
  </Svg>
)

/* ── États et retours ────────────────────────────────────────────────────── */

export const Valide = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    {/* La coche se DESSINE : le trait apparaît de gauche à droite, comme on
        coche à la main. C'est le seul mouvement qui dit « c'est fait ». */}
    <path d="m8 12.5 2.7 2.7L16 9.5" className="a-trace" pathLength={100} />
  </Svg>
)

export const Erreur = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" className="a-secoue" />
    <path d="M12 7.5v5.5" /><path d="M12 16.5h.01" />
  </Svg>
)

export const Alerte = (p: P) => (
  <Svg {...p}>
    <path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <g className="a-clignote"><path d="M12 9v4" /><path d="M12 17h.01" /></g>
  </Svg>
)

export const Chargement = (p: P) => (
  <Svg {...p}>
    <g className="a-rotation" style={{ transformOrigin: '12px 12px' }}>
      <path d="M12 3a9 9 0 0 1 9 9" />
    </g>
    <circle cx="12" cy="12" r="9" opacity=".22" />
  </Svg>
)

export const Notification = (p: P) => (
  <Svg {...p}>
    {/* La cloche sonne : deux oscillations amorties, puis rien. */}
    <g className="a-sonne" style={{ transformOrigin: '12px 4px' }}>
      <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
    </g>
    <path d="M13.7 20a2 2 0 0 1-3.4 0" />
  </Svg>
)

export const Verrou = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="10.5" width="16" height="10.5" rx="2" />
    {/* L'anse se soulève puis retombe : ouvrir, refermer. */}
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" className="a-anse" />
  </Svg>
)

/* ── Données ─────────────────────────────────────────────────────────────── */

export const Croissance = (p: P) => (
  <Svg {...p}>
    <path d="M3 20h18" />
    <path d="m4 16 5-5 4 4 7-8" className="a-trace" pathLength={100} />
    <path d="M16 7h4v4" className="a-pointe" />
  </Svg>
)

export const Barres = (p: P) => (
  <Svg {...p}>
    <path d="M3 20h18" />
    <g className="a-pousse-1"><path d="M7 20v-5" /></g>
    <g className="a-pousse-2"><path d="M12 20V8" /></g>
    <g className="a-pousse-3"><path d="M17 20v-9" /></g>
  </Svg>
)

export const BaseDonnees = (p: P) => (
  <Svg {...p}>
    <ellipse cx="12" cy="5.5" rx="8" ry="3" />
    <path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13" />
    <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" className="a-couche" />
  </Svg>
)

export const Document = (p: P) => (
  <Svg {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" className="a-corne" />
    <g className="a-lignes"><path d="M9 13h6" /><path d="M9 17h4" /></g>
  </Svg>
)

export const Tableau = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9.5h18" />
    <g className="a-colonne"><path d="M9.5 9.5V20" /><path d="M15 9.5V20" /></g>
  </Svg>
)

export const Carte = (p: P) => (
  <Svg {...p}>
    <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 7z" />
    <path d="M9 4v13" /><path d="M15 7v12.5" />
    <g className="a-epingle"><circle cx="12" cy="10" r="2" fill="currentColor" stroke="none" /></g>
  </Svg>
)

/* ── Marque et agents ────────────────────────────────────────────────────── */

export const Agent = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <path d="M12 8V4" /><circle cx="12" cy="3" r="1.2" fill="currentColor" stroke="none" />
    <g className="a-yeux"><path d="M9.5 13.5v1.5" /><path d="M14.5 13.5v1.5" /></g>
  </Svg>
)

export const Etincelle = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9z" className="a-scintille" />
    <path d="M18.5 16.5 19 18.4l1.9.6-1.9.6-.5 1.9-.6-1.9-1.9-.6 1.9-.6z" className="a-scintille-2" />
  </Svg>
)

export const Flux = (p: P) => (
  <Svg {...p}>
    {/* Le trait complet reste visible en fond : sans lui, le pointillé se lit
        comme un trait cassé plutôt que comme une piste parcourue. */}
    <path d="M3 8h6a4 4 0 0 1 4 4 4 4 0 0 0 4 4h4" opacity=".22" />
    <path d="M3 8h6a4 4 0 0 1 4 4 4 4 0 0 0 4 4h4" strokeDasharray="3 7" className="a-flux" />
    <circle cx="3.5" cy="8" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="20.5" cy="16" r="1.5" fill="currentColor" stroke="none" />
  </Svg>
)

export const Connexion = (p: P) => (
  <Svg {...p}>
    <path d="M9.5 14.5 14.5 9.5" />
    <path d="M14 6.5 15.5 5a3.5 3.5 0 1 1 5 5L19 11.5" className="a-branche-1" />
    <path d="M10 17.5 8.5 19a3.5 3.5 0 1 1-5-5L5 12.5" className="a-branche-2" />
  </Svg>
)

export const Horloge = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <g className="a-aiguille" style={{ transformOrigin: '12px 12px' }}><path d="M12 7v5" /></g>
    <g className="a-aiguille-min" style={{ transformOrigin: '12px 12px' }}><path d="M12 12h3.5" /></g>
  </Svg>
)

export const Cible = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" className="a-cercle-1" />
    <circle cx="12" cy="12" r="5" className="a-cercle-2" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" className="a-centre" />
  </Svg>
)
