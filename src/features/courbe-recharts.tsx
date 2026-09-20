/* react-doctor signale ici un « chargement eager » de Recharts. C'est un faux
   positif assumé : ce fichier N'EST importé que par `lazy()` depuis
   `metriques.tsx`, donc l'import statique de Recharts est précisément ce qui
   fait de lui un morceau séparé. Le rendre dynamique une deuxième fois
   ajouterait un aller-retour réseau sans rien économiser. */
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { ProprietesCourbe } from './metriques'

/**
 * Le corps Recharts, isolé dans son propre module pour être chargé à la
 * demande. Il n'est jamais importé directement : passer par `Courbe`.
 *
 * Monochrome par défaut — la charte réserve les couleurs sémantiques aux
 * statuts de données, jamais à la décoration. Une seule série n'a donc pas
 * besoin de couleur : elle est seule.
 *
 * Le dégradé sous la courbe est le SEUL dégradé autorisé en surface d'app : il
 * dérive de la couleur du trait et s'éteint vers le bas. Tout dégradé qui
 * introduit une teinte absente de la charte est un refus.
 */
export default function CourbeRecharts(
  { donnees, cleX, cleY, accent = false }: Omit<ProprietesCourbe, 'hauteur'>,
) {
  // `--color-trace` : un trait de courbe est un FILET au sens de la charte,
  // soumis au seuil de 3:1. L'aplat d'accent y descend sous le seuil pour
  // FlowImmo, et la courbe devient invisible sur fond clair.
  const trait = accent ? 'var(--color-trace)' : 'var(--foreground)'
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={donnees} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="fm-aire" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trait} stopOpacity={0.16} />
            <stop offset="100%" stopColor={trait} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey={cleX} tickLine={false} axisLine={false}
               tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'Space Grotesk' }} />
        <YAxis tickLine={false} axisLine={false} width={52}
               tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'Space Grotesk' }} />
        <Tooltip
          cursor={{ stroke: 'var(--border)' }}
          contentStyle={{
            background: 'var(--popover)', border: '1px solid var(--border)',
            borderRadius: 'var(--mode-radius-control)', fontSize: 12,
            fontFamily: 'Space Grotesk', color: 'var(--popover-foreground)',
            boxShadow: 'var(--relief-flottant)',
          }}
        />
        <Area type="monotone" dataKey={cleY} stroke={trait} strokeWidth={2} fill="url(#fm-aire)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
