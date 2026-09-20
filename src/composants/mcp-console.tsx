import { useState } from 'react'
import { Plug, Terminal, Copy, Check, CornerDownLeft } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { socle, applications } from '@/donnees/socle'

/**
 * Le référentiel, interrogé par un agent — démonstration du contrat MCP.
 *
 * L'argument du mémoire est qu'un référentiel n'a pas deux chemins de lecture :
 * l'interface et l'agent lisent **le même contrat**. Cette console le montre au
 * lieu de le promettre — les cinq outils répondent ici, en local, sur les mêmes
 * données que les vues.
 *
 * Ce qui est simulé, et c'est écrit à l'écran : le TRANSPORT. Il n'y a pas de
 * serveur derrière cette page, donc pas de session MCP réelle. Les réponses,
 * elles, ne sont pas simulées : elles sont calculées sur `socle.json`.
 */

type Outil = {
  nom: string
  signature: string
  resume: string
  exemples: string[]
  repond: (arg: string) => unknown
}

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function trouverNoeud(q: string) {
  const n = norm(q)
  return socle.graphe.noeuds.find(x => norm(x.libelle) === n)
    ?? socle.graphe.noeuds.find(x => norm(x.libelle).includes(n))
}

export const OUTILS: Outil[] = [
  {
    nom: 'referentiel.sante',
    signature: 'referentiel.sante() → Etat',
    resume: 'ce que le référentiel contient, et ce qu’il ne sait pas encore',
    exemples: [''],
    repond: () => ({
      releve_le: socle.genere_le,
      ...socle.compteurs,
      maillons_renseignes: ['processus', 'objet_de_donnees', 'application'],
      maillons_manquants: ['fonctionnalite', 'interface', 'regle_de_gestion'],
    }),
  },
  {
    nom: 'referentiel.application',
    signature: 'referentiel.application(nom: string) → Application',
    resume: 'la fiche d’une application, avec son niveau de preuve et sa source',
    exemples: ['SIMA', 'Ublo', 'Power BI'],
    repond: (arg) => {
      const a = applications.find(x => norm(x.nom).includes(norm(arg)))
      if (!a) return { erreur: `aucune application ne correspond à « ${arg} »` }
      const objets = socle.objets.filter(o => o.applications.some(n => norm(n) === norm(a.nom)))
      return {
        nom: a.nom, categorie: a.categorie, role: a.role, editeur: a.editeur,
        niveau_de_preuve: a.preuve, citation_source: a.citation,
        objets_portes: objets.map(o => o.nom),
      }
    },
  },
  {
    nom: 'referentiel.objet',
    signature: 'referentiel.objet(nom: string) → ObjetDeDonnees',
    resume: 'un objet de données, ses processus, ses applications et ses questions d’atelier',
    exemples: ['Opération d’aménagement', 'Lot', 'Bilan d’opération'],
    repond: (arg) => {
      const o = socle.objets.find(x => norm(x.nom).includes(norm(arg)))
      if (!o) return { erreur: `aucun objet ne correspond à « ${arg} »` }
      return {
        objet: o.nom, definition: o.definition, niveau_de_preuve: o.preuve,
        processus: o.processus, applications: o.applications,
        attributs_pressentis: o.attributs,
        systeme_maitre: null,
        data_owner: null,
        questions_a_poser_en_atelier: o.questions,
      }
    },
  },
  {
    nom: 'referentiel.impact',
    signature: 'referentiel.impact(noeud: string) → { amont, aval }',
    resume: 'ce qui produit un nœud, et ce qui en dépend — le livrable 16, par l’API',
    exemples: ['SIMA', 'Foncier / parcelle', 'Marché / contrat'],
    repond: (arg) => {
      const n = trouverNoeud(arg)
      if (!n) return { erreur: `aucun nœud ne correspond à « ${arg} »` }
      const nom = (id: string) => socle.graphe.noeuds.find(x => x.id === id)?.libelle ?? id
      return {
        noeud: n.libelle, type: n.type, niveau_de_preuve: n.preuve,
        amont: socle.graphe.aretes.filter(a => a.cible === n.id).map(a => nom(a.source)),
        aval: socle.graphe.aretes.filter(a => a.source === n.id).map(a => nom(a.cible)),
      }
    },
  },
  {
    nom: 'referentiel.chercher',
    signature: 'referentiel.chercher(q: string) → Noeud[]',
    resume: 'la recherche libre sur les trois maillons renseignés',
    exemples: ['foncier', 'bilan', 'power'],
    repond: (arg) => {
      const q = norm(arg)
      if (!q) return { erreur: 'donner un terme à chercher' }
      return socle.graphe.noeuds
        .filter(n => norm(n.libelle).includes(q))
        .slice(0, 12)
        .map(n => ({ libelle: n.libelle, type: n.type, niveau_de_preuve: n.preuve }))
    },
  },
]

const CONFIG = `{
  "mcpServers": {
    "gpa-referentiel": {
      "type": "http",
      "url": "https://gpa.flowmetrik.com/mcp"
    }
  }
}`

export function ConsoleMcp() {
  const [outil, setOutil] = useState(OUTILS[3])
  const [arg, setArg] = useState('SIMA')
  const [reponse, setReponse] = useState<unknown>(null)
  const [encours, setEncours] = useState(false)
  const [copie, setCopie] = useState(false)

  function appeler(o: Outil = outil, a: string = arg) {
    setEncours(true)
    setReponse(null)
    // Une latence courte, assumée : elle rend visible qu'un appel a lieu.
    // Elle ne simule rien d'autre — la réponse, elle, est calculée pour de bon.
    window.setTimeout(() => {
      setReponse(o.repond(a))
      setEncours(false)
    }, 220)
  }

  function copier() {
    void navigator.clipboard?.writeText(CONFIG).then(() => {
      setCopie(true)
      window.setTimeout(() => setCopie(false), 1800)
    })
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="gpa-aplat-bleu gpa-motif-blanc flex flex-wrap items-center gap-3 px-4 py-3">
        <Plug className="h-4 w-4 shrink-0 text-white" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="gpa-surtitre text-white/70">Le référentiel, lu par un agent</p>
          <p className="text-[15px] font-medium text-white">Serveur MCP — cinq outils</p>
        </div>
        <Badge ton="neutre" className="bg-white/15 text-white border-white/25">démonstration</Badge>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div>
          <p className="gpa-surtitre">À coller dans votre client</p>
          <span className="gpa-filet" aria-hidden />
          <pre className="overflow-x-auto bg-[var(--gpa-sombre)] p-3 text-[11.5px] leading-relaxed text-white/90">
{CONFIG}
          </pre>
          <Button variant="contour" taille="sm" className="mt-2" onClick={copier}>
            {copie ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copie ? 'Copié' : 'Copier la configuration'}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            L’interface et l’agent lisent <strong>le même contrat</strong> : il n’existe pas de
            second chemin de lecture, donc pas de second référentiel qui dériverait du premier.
            Sur cette page de démonstration, <strong>le transport est simulé</strong> — il n’y a
            pas de serveur derrière. Les réponses, elles, sont calculées sur les données réelles.
          </p>
        </div>

        <div className="min-w-0">
          <p className="gpa-surtitre">Essayer</p>
          <span className="gpa-filet" aria-hidden />

          <div className="mb-2 flex flex-wrap gap-1.5">
            {OUTILS.map(o => (
              <button
                key={o.nom} type="button"
                onClick={() => { setOutil(o); setArg(o.exemples[0]); setReponse(null) }}
                className={`border px-2 py-1 font-mono text-[11px] ${o.nom === outil.nom
                  ? 'border-[var(--gpa-bleu)] bg-[var(--gpa-bleu)] text-white'
                  : 'border-border bg-card text-muted-foreground'}`}
              >
                {o.nom}
              </button>
            ))}
          </div>

          <p className="mb-2 text-xs text-muted-foreground">{outil.resume}</p>

          <div className="flex gap-2">
            <label className="sr-only" htmlFor="mcp-arg">Argument</label>
            <input
              id="mcp-arg" value={arg} onChange={e => setArg(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') appeler() }}
              placeholder={outil.exemples[0] || 'sans argument'}
              disabled={outil.exemples[0] === ''}
              className="min-w-0 flex-1 border border-input bg-card px-2.5 py-1.5 font-mono text-[12px]
                         outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40
                         disabled:bg-muted disabled:text-muted-foreground"
            />
            <Button taille="sm" onClick={() => appeler()}>
              <CornerDownLeft className="h-3.5 w-3.5" /> Appeler
            </Button>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {outil.exemples.filter(Boolean).map(ex => (
              <button key={ex} type="button"
                      onClick={() => { setArg(ex); appeler(outil, ex) }}
                      className="border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {ex}
              </button>
            ))}
          </div>

          <div className="mt-3 max-h-64 overflow-auto bg-[var(--gpa-sombre)] p-3">
            <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white/45">
              <Terminal className="h-3 w-3" aria-hidden /> réponse
            </p>
            <pre className="font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-white/90">
{encours ? '…' : reponse ? JSON.stringify(reponse, null, 2) : `// ${outil.signature}\n// cliquer « Appeler » pour exécuter`}
            </pre>
          </div>
        </div>
      </div>
    </Card>
  )
}
