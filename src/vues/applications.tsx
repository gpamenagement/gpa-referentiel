import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { applications, socle, nombre, type Application } from '@/donnees/socle'
import { Titre, Tuiles, Tuile, EtiquettePreuve, Encadre, Provenance } from './_ui'

/**
 * La cartographie applicative — livrable 10 du CCTP.
 *
 * Le filtre porte sur le NIVEAU DE PREUVE, pas sur la catégorie : c'est la
 * question qu'un DSI pose en premier devant un inventaire qu'il n'a pas produit
 * (« qu'est-ce que vous savez vraiment ? »), et c'est la seule dimension qui
 * change la valeur de la ligne.
 */
export default function Applications() {
  const [preuve, setPreuve] = useState<string | null>(null)
  const [ouvert, setOuvert] = useState<string | null>(null)

  const niveaux = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of applications) m.set(a.preuve ?? 'sans source', (m.get(a.preuve ?? 'sans source') ?? 0) + 1)
    return [...m.entries()].sort((x, y) => y[1] - x[1])
  }, [])

  const liste = preuve ? applications.filter(a => (a.preuve ?? 'sans source') === preuve) : applications
  const porteuses = new Map<string, number>()
  for (const o of socle.objets) for (const n of o.applications) porteuses.set(n, (porteuses.get(n) ?? 0) + 1)

  return (
    <div>
      <Titre surtitre="Livrable 10" note="Vingt applications, et pour chacune ce qui la prouve. Le CCTP nomme les six premières ; les autres viennent d’une offre d’emploi, d’un avis d’attribution, ou d’une hypothèse que nous confirmerons en atelier.">
        Cartographie applicative
      </Titre>

      <Tuiles>
        {niveaux.map(([n, c]) => (
          <Tuile key={n} valeur={nombre(c)} libelle={n}
                 precision={n.includes('hypothèse') ? 'à confirmer en atelier' : undefined}
                 ton={n.includes('hypothèse') ? 'accent' : 'neutre'} />
        ))}
      </Tuiles>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant={preuve === null ? 'primaire' : 'contour'} taille="sm"
                onClick={() => setPreuve(null)}>
          Toutes ({applications.length})
        </Button>
        {niveaux.map(([n, c]) => (
          <Button key={n} variant={preuve === n ? 'primaire' : 'contour'} taille="sm"
                  onClick={() => setPreuve(n)}>
            {n} ({c})
          </Button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {liste.map(a => (
          <Fiche key={a.cle} app={a} objets={porteuses.get(a.nom) ?? 0}
                 ouvert={ouvert === a.cle} onBascule={() => setOuvert(ouvert === a.cle ? null : a.cle)} />
        ))}
      </div>

      <Encadre titre="Ce que cette vue ne dit pas encore" ton="accent">
        <p>
          Ni le <strong>type de système</strong> (source, stockage de référence, réplicat,
          consommation), ni la <strong>couverture des données</strong>, ni la <strong>criticité</strong>.
          Ce sont les trois colonnes qui distinguent un inventaire d’une cartographie exploitable,
          et elles se remplissent en atelier — listes contrôlées L-08, L-09 et L-05 du questionnaire.
        </p>
      </Encadre>

      <Provenance source={socle.source} date={socle.genere_le} />
    </div>
  )
}

function Fiche(
  { app, objets, ouvert, onBascule }:
  { app: Application; objets: number; ouvert: boolean; onBascule: () => void },
) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        {app.logo
          ? <img src={app.logo} alt="" className="mt-0.5 h-6 w-6 shrink-0 object-contain" />
          : <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-secondary
                             font-mono text-[10px] font-bold text-[var(--gpa-bleu)]">
              {app.nom.slice(0, 2).toUpperCase()}
            </span>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{app.nom}</p>
            <EtiquettePreuve preuve={app.preuve} />
          </div>
          {app.categorie && <p className="gpa-surtitre mt-1">{app.categorie}</p>}
          {app.role && <p className="mt-1.5 text-sm text-muted-foreground">{app.role}</p>}

          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {app.editeur && <span>Éditeur : {app.editeur}</span>}
            {objets > 0 && <Badge ton="neutre">{objets} objet{objets > 1 ? 's' : ''} porté{objets > 1 ? 's' : ''}</Badge>}
            {!app.editeur && <span>Éditeur à identifier en atelier</span>}
          </div>

          {(app.citation || app.remarque) && (
            <button type="button" onClick={onBascule}
                    className="mt-2 text-xs text-[var(--gpa-bleu)] underline underline-offset-4">
              {ouvert ? 'Masquer la source' : 'Voir la source'}
            </button>
          )}
          {ouvert && (
            <div className="mt-2 border-l-2 border-[var(--gpa-rouge)] pl-3 text-xs text-muted-foreground">
              {app.citation && <p className="mb-1 italic">{app.citation}</p>}
              {app.remarque && <p>{app.remarque}</p>}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
