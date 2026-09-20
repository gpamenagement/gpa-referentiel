import { useMemo, useState } from 'react'
import { MapPinned } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { socle, nombre, type Operation } from '@/donnees/socle'
import { Titre, Tuiles, Tuile, Encadre, Provenance } from './_ui'

/**
 * Les opérations d'aménagement — la vue qui fait dire « ce sont nos opérations ».
 *
 * Le plan projette lon/lat en coordonnées d'écran sans bibliothèque : 58 points
 * ne justifient pas une pile cartographique, et un fond de carte tiers est une
 * dépendance de rendu qu'un marché public ferait justifier. Le fond IGN
 * (Géoplateforme) viendra quand la vue portera les périmètres — dont les
 * coordonnées ne sont PAS dans le jeu public, seul leur nombre l'est.
 */
export default function Operations() {
  const [dt, setDt] = useState<string | null>(null)
  const [choisie, setChoisie] = useState<string | null>(null)

  const dts = useMemo(() => {
    const m = new Map<string, number>()
    for (const o of socle.operations) m.set(o.dt ?? 'non rattachée', (m.get(o.dt ?? 'non rattachée') ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [])

  const types = useMemo(() => {
    const m = new Map<string, number>()
    for (const o of socle.operations) for (const t of o.types) m.set(t, (m.get(t) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [])

  const liste = dt ? socle.operations.filter(o => (o.dt ?? 'non rattachée') === dt) : socle.operations
  const geo = liste.filter(o => o.localisation)

  // Projection : une équirectangulaire suffit à l'échelle de l'Île-de-France,
  // et elle n'a besoin d'aucune dépendance. Les bornes sont calculées sur les
  // points affichés, pas figées : filtrer une direction recadre la vue.
  const bornes = useMemo(() => {
    const lats = geo.map(o => o.localisation!.lat)
    const lons = geo.map(o => o.localisation!.lon)
    const marge = 0.06
    return {
      latMin: Math.min(...lats) - marge, latMax: Math.max(...lats) + marge,
      lonMin: Math.min(...lons) - marge, lonMax: Math.max(...lons) + marge,
    }
  }, [geo])

  const L = 900
  const H = 520
  const projeter = (lat: number, lon: number) => ({
    x: ((lon - bornes.lonMin) / (bornes.lonMax - bornes.lonMin)) * L,
    y: H - ((lat - bornes.latMin) / (bornes.latMax - bornes.latMin)) * H,
  })

  const op = choisie ? socle.operations.find(o => o.cle === choisie) ?? null : null
  const surfaceTotale = liste.reduce((n, o) => n + (o.surface_ha ?? 0), 0)
  const logementsTotal = liste.reduce((n, o) => n + (o.logements ?? 0), 0)

  return (
    <div>
      <Titre surtitre="Livrable 9" icone={<MapPinned />}
             note="Les 58 opérations publiées par l’établissement, avec leur commune, leur direction territoriale, leur type et leurs chiffres clés. C’est la projection lisible de l’objet de données « Opération d’aménagement » — et la preuve que l’objet existe avant tout atelier.">
        Opérations d’aménagement
      </Titre>

      <Tuiles>
        <Tuile valeur={nombre(liste.length)} libelle="Opérations" />
        <Tuile valeur={nombre(Math.round(surfaceTotale))} libelle="Hectares"
               precision="somme des surfaces déduites des fiches" />
        <Tuile valeur={nombre(logementsTotal)} libelle="Logements annoncés" />
        <Tuile valeur={nombre(socle.compteurs.operations_avec_perimetre)} libelle="Périmètres publiés"
               ton="accent" precision="coordonnées à récupérer auprès du SIG" />
      </Tuiles>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button variant={dt === null ? 'primaire' : 'contour'} taille="sm" onClick={() => setDt(null)}>
          Toutes ({socle.operations.length})
        </Button>
        {dts.map(([d, n]) => (
          <Button key={d} variant={dt === d ? 'primaire' : 'contour'} taille="sm" onClick={() => setDt(d)}>
            {d} ({n})
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="gpa-motif-clair overflow-hidden p-0">
          <svg viewBox={`0 0 ${L} ${H}`} role="img"
               aria-label={`Position des ${geo.length} opérations d'aménagement`}
               className="block h-[520px] w-full">
            {geo.map(o => {
              const p = projeter(o.localisation!.lat, o.localisation!.lon)
              const actif = choisie === o.cle
              return (
                <g key={o.cle} transform={`translate(${p.x},${p.y})`} className="cursor-pointer"
                   onClick={() => setChoisie(actif ? null : o.cle)}>
                  <circle r={actif ? 9 : 6}
                          className={o.perimetre_publie ? 'fill-[var(--gpa-rouge)]' : 'fill-[var(--gpa-brun)]'}
                          stroke="white" strokeWidth={2} />
                  {actif && (
                    <text x={12} y={4} className="fill-[var(--gpa-bleu)] font-sans text-[12px] font-medium">
                      {o.nom}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </Card>

        <Card className="p-4">
          {!op && (
            <>
              <p className="gpa-surtitre">Types d’opération</p>
              <span className="gpa-filet" aria-hidden />
              <ul className="space-y-1.5 text-sm">
                {types.map(([t, n]) => (
                  <li key={t} className="flex items-center justify-between gap-2">
                    <span>{t}</span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">{n}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Un point plein signale une opération dont le périmètre est publié.
                Cliquez un point pour voir la fiche.
              </p>
            </>
          )}
          {op && <Fiche op={op} />}
        </Card>
      </div>

      <Encadre titre="Une précision qui compte" ton="accent">
        <p>
          Le jeu public dit <strong>qu’un périmètre existe</strong> pour 46 opérations, et combien de
          points il compte — mais pas ses coordonnées. Le fond de carte de la Géoplateforme IGN et
          les périmètres réels arriveront ensemble, depuis le SIG de l’établissement. Afficher
          aujourd’hui un contour approché serait une donnée inventée sur une carte, c’est-à-dire la
          pire espèce.
        </p>
      </Encadre>

      <Provenance source={socle.source} date={socle.genere_le} />
    </div>
  )
}

function Fiche({ op }: { op: Operation }) {
  return (
    <>
      {op.photo && (
        <img src={op.photo} alt="" data-photo
             className="mb-3 h-36 w-full object-cover" />
      )}
      <p className="gpa-surtitre">{op.dt ?? 'non rattachée'}</p>
      <p className="font-display text-[18px] leading-tight font-medium text-[var(--gpa-bleu)]">{op.nom}</p>
      <span className="gpa-filet" aria-hidden />
      <p className="text-sm text-muted-foreground">{op.commune}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {op.types.map(t => <Badge key={t} ton="neutre">{t}</Badge>)}
      </div>
      <dl className="mt-4 space-y-1.5 text-sm">
        {op.surface_ha != null && (
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Surface</dt>
            <dd className="tabular-nums">{nombre(op.surface_ha)} ha</dd></div>
        )}
        {op.logements != null && (
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Logements</dt>
            <dd className="tabular-nums">{nombre(op.logements)}</dd></div>
        )}
        {op.perimetre_nb_points != null && (
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Points du périmètre</dt>
            <dd className="tabular-nums">{nombre(op.perimetre_nb_points)}</dd></div>
        )}
      </dl>
      {op.url && (
        <a href={op.url} target="_blank" rel="noreferrer"
           className="mt-3 inline-block text-sm text-[var(--gpa-bleu)] underline underline-offset-4">
          la fiche publiée
        </a>
      )}
    </>
  )
}
