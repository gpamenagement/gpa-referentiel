import { useMemo, useState } from 'react'
import { MapPinned, Search, X, Ruler, Building, Layers, Crosshair } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { socle, nombre, type Operation } from '@/donnees/socle'
import { CarteOperations, COULEUR_DT, dtDe } from '@/composants/carte-operations'
import { Titre, Tuiles, Tuile, Encadre, Provenance } from './_ui'

/**
 * Les opérations d'aménagement — la vue qui fait dire « ce sont nos opérations ».
 *
 * Carte et liste lisent **le même tableau filtré** et partagent une seule
 * sélection : cliquer une ligne vole jusqu'au point, cliquer un point ouvre la
 * fiche. Deux états séparés se désynchronisent au premier filtre, et c'est le
 * genre de défaut qu'on ne voit qu'en démonstration, devant le client.
 *
 * Le filtrage se fait sur la liste, **jamais sur l'emprise de la carte** :
 * déplacer la carte ne doit pas changer les compteurs, sinon les chiffres de
 * tête deviennent une fonction du hasard du zoom.
 */
export default function Operations() {
  const [dt, setDt] = useState<string | null>(null)
  const [type, setType] = useState<string | null>(null)
  const [recherche, setRecherche] = useState('')
  const [choisie, setChoisie] = useState<string | null>(null)

  const dts = useMemo(() => compter(socle.operations.map(dtDe)), [])
  const types = useMemo(() => compter(socle.operations.flatMap(o => o.types)), [])

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return socle.operations.filter(o => {
      if (dt && dtDe(o) !== dt) return false
      if (type && !o.types.includes(type)) return false
      if (!q) return true
      return [o.nom, o.commune, o.dt, ...(o.types ?? []), ...(o.departements ?? [])]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [dt, type, recherche])

  const geolocalisees = liste.filter(o => o.localisation).length
  const surface = liste.reduce((n, o) => n + (o.surface_ha ?? 0), 0)
  const logements = liste.reduce((n, o) => n + (o.logements ?? 0), 0)
  const op = choisie ? liste.find(o => o.cle === choisie) ?? null : null
  const filtre = Boolean(dt || type || recherche)

  return (
    <div>
      <Titre surtitre="Livrable 9" icone={<MapPinned />}
             note="Les 58 opérations publiées par l’établissement, sur le fond de carte de la Géoplateforme IGN. C’est la projection lisible de l’objet de données « Opération d’aménagement » — et la preuve que l’objet existe avant tout atelier.">
        Opérations d’aménagement
      </Titre>

      <Tuiles>
        <Tuile icone={<MapPinned />} valeur={nombre(liste.length)} libelle="Opérations"
               precision={filtre ? `sur ${socle.operations.length} au total` : 'toutes directions confondues'} />
        <Tuile icone={<Crosshair />} valeur={nombre(geolocalisees)} libelle="Géolocalisées"
               precision={geolocalisees === liste.length
                 ? 'toutes portent une position'
                 : `${liste.length - geolocalisees} sans position, absentes de la carte`} />
        <Tuile icone={<Ruler />} valeur={nombre(Math.round(surface))} libelle="Hectares"
               precision="somme des surfaces déduites des fiches publiques" />
        <Tuile icone={<Building />} valeur={nombre(logements)} libelle="Logements annoncés" ton="accent" />
      </Tuiles>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Chercher une opération, une commune…"
            aria-label="Chercher une opération"
            className="h-8 w-[260px] border border-input bg-card pl-8 pr-7 text-[13px] outline-none
                       focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
          {recherche && (
            <button type="button" onClick={() => setRecherche('')} aria-label="Effacer"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Button variant={dt === null ? 'primaire' : 'contour'} taille="sm" onClick={() => setDt(null)}>
          Toutes les directions
        </Button>
        {dts.map(([d, n]) => (
          <Button key={d} variant={dt === d ? 'primaire' : 'contour'} taille="sm"
                  onClick={() => { setDt(dt === d ? null : d); setChoisie(null) }}>
            <span className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: COULEUR_DT[d] ?? COULEUR_DT['non rattachée'] }} aria-hidden />
            {d} ({n})
          </Button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="gpa-surtitre flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" aria-hidden /> Type
        </span>
        {types.map(([t, n]) => (
          <button key={t} type="button"
                  onClick={() => { setType(type === t ? null : t); setChoisie(null) }}
                  className={`border px-2 py-0.5 text-[11.5px] ${type === t
                    ? 'border-[var(--gpa-bleu)] bg-[var(--gpa-bleu)] text-white'
                    : 'border-border bg-card text-muted-foreground'}`}>
            {t} · {n}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden p-0">
          <div className="h-[560px] w-full">
            <CarteOperations operations={liste} choisie={choisie} onChoisir={setChoisie} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-3 py-2">
            {dts.map(([d]) => (
              <span key={d} className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <span className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: COULEUR_DT[d] ?? COULEUR_DT['non rattachée'] }} aria-hidden />
                {d}
              </span>
            ))}
            <span className="ml-auto text-[11px] text-muted-foreground">
              le disque suit la racine de la surface
            </span>
          </div>
        </Card>

        <div className="flex max-h-[640px] min-h-0 flex-col gap-3">
          {op && <Fiche op={op} onFermer={() => setChoisie(null)} />}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ul className="space-y-1.5">
              {liste.map(o => (
                <li key={o.cle}>
                  <button
                    type="button" onClick={() => setChoisie(o.cle === choisie ? null : o.cle)}
                    aria-current={o.cle === choisie ? 'true' : undefined}
                    className={`flex w-full items-start gap-2 border border-border px-2.5 py-2 text-left
                                ${o.cle === choisie
                                  ? 'border-l-[3px] border-l-[var(--gpa-bleu)] bg-[var(--gpa-lavande)]'
                                  : 'border-l-[3px] border-l-transparent bg-card'}`}
                  >
                    <span className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: COULEUR_DT[dtDe(o)] ?? COULEUR_DT['non rattachée'] }} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{o.nom}</span>
                      <span className="block truncate text-[12px] text-muted-foreground">{o.commune}</span>
                    </span>
                    {o.surface_ha != null && (
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                        {nombre(Math.round(o.surface_ha))} ha
                      </span>
                    )}
                  </button>
                </li>
              ))}
              {liste.length === 0 && (
                <li className="border border-border bg-card px-3 py-6 text-center text-sm text-muted-foreground">
                  Aucune opération ne correspond.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <Encadre titre="Une précision qui compte" ton="accent">
        <p>
          Le jeu public dit <strong>qu’un périmètre existe</strong> pour
          {' '}{socle.compteurs.operations_avec_perimetre} opérations, et combien de points il
          compte — mais pas ses coordonnées. Les périmètres réels viendront du SIG de
          l’établissement, et se poseront sur ce même fond IGN. Afficher aujourd’hui un contour
          approché serait une donnée inventée sur une carte, c’est-à-dire la pire espèce.
        </p>
      </Encadre>

      <Provenance source={socle.source} date={socle.genere_le} />
    </div>
  )
}

function compter(valeurs: (string | null | undefined)[]): [string, number][] {
  const m = new Map<string, number>()
  for (const v of valeurs) {
    const k = v ?? 'non rattachée'
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

function Fiche({ op, onFermer }: { op: Operation; onFermer: () => void }) {
  return (
    <Card className="shrink-0 overflow-hidden p-0">
      {op.photo && (
        <img
          src={op.photo} alt="" data-photo className="h-32 w-full object-cover"
          // Une image cassée est pire qu'une image absente : elle donne une
          // icône brisée au milieu d'une fiche client. La photo publique peut
          // disparaître du site de l'établissement sans prévenir.
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="gpa-surtitre">{dtDe(op)}</p>
            <h3 className="font-display text-[16px] leading-tight font-medium text-[var(--gpa-bleu)]">
              {op.nom}
            </h3>
          </div>
          <Button variant="discret" taille="icone" onClick={onFermer} aria-label="Fermer la fiche">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <span className="gpa-filet" aria-hidden />
        <p className="text-[13px] text-muted-foreground">{op.commune}</p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {op.types.map(t => <Badge key={t} ton="neutre">{t}</Badge>)}
        </div>

        <dl className="mt-3 space-y-1 text-[13px]">
          {op.surface_ha != null && (
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Surface</dt>
              <dd className="tabular-nums">{nombre(op.surface_ha)} ha</dd>
            </div>
          )}
          {op.logements != null && (
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Logements</dt>
              <dd className="tabular-nums">{nombre(op.logements)}</dd>
            </div>
          )}
          {op.perimetre_nb_points != null && (
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Points du périmètre</dt>
              <dd className="tabular-nums">{nombre(op.perimetre_nb_points)}</dd>
            </div>
          )}
          {op.localisation && (
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Position</dt>
              <dd className="font-mono text-[11.5px] tabular-nums">
                {op.localisation.lat.toFixed(4)}, {op.localisation.lon.toFixed(4)}
              </dd>
            </div>
          )}
        </dl>

        {op.url && (
          <a href={op.url} target="_blank" rel="noreferrer"
             className="mt-2 inline-block text-[13px] text-[var(--gpa-bleu)] underline underline-offset-4">
            la fiche publiée par GPA
          </a>
        )}
      </div>
    </Card>
  )
}
