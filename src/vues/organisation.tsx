import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { socle, nombre } from '@/donnees/socle'
import { Titre, Tuiles, Tuile, EtiquettePreuve, Encadre, Provenance } from './_ui'

/**
 * L'organisation : directions, entités liées, instances.
 *
 * Cette vue existe parce qu'une cartographie de SI sans organisation n'a pas de
 * propriétaire à qui rattacher un objet de données — et « identifier les
 * propriétaires des données » est l'exigence que le dossier désigne comme la
 * plus difficile, parce que le rôle n'existe pas encore chez GPA.
 */
export default function Organisation() {
  const [direction, setDirection] = useState<string | null>(null)

  const parDirection = useMemo(() => {
    const m = new Map<string, typeof socle.personnes>()
    for (const p of socle.personnes) {
      const k = p.direction ?? 'sans direction'
      m.set(k, [...(m.get(k) ?? []), p])
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [])

  const o = socle.organisation

  return (
    <div>
      <Titre surtitre="Le porteur de la donnée"
             note="Tout ce qui est affiché ici vient de pages publiées par l’établissement ou de la presse institutionnelle, avec la citation d’origine conservée en base. L’annuaire des équipes, lui, vit dans l’Entra ID de GPA et viendra en atelier.">
        Organisation, filiales et gouvernance
      </Titre>

      <Tuiles>
        <Tuile valeur={nombre(o.directions_territoriales.length)} libelle="Directions territoriales" />
        <Tuile valeur={nombre(o.directions_fonctionnelles.length + o.directions_support.length)}
               libelle="Directions fonctionnelles et support" />
        <Tuile valeur={nombre(o.filiales.length)} libelle="Filiales et participations" ton="accent" />
        <Tuile valeur={nombre(socle.personnes.length)} libelle="Personnes publiées"
               precision="instances de gouvernance uniquement" />
      </Tuiles>

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <p className="gpa-surtitre">Directions territoriales</p>
          <span className="gpa-filet" aria-hidden />
          <ul className="space-y-1.5 text-sm">
            {o.directions_territoriales.map(d => (
              <li key={d.nom} className="flex items-start justify-between gap-2">
                <span>{d.nom}</span>
                {d.statut && <Badge ton={d.statut.startsWith('prouv') ? 'succes' : 'alerte'}>{d.statut}</Badge>}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <p className="gpa-surtitre">Filiales, participations et entités liées</p>
          <span className="gpa-filet" aria-hidden />
          <ul className="space-y-2 text-sm">
            {o.filiales.map(f => (
              <li key={f.nom}>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{f.nom}</span>
                  {f.statut && <Badge ton={f.statut.startsWith('prouv') ? 'succes' : 'alerte'}>{f.statut}</Badge>}
                </div>
                {f.note && <p className="text-muted-foreground">{f.note}</p>}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Titre surtitre="Périmètre du CCTP">Les directions que la mission doit solliciter</Titre>
      <div className="mb-6 grid gap-2 md:grid-cols-3">
        {o.directions_cctp.map(d => (
          <Card key={d.nom} profondeur="plat" className="p-3">
            <p className="text-sm font-medium">{d.nom}</p>
            <p className="mt-1 text-xs text-muted-foreground">{d.preuve}</p>
          </Card>
        ))}
      </div>

      <Titre surtitre="Instances publiées">Qui siège, et où</Titre>
      <div className="mb-3 flex flex-wrap gap-2">
        {parDirection.map(([d, gens]) => (
          <button key={d} type="button" onClick={() => setDirection(direction === d ? null : d)}
                  className={`border px-2.5 py-1 text-xs ${direction === d
                    ? 'border-[var(--gpa-bleu)] bg-[var(--gpa-bleu)] text-white'
                    : 'border-border bg-card text-muted-foreground'}`}>
            {d} · {gens.length}
          </button>
        ))}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {parDirection
          .filter(([d]) => !direction || d === direction)
          .flatMap(([, gens]) => gens)
          .map(p => (
            <Card key={p.cle} profondeur="plat" className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {p.prenom} {p.nom}
                  </p>
                  <p className="text-sm text-muted-foreground">{p.fonction}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{p.direction}</p>
                </div>
                <EtiquettePreuve preuve={p.preuve} />
              </div>
              {p.url && (
                <a href={p.url} target="_blank" rel="noreferrer"
                   className="mt-1.5 inline-block text-xs text-[var(--gpa-bleu)] underline underline-offset-4">
                  source : {p.source}
                </a>
              )}
            </Card>
          ))}
      </div>

      <Encadre titre="Ce qui n’a pas été fait, volontairement" ton="accent">
        <p>
          Aucun trombinoscope n’a été reconstitué depuis les réseaux sociaux. Un export des
          collaborateurs était techniquement à portée ; il aurait donné des centaines de fiches, et
          montré à un employeur l’annuaire de ses propres agents constitué sans lui. Les personnes
          affichées ici siègent dans des instances dont la composition est publiée.
        </p>
      </Encadre>

      <Provenance source={socle.source} date={socle.genere_le} />
    </div>
  )
}
