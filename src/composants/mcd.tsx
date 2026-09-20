import { useMemo } from 'react'
import {
  ReactFlow, Background, Controls, Handle, Position,
  type Node, type Edge, type NodeProps, BackgroundVariant,
} from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import { KeyRound } from 'lucide-react'
import '@xyflow/react/dist/style.css'
import { socle, type EntiteCatalogue } from '@/donnees/socle'

/**
 * Le modèle de données — les tables, leurs champs, et ce qui alimente quoi.
 *
 * Les flèches ne sont pas dessinées à la main : elles sont lues dans les
 * `ref()` du SQL. C'est la seule déclaration de lignage qui ne puisse pas
 * mentir, puisque c'est elle qui fait tourner la transformation — un schéma
 * Visio, lui, a raison le jour où on le dessine.
 */

const LARGEUR = 210
const ENTETE = 34
const LIGNE = 19

function hauteurDe(e: EntiteCatalogue) {
  return ENTETE + Math.min(e.champs.length, 7) * LIGNE + 8
}

function Table({ data }: NodeProps) {
  const e = data as unknown as { entite: EntiteCatalogue }
  const t = e.entite
  const referentiel = t.couche === 'referentiel'
  return (
    <div className="border border-border bg-card" style={{ width: LARGEUR }}>
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-border" />
      <div className={`flex items-center justify-between gap-2 px-2 py-1.5
                       ${referentiel ? 'bg-[var(--gpa-bleu)] text-white' : 'bg-[var(--gpa-lavande)] text-[var(--gpa-bleu)]'}`}>
        <span className="truncate font-mono text-[11.5px] font-semibold">{t.modele}</span>
        <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.08em] opacity-70">
          {referentiel ? 'réf.' : 'socle'}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {t.champs.slice(0, 7).map(c => (
          <li key={c.nom} className="flex items-center gap-1 px-2 py-[2px]">
            {c.cle
              ? <KeyRound className="h-2.5 w-2.5 shrink-0 text-[var(--gpa-rouge)]" aria-hidden />
              : <span className="w-2.5 shrink-0" aria-hidden />}
            <span className="truncate font-mono text-[10px]">{c.nom}</span>
          </li>
        ))}
        {t.champs.length > 7 && (
          <li className="px-2 py-[2px] font-mono text-[9.5px] text-muted-foreground">
            +{t.champs.length - 7} champs
          </li>
        )}
      </ul>
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-border" />
    </div>
  )
}

const TYPES = { table: Table }

export function Mcd() {
  const { noeuds, aretes } = useMemo(() => {
    const n: Node[] = socle.catalogue.entites.map(e => ({
      id: e.modele, type: 'table', position: { x: 0, y: 0 }, data: { entite: e },
    }))
    const connus = new Set(n.map(x => x.id))
    const e: Edge[] = socle.catalogue.relations
      .filter(r => connus.has(r.de) && connus.has(r.vers))
      .map(r => ({
        id: `${r.de}->${r.vers}`, source: r.de, target: r.vers, type: 'smoothstep',
        style: { stroke: 'var(--gpa-bleu)', strokeWidth: 1.3, opacity: 0.55 },
      }))

    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({ rankdir: 'LR', nodesep: 26, ranksep: 110, marginx: 16, marginy: 16 })
    socle.catalogue.entites.forEach(x => g.setNode(x.modele, { width: LARGEUR, height: hauteurDe(x) }))
    e.forEach(a => g.setEdge(a.source, a.target))
    dagre.layout(g)

    return {
      noeuds: n.map(x => {
        const p = g.node(x.id)
        const h = hauteurDe((x.data as { entite: EntiteCatalogue }).entite)
        return { ...x, position: { x: p.x - LARGEUR / 2, y: p.y - h / 2 } }
      }),
      aretes: e,
    }
  }, [])

  return (
    <div style={{ height: 420 }}>
      <ReactFlow
        nodes={noeuds} edges={aretes} nodeTypes={TYPES}
        fitView fitViewOptions={{ padding: 0.1, maxZoom: 1 }}
        minZoom={0.3} maxZoom={1.6}
        nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1}
                    color="var(--color-border-hairline)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
