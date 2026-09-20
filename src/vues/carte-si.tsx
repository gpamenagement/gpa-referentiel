import { useEffect, useMemo, useRef, useState } from 'react'
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
  type Simulation, type SimulationNodeDatum, type SimulationLinkDatum,
} from 'd3-force'
import { select } from 'd3-selection'
import { zoom as d3zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { socle, nombre, type Noeud, type TypeNoeud } from '@/donnees/socle'
import { Titre, Tuiles, Tuile, EtiquettePreuve, Encadre, Provenance } from './_ui'

/**
 * La carte du SI — livrables 14 (matrice de traçabilité) et 16 (analyse d'impact).
 *
 * Deux choses la distinguent d'un joli nuage de points, et ce sont les deux
 * qu'un référentiel doit savoir faire :
 *
 *   1. **le parcours dans les deux sens** — on sélectionne un objet de données et
 *      on remonte aux processus qui le produisent, ou on descend aux applications
 *      qui le portent. C'est le livrable 14, mot pour mot ;
 *   2. **l'analyse d'impact** — le voisinage du nœud sélectionné est mis en
 *      évidence, le reste s'efface. C'est le livrable 16.
 *
 * Le graphe est calculé par `scripts/importer_base_gpa.py`, pas ici : la
 * topologie est une propriété des données. d3 ne fait que placer les nœuds, et
 * React les dessine — donc aucune couleur n'est écrite en dur, elles viennent
 * toutes des jetons de la charte.
 */

type N = Noeud & SimulationNodeDatum
type L = SimulationLinkDatum<N> & { type: string }

const TYPES: { cle: TypeNoeud; libelle: string; classe: string }[] = [
  { cle: 'processus', libelle: 'Processus métier', classe: 'fill-[var(--gpa-bleu)]' },
  { cle: 'objet', libelle: 'Objet de données', classe: 'fill-[var(--gpa-rouge)]' },
  { cle: 'application', libelle: 'Application', classe: 'fill-[var(--gpa-vert)]' },
]

const RAYON: Record<string, number> = { processus: 7, objet: 10, application: 8 }

export default function CarteSi() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [caches, setCaches] = useState<Set<TypeNoeud>>(new Set())
  const [selection, setSelection] = useState<string | null>(null)
  const [transformation, setTransformation] = useState(zoomIdentity)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const largeur = 980
  const hauteur = 680
  /** La bande basse est réservée aux orphelins : le graphe ne s'y étend pas. */
  const zoneGraphe = 520

  /** Le sous-graphe affiché. Filtrer les nœuds sans filtrer les arêtes
   *  laisserait des arêtes pendantes — invisibles, et fatales à la simulation. */
  const { noeuds, aretes, orphelins } = useMemo(() => {
    const gardes = socle.graphe.noeuds.filter(n => !caches.has(n.type))
    const ids = new Set(gardes.map(n => n.id))
    const liens = socle.graphe.aretes.filter(a => ids.has(a.source) && ids.has(a.cible))
    const relies = new Set(liens.flatMap(a => [a.source, a.cible]))

    // Les orphelins sortent de la simulation. Un nœud sans arête n'est soumis
    // qu'à la répulsion : il part à l'infini, et le recadrage qui le rattrape
    // écrase tout le reste en une bouillie illisible. Ils sont rangés à part,
    // en bas, sous leur propre libellé — ce qui est aussi leur sens : ce sont
    // les applications que rien ne relie encore à un objet de données.
    return {
      noeuds: gardes.filter(n => relies.has(n.id)).map(n => ({ ...n })) as N[],
      orphelins: gardes.filter(n => !relies.has(n.id)),
      aretes: liens.map(a => ({ source: a.source, target: a.cible, type: a.type })) as unknown as L[],
    }
  }, [caches])

  /** Le voisinage du nœud sélectionné, dans les DEUX sens. */
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

  useEffect(() => {
    const sim: Simulation<N, L> = forceSimulation<N>(noeuds)
      .force('lien', forceLink<N, L>(aretes).id(d => d.id).distance(110).strength(0.45))
      .force('repulsion', forceManyBody().strength(-900).distanceMax(420))
      .force('centre', forceCenter(largeur / 2, zoneGraphe / 2))
      // Le rayon de collision tient compte d'une PART de la largeur d'étiquette :
      // deux disques distants de 20 px ne se chevauchent pas, mais leurs
      // libellés, si — et c'est le libellé qu'on lit.
      .force('collision', forceCollide<N>()
        .radius(d => RAYON[d.type] + 14 + Math.min(d.libelle.length, 30) * 1.1))
      .stop()

    // 300 passes d'un coup, puis on dessine : une animation de mise en place
    // n'apporte rien à la lecture d'une cartographie, et elle empêche de
    // cliquer pendant deux secondes.
    sim.tick(300)

    // Recadrage : la simulation ne connaît pas le cadre, et une force de
    // centrage ne garantit pas que tout y entre. Sans ce pas, les nœuds des
    // bords sortent du viewBox — ils ne sont pas absents, ils sont coupés, et
    // rien ne le signale puisque le SVG ne déborde pas.
    const ns = sim.nodes()
    const xs = ns.map(n => n.x ?? 0); const ys = ns.map(n => n.y ?? 0)
    const marge = 80
    const minX = Math.min(...xs); const maxX = Math.max(...xs)
    const minY = Math.min(...ys); const maxY = Math.max(...ys)
    const kx = Math.min((largeur - 2 * marge - 140) / Math.max(maxX - minX, 1), 2.2)
    const ky = Math.min((zoneGraphe - 2 * marge) / Math.max(maxY - minY, 1), 2.2)
    const p: Record<string, { x: number; y: number }> = {}
    for (const n of ns) {
      p[n.id] = {
        x: marge + ((n.x ?? 0) - minX) * kx,
        y: marge + ((n.y ?? 0) - minY) * ky,
      }
    }
    setPositions(p)
    return () => { sim.stop() }
  }, [noeuds, aretes])

  useEffect(() => {
    if (!svgRef.current) return
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 4])
      .on('zoom', (e: D3ZoomEvent<SVGSVGElement, unknown>) => setTransformation(e.transform))
    select(svgRef.current).call(z)
    return () => { select(svgRef.current as SVGSVGElement).on('.zoom', null) }
  }, [])

  const noeudSelectionne = selection
    ? socle.graphe.noeuds.find(n => n.id === selection) ?? null
    : null
  const libelleDe = (id: string) => socle.graphe.noeuds.find(n => n.id === id)?.libelle ?? id

  return (
    <div>
      <Titre surtitre="Livrables 14 et 16"
             note="La chaîne du CCTP, telle qu'elle est aujourd'hui : processus → objet de données → application. Les fonctionnalités, les interfaces et les règles de gestion sont les trois maillons que les ateliers ajouteront — la carte les attend, elle ne les invente pas.">
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
        {TYPES.map(t => {
          const actif = !caches.has(t.cle)
          const n = socle.graphe.noeuds.filter(x => x.type === t.cle).length
          return (
            <Button key={t.cle} variant={actif ? 'secondaire' : 'contour'} taille="sm"
                    onClick={() => setCaches(s => {
                      const suivant = new Set(s)
                      if (suivant.has(t.cle)) suivant.delete(t.cle); else suivant.add(t.cle)
                      return suivant
                    })}>
              <svg width="10" height="10" aria-hidden><circle cx="5" cy="5" r="5" className={t.classe} /></svg>
              {t.libelle} ({n})
            </Button>
          )
        })}
        {selection && (
          <Button variant="contour" taille="sm" onClick={() => setSelection(null)}>
            Tout réafficher
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          les processus prennent leur nom au clic — vingt-sept étiquettes d’un coup ne se lisent pas
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden p-0">
          <svg ref={svgRef} viewBox={`0 0 ${largeur} ${hauteur}`} role="img"
               aria-label="Carte du système d'information : processus, objets de données et applications"
               className="block h-[680px] w-full touch-none bg-card">
            <g transform={transformation.toString()}>
              {aretes.map((a, i) => {
                const s = typeof a.source === 'object' ? (a.source as N).id : String(a.source)
                const c = typeof a.target === 'object' ? (a.target as N).id : String(a.target)
                const ps = positions[s]; const pc = positions[c]
                if (!ps || !pc) return null
                const dedans = !voisinage || (voisinage.tout.has(s) && voisinage.tout.has(c))
                return (
                  <line key={i} x1={ps.x} y1={ps.y} x2={pc.x} y2={pc.y}
                        className={dedans ? 'stroke-[var(--gpa-bleu)]' : 'stroke-border'}
                        strokeWidth={dedans ? 1.4 : 0.8} opacity={dedans ? 0.55 : 0.18} />
                )
              })}
              {orphelins.length > 0 && (
                <g>
                  <line x1={40} y1={zoneGraphe + 30} x2={largeur - 40} y2={zoneGraphe + 30}
                        className="stroke-border" strokeWidth={1} />
                  <text x={40} y={zoneGraphe + 22}
                        className="fill-muted-foreground font-sans text-[11px] uppercase tracking-[0.1em]">
                    sans lien connu — {orphelins.length}
                  </text>
                  {orphelins.map((n, i) => {
                    const parLigne = 4
                    const x = 46 + (i % parLigne) * ((largeur - 92) / parLigne)
                    const y = zoneGraphe + 58 + Math.floor(i / parLigne) * 30
                    const classe = TYPES.find(t => t.cle === n.type)?.classe ?? 'fill-muted'
                    const dedans = !voisinage || voisinage.tout.has(n.id)
                    return (
                      <g key={n.id} transform={`translate(${x},${y})`} opacity={dedans ? 1 : 0.2}
                         className="cursor-pointer"
                         onClick={() => setSelection(n.id === selection ? null : n.id)}>
                        <circle r={6} className={classe} stroke="white" strokeWidth={1.5} />
                        <text x={12} y={4} className="pointer-events-none fill-muted-foreground font-sans text-[11px]">
                          {n.libelle.length > 26 ? `${n.libelle.slice(0, 25)}…` : n.libelle}
                        </text>
                      </g>
                    )
                  })}
                </g>
              )}

              {noeuds.map(n => {
                const p = positions[n.id]
                if (!p) return null
                const dedans = !voisinage || voisinage.tout.has(n.id)
                const classe = TYPES.find(t => t.cle === n.type)?.classe ?? 'fill-muted'
                return (
                  <g key={n.id} transform={`translate(${p.x},${p.y})`}
                     opacity={dedans ? 1 : 0.2} className="cursor-pointer"
                     onClick={() => setSelection(n.id === selection ? null : n.id)}>
                    <circle r={RAYON[n.type] ?? 7} className={classe}
                            stroke={n.id === selection ? 'var(--gpa-bleu)' : 'white'}
                            strokeWidth={n.id === selection ? 3 : 1.5} />
                    {(n.type !== 'processus' || (voisinage?.tout.has(n.id) ?? false)) && (
                      <text x={(RAYON[n.type] ?? 7) + 5} y={4}
                            className="pointer-events-none fill-foreground font-sans text-[11px]">
                        {n.libelle.length > 30 ? `${n.libelle.slice(0, 29)}…` : n.libelle}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          </svg>
        </Card>

        <Card className="p-4">
          {!noeudSelectionne && (
            <>
              <p className="gpa-surtitre">Analyse d’impact</p>
              <span className="gpa-filet" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Sélectionnez un nœud : la carte ne garde que son voisinage, et ce panneau donne ce
                qui le produit (amont) et ce qui en dépend (aval). C’est le même geste qui répond à
                « qui casse si cette application s’arrête ? » et à « d’où vient cette donnée ? ».
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Molette pour zoomer, glisser pour déplacer.
              </p>
            </>
          )}

          {noeudSelectionne && voisinage && (
            <>
              <p className="gpa-surtitre">
                {TYPES.find(t => t.cle === noeudSelectionne.type)?.libelle ?? noeudSelectionne.type}
              </p>
              <p className="font-display text-[18px] leading-tight font-medium text-[var(--gpa-bleu)]">
                {noeudSelectionne.libelle}
              </p>
              <span className="gpa-filet" aria-hidden />
              <EtiquettePreuve preuve={noeudSelectionne.preuve} />

              <div className="mt-4">
                <p className="gpa-surtitre">En amont — {voisinage.amont.size}</p>
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
                <p className="gpa-surtitre">En aval — {voisinage.aval.size}</p>
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

              {voisinage.amont.size + voisinage.aval.size === 0 && (
                <Badge ton="alerte" className="mt-4">orphelin</Badge>
              )}
            </>
          )}
        </Card>
      </div>

      <Encadre titre="Ce que la carte n’a pas encore" ton="accent">
        <p>
          Les <strong>fonctionnalités opérationnelles</strong>, les <strong>interfaces</strong> et
          les <strong>règles de gestion</strong>. Le compteur d’interfaces affiche zéro et non une
          estimation : un chiffre inventé sur une cartographie est plus coûteux qu’une case vide.
          Les {nombre(socle.compteurs.orphelins)} nœuds orphelins sont, eux, un résultat : ce sont
          les applications que rien ne relie encore à un objet de données.
        </p>
      </Encadre>

      <Provenance source={socle.source} date={socle.genere_le} />
    </div>
  )
}
