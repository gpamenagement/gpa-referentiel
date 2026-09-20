import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { socle, nombre } from '@/donnees/socle'
import { Titre, Tuiles, Tuile, EtiquettePreuve, Encadre, Provenance } from './_ui'

/**
 * Les objets de données — livrable 12.
 *
 * Cette vue est la seule du référentiel qui n'affiche AUCUN constat : les onze
 * objets sont déduits du métier d'aménageur et des applications que le CCTP
 * nomme. L'avertissement est donc en tête, pas en note, et chaque fiche porte
 * les questions d'atelier qui la transformeront en fait.
 */
export default function Objets() {
  const [ouvert, setOuvert] = useState<string | null>(socle.objets[0]?.cle ?? null)
  const attributs = socle.objets.reduce((n, o) => n + o.attributs.length, 0)

  return (
    <div>
      <Titre surtitre="Livrable 12" note="Le CCTP demande onze attributs par objet de données : définition métier, rôle dans les processus, Data Owner, responsables qualité, système maître, applications consommatrices, interfaces associées, modalités de création et de diffusion, règles de gestion, redondances, risques. Cette version en porte les deux premiers.">
        Objets de données et référentiels
      </Titre>

      <Encadre titre="Hypothèse de travail, pas constat" ton="accent">
        <p>{socle.avertissement}</p>
      </Encadre>

      <Tuiles>
        <Tuile valeur={nombre(socle.objets.length)} libelle="Objets pressentis" />
        <Tuile valeur={nombre(attributs)} libelle="Attributs listés"
               precision="à confronter aux schémas réels" />
        <Tuile valeur={nombre(socle.processus.length)} libelle="Processus cités" />
        <Tuile valeur={nombre(socle.objets.reduce((n, o) => n + o.questions.length, 0))}
               libelle="Questions d’atelier" ton="accent"
               precision="une par incertitude, pas une de plus" />
      </Tuiles>

      <div className="space-y-3">
        {socle.objets.map(o => {
          const actif = ouvert === o.cle
          return (
            <Card key={o.cle} className="p-4">
              <button type="button" className="flex w-full items-start justify-between gap-3 text-left"
                      onClick={() => setOuvert(actif ? null : o.cle)} aria-expanded={actif}>
                <div>
                  <p className="font-display text-[17px] font-medium text-[var(--gpa-bleu)]">{o.nom}</p>
                  <p className="mt-1 max-w-[78ch] text-sm text-muted-foreground">{o.definition}</p>
                </div>
                <EtiquettePreuve preuve={o.preuve} />
              </button>

              {actif && (
                <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-3">
                  <div>
                    <p className="gpa-surtitre">Processus qui le produisent</p>
                    <ul className="mt-1.5 space-y-1 text-sm">
                      {o.processus.map(p => <li key={p}>{p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="gpa-surtitre">Applications qui le portent</p>
                    <ul className="mt-1.5 space-y-1 text-sm">
                      {o.applications.map(a => <li key={a}>{a}</li>)}
                    </ul>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Le <strong>système maître</strong> n’est pas connu : c’est la première
                      question de l’atelier.
                    </p>
                  </div>
                  <div>
                    <p className="gpa-surtitre">Attributs pressentis</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {o.attributs.map(a => <Badge key={a} ton="neutre">{a}</Badge>)}
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <p className="gpa-surtitre">Ce qui fonde l’hypothèse</p>
                    <p className="mt-1.5 max-w-[80ch] text-sm text-muted-foreground">{o.indice}</p>
                  </div>
                  <div className="md:col-span-3 border-l-[4px] border-l-[var(--gpa-rouge)] bg-muted p-3">
                    <p className="gpa-surtitre">À poser en atelier</p>
                    <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-sm">
                      {o.questions.map(q => <li key={q}>{q}</li>)}
                    </ol>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Provenance source={socle.source} date={socle.genere_le} />
    </div>
  )
}
