import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap, Handle, Position,
  type Node, type Edge, type NodeProps, BackgroundVariant,
} from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import { Workflow, Database, AppWindow, ArrowRight, ArrowLeft, Unlink } from 'lucide-react'
import '@xyflow/react/dist/style.css'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { socle, nombre, applications, type TypeNoeud } from '@/donnees/socle'
import { Titre, Tuiles, Tuile, EtiquettePreuve, Encadre, Provenance } from './_ui'

/**
 * La carte du SI — livrables 14 (matrice de traçabilité) et 16 (analyse d'impact).
 *
 * **Une disposition en couches, pas un nuage de forces.** La chaîne du CCTP a
 * un SENS — processus → objet de données → application — et une simulation de
 * forces le perd : elle place par répulsion, donc elle mélange les trois
 * niveaux et laisse le lecteur reconstituer l'ordre. `dagre` calcule un rang
 * par nœud, React Flow le rend : les processus à gauche, les objets au milieu,
 * les applications à droite, et aucune étiquette n'en recouvre une autre.
 *
 * Ce que la carte doit savoir faire, et que le CCTP nomme :
 *   1. **le parcours dans les deux sens** (livrable 14) — remonter d'un objet
 *      aux processus qui le produisent, descendre aux applications qui le portent ;
 *   2. **l'analyse d'impact** (livrable 16) — marquer un nœud et voir se
 *      détacher tout ce qui en dépend.
 *
 * Le graphe est calculé par `scripts/importer_base_gpa.py` : la topologie est
 * une propriété des données, pas de l'écran qui les montre.
 */

type DonneesNoeud = {
  libelle: string
  genre: TypeNoeud
  preuve: string | null
  logo?: string | null
  etat: 'normal' | 'choisi' | 'amont' | 'aval' | 'efface'
}

const COULEUR: Record<string, { puce: string; bord: string; fond: string }> = {
  processus: { puce: 'bg-[var(--gpa-bleu)]', bord: 'border-[var(--gpa-bleu)]', fond: 'bg-[var(--gpa-lavande)]' },
  objet: { puce: 'bg-[var(--gpa-rouge)]', bord: 'border-[var(--gpa-rouge)]', fond: 'bg-card' },
  application: { puce: 'bg-[var(--gpa-vert)]', bord: 'border-[var(--gpa-vert)]', fond: 'bg-card' },
}

const ICONE: Record<string, typeof Workflow> = {
  processus: Workflow,
  objet: Database,
  application: AppWindow,
}

const LIBELLE_GENRE: Record<string, string> = {
  processus: 'Processus métier',
  objet: 'Objet de données',
  application: 'Application',
}

const LARGEUR = 236
const HAUTEUR = 46

function NoeudSI({ data }: NodeProps) {
  const d = data as DonneesNoeud
  const c = COULEUR[d.genre]
  const Icone = ICONE[d.genre]
  const marque = d.etat === 'choisi'
  return (
    <div
      className={[
        'flex items-center gap-2 border-l-[3px] border border-border px-2.5 py-2',
        'transition-opacity duration-150',
        c.bord, c.fond,
        marque ? 'ring-2 ring-[var(--gpa-bleu)]' : '',
        d.etat === 'efface' ? 'opacity-25' : 'opacity-100',
      ].join(' ')}
      style={{ width: LARGEUR, height: HAUTEUR }}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-border" />
      {d.logo
        ? <img src={d.logo} alt="" className="h-5 w-5 shrink-0 object-contain" />
        : <Icone className="h-4 w-4 shrink-0 text-muted-foreground" />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] leading-tight font-medium" title={d.libelle}>{d.libelle}</p>
        <p className="truncate text-[10px] leading-tight text-muted-foreground">
          {d.etat === 'amont' ? 'en amont' : d.etat === 'aval' ? 'en aval' : LIBELLE_GENRE[d.genre]}
        </p>
      </div>
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-border" />
    </div>
  )
}

const TYPES_DE_NOEUD = { si: NoeudSI }

/** Dagre place les nœuds ; React Flow ne fait que les rendre. */
function disposer(noeuds: Node[], aretes: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 10, ranksep: 120, marginx: 16, marginy: 16 })
  noeuds.forEach(n => g.setNode(n.id, { width: LARGEUR, height: HAUTEUR }))
  aretes.forEach(a => g.setEdge(a.source, a.target))
  dagre.layout(g)
  return noeuds.map(n => {
    const p = g.node(n.id)
    // Dagre donne un CENTRE, React Flow attend un coin haut-gauche. Confondre
    // les deux décale tout d'une demi-boîte — assez pour que les arêtes ne
    // touchent plus les nœuds, sans que rien ne le signale.
    return { ...n, position: { x: p.x - LARGEUR / 2, y: p.y - HAUTEUR / 2 } }
  })
}

export default function CarteSi() {
  const [caches, setCaches] = useState<Set<TypeNoeud>>(new Set())
  const [selection, setSelection] = useState<string | null>(null)

  const logoDe = useMemo(() => {
    const m = new Map<string, string | null>()
    for (const a of applications) m.set(a.nom, a.logo)
    return m
  }, [])

  const { noeudsBruts, aretesBrutes, orphelins } = useMemo(() => {
    const gardes = socle.graphe.noeuds.filter(n => !caches.has(n.type))
    const ids = new Set(gardes.map(n => n.id))
    const liens = socle.graphe.aretes.filter(a => ids.has(a.source) && ids.has(a.cible))
    const relies = new Set(liens.flatMap(a => [a.source, a.cible]))
    return {
      noeudsBruts: gardes.filter(n => relies.has(n.id)),
      orphelins: gardes.filter(n => !relies.has(n.id)),
      aretesBrutes: liens,
    }
  }, [caches])

  /** Le voisinage du nœud choisi, dans les DEUX sens. */
  const voisinage = useMemo(() => {
    if (!selection) return null
    const amont = new Set<string>()
    const aval = new Set<string>()
    for (const a of socle.graphe.aretes) {
      if (a.cible === selection) amont.add(a.source)
      if (a.source === selection) aval.add(a.cible)
    }
    return { amont, aval, tout: new Set([selection, ...amont, ...aval]) }
  }, [selection])

  // La disposition ne dépend QUE de la topologie : elle est calculée une fois
  // par filtre, et la sélection ne la recalcule pas — sinon le graphe sauterait
  // à chaque clic, et on perdrait ce qu'on était en train de suivre.
  const places = useMemo(() => {
    const n: Node[] = noeudsBruts.map(x => ({
      id: x.id,
      type: 'si',
      position: { x: 0, y: 0 },
      data: { libelle: x.libelle, genre: x.type, preuve: x.preuve,
              logo: x.type === 'application' ? logoDe.get(x.libelle) ?? null : null,
              etat: 'normal' } satisfies DonneesNoeud,
    }))
    const e: Edge[] = aretesBrutes.map(a => ({
      id: `${a.source}->${a.cible}`, source: a.source, target: a.cible, type: 'smoothstep',
    }))
    return { noeuds: disposer(n, e), aretes: e }
  }, [noeudsBruts, aretesBrutes, logoDe])

  const noeuds = useMemo(() => places.noeuds.map(n => {
    let etat: DonneesNoeud['etat'] = 'normal'
    if (voisinage) {
      if (n.id === selection) etat = 'choisi'
      else if (voisinage.amont.has(n.id)) etat = 'amont'
      else if (voisinage.aval.has(n.id)) etat = 'aval'
      else etat = 'efface'
    }
    return { ...n, data: { ...(n.data as DonneesNoeud), etat } }
  }), [places.noeuds, voisinage, selection])

  const aretes = useMemo(() => places.aretes.map(a => {
    const dedans = !voisinage || (voisinage.tout.has(a.source) && voisinage.tout.has(a.target))
    return {
      ...a,
      animated: Boolean(voisinage) && dedans,
      style: {
        stroke: dedans ? 'var(--gpa-bleu)' : 'var(--color-border-hairline)',
        strokeWidth: dedans ? 1.6 : 1,
        opacity: dedans ? 0.8 : 0.25,
      },
    }
  }), [places.aretes, voisinage])

  const auClic = useCallback((_: unknown, n: Node) => {
    setSelection(s => (s === n.id ? null : n.id))
  }, [])

  const choisi = selection ? socle.graphe.noeuds.find(n => n.id === selection) ?? null : null
  const libelleDe = (id: string) => socle.graphe.noeuds.find(n => n.id === id)?.libelle ?? id

  return (
    <div>
      <Titre surtitre="Livrables 14 et 16"
             note="La chaîne du CCTP, disposée en couches : processus à gauche, objets de données au milieu, applications à droite. Les fonctionnalités, les interfaces et les règles de gestion sont les trois maillons que les ateliers ajouteront — la carte les attend, elle ne les invente pas.">
        Carte du système d’information
      </Titre>

      <Tuiles>
        <Tuile valeur={nombre(socle.compteurs.noeuds)} libelle="Nœuds" />
        <Tuile valeur={nombre(socle.compteurs.aretes)} libelle="Liens" />
        <Tuile valeur={nombre(socle.compteurs.orphelins)} libelle="Nœuds orphelins" ton="accent"
               precision="aucun lien connu — la première chose à traiter en atelier" />
        <Tuile valeur="3 / 6" libelle="Maillons renseignés"
               precision="sur les six que le CCTP demande" />
      </Tuiles>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(['processus', 'objet', 'application'] as TypeNoeud[]).map(t => {
          const actif = !caches.has(t)
          const n = socle.graphe.noeuds.filter(x => x.type === t).length
          const Icone = ICONE[t]
          return (
            <Button key={t} variant={actif ? 'secondaire' : 'contour'} taille="sm"
                    onClick={() => setCaches(s => {
                      const suivant = new Set(s)
                      if (suivant.has(t)) suivant.delete(t); else suivant.add(t)
                      return suivant
                    })}>
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${COULEUR[t].puce}`} aria-hidden />
              <Icone className="h-3.5 w-3.5" aria-hidden />
              {LIBELLE_GENRE[t]} ({n})
            </Button>
          )
        })}
        {selection && (
          <Button variant="contour" taille="sm" onClick={() => setSelection(null)}>
            Tout réafficher
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
        <Card className="overflow-hidden p-0">
          {/* Une colonne de 27 processus fait ~1 400 px de haut : un `fitView` sans
              plancher la réduirait à 30 % et rendrait chaque étiquette illisible.
              On plafonne donc la réduction (`minZoom` du fit) et on laisse le
              lecteur naviguer — une cartographie se parcourt, elle ne se regarde
              pas d'un seul coup d'œil. */}
          <div style={{ height: 720 }}>
            <ReactFlow
              nodes={noeuds}
              edges={aretes}
              nodeTypes={TYPES_DE_NOEUD}
              onNodeClick={auClic}
              onPaneClick={() => setSelection(null)}
              fitView
              fitViewOptions={{ padding: 0.08, minZoom: 0.62, maxZoom: 1 }}
              minZoom={0.15}
              maxZoom={2.5}
              proOptions={{ hideAttribution: false }}
              nodesDraggable={false}
              nodesConnectable={false}
            >
              <Background variant={BackgroundVariant.Dots} gap={22} size={1}
                          color="var(--color-border-hairline)" />
              <Controls showInteractive={false} />
              <MiniMap pannable zoomable style={{ width: 132, height: 96 }}
                       nodeColor={n => {
                         const g = (n.data as DonneesNoeud).genre
                         return g === 'processus' ? '#23145F' : g === 'objet' ? '#EA515A' : '#789983'
                       }} />
            </ReactFlow>
          </div>
        </Card>

        <Card className="p-4">
          {!choisi && (
            <>
              <p className="gpa-surtitre">Analyse d’impact</p>
              <span className="gpa-filet" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Cliquez un nœud : la carte détache son voisinage, et ce panneau donne ce qui le
                produit (amont) et ce qui en dépend (aval). C’est le même geste qui répond à
                « qui casse si cette application s’arrête ? » et à « d’où vient cette donnée ? ».
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {(['processus', 'objet', 'application'] as TypeNoeud[]).map(t => {
                  const Icone = ICONE[t]
                  return (
                    <li key={t} className="flex items-center gap-2">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${COULEUR[t].puce}`} aria-hidden />
                      <Icone className="h-4 w-4 text-muted-foreground" aria-hidden />
                      <span className="text-muted-foreground">{LIBELLE_GENRE[t]}</span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {choisi && voisinage && (
            <>
              <p className="gpa-surtitre">{LIBELLE_GENRE[choisi.type] ?? choisi.type}</p>
              <p className="font-display text-[18px] leading-tight font-medium text-[var(--gpa-bleu)]">
                {choisi.libelle}
              </p>
              <span className="gpa-filet" aria-hidden />
              <EtiquettePreuve preuve={choisi.preuve} />

              <div className="mt-4">
                <p className="gpa-surtitre flex items-center gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> En amont — {voisinage.amont.size}
                </p>
                {voisinage.amont.size === 0
                  ? <p className="mt-1 text-sm text-muted-foreground">rien de connu</p>
                  : <ul className="mt-1 space-y-1 text-sm">
                      {[...voisinage.amont].map(id => (
                        <li key={id}>
                          <button type="button" className="text-left underline underline-offset-4"
                                  onClick={() => setSelection(id)}>{libelleDe(id)}</button>
                        </li>
                      ))}
                    </ul>}
              </div>

              <div className="mt-4">
                <p className="gpa-surtitre flex items-center gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden /> En aval — {voisinage.aval.size}
                </p>
                {voisinage.aval.size === 0
                  ? <p className="mt-1 text-sm text-muted-foreground">rien de connu</p>
                  : <ul className="mt-1 space-y-1 text-sm">
                      {[...voisinage.aval].map(id => (
                        <li key={id}>
                          <button type="button" className="text-left underline underline-offset-4"
                                  onClick={() => setSelection(id)}>{libelleDe(id)}</button>
                        </li>
                      ))}
                    </ul>}
              </div>
            </>
          )}
        </Card>
      </div>

      {orphelins.length > 0 && (
        <section className="mt-5">
          <p className="gpa-surtitre flex items-center gap-1.5">
            <Unlink className="h-3.5 w-3.5" aria-hidden /> Sans lien connu — {orphelins.length}
          </p>
          <span className="gpa-filet" aria-hidden />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {orphelins.map(o => (
              <Card key={o.id} profondeur="plat" className="flex items-center gap-2 p-2.5">
                <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${COULEUR[o.type].puce}`} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[13px]" title={o.libelle}>{o.libelle}</span>
                {o.preuve?.includes('hypothèse') && <Badge ton="alerte">hyp.</Badge>}
              </Card>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Un nœud sans arête sort de la disposition : la placer parmi les autres l’étirerait sans
            rien apprendre. Ce sont les applications que rien ne relie encore à un objet de données.
          </p>
        </section>
      )}

      <Encadre titre="Ce que la carte n’a pas encore" ton="accent">
        <p>
          Les <strong>fonctionnalités opérationnelles</strong>, les <strong>interfaces</strong> et
          les <strong>règles de gestion</strong>. Le compteur d’interfaces affiche zéro et non une
          estimation : un chiffre inventé sur une cartographie est plus coûteux qu’une case vide.
          Les {nombre(socle.compteurs.orphelins)} nœuds orphelins sont, eux, un résultat.
        </p>
      </Encadre>

      <Provenance source={socle.source} date={socle.genere_le} />
    </div>
  )
}
