import { useMemo, useState } from 'react'
import {
  Database, KeyRound, Asterisk, Workflow, AppWindow, ArrowRight, ShieldCheck,
  MessagesSquare, Table2, GitBranch, Layers, CircleAlert,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { socle, nombre, type EntiteCatalogue, type ObjetDeDonnees } from '@/donnees/socle'
import { Mcd } from '@/composants/mcd'
import { Card as Carte } from '@/components/ui/card'
import { Titre, Tuiles, Tuile, EtiquettePreuve, Encadre, Provenance } from './_ui'

/**
 * Les objets de données — livrable 12, et le catalogue qui va avec.
 *
 * Le CCTP demande onze attributs par objet : définition métier, rôle dans les
 * processus, Data Owner, responsables qualité, système maître, applications
 * consommatrices, interfaces associées, modalités de création et de diffusion,
 * règles de gestion, redondances, risques. Un écran qui n'afficherait que le
 * nom et la définition ne serait pas un catalogue : ce serait une liste.
 *
 * **Le catalogue n'est pas saisi, il est lu.** Les descriptions dbt portent déjà
 * le propriétaire, la classification et la fraîcheur ; les tests portent les
 * règles de gestion ; les jeux de données portent les types réels et un exemple
 * de valeur. Un catalogue tenu à côté du code diverge du code en trois semaines.
 *
 * Ce que l'écran montre aussi, et qui compte autant : **les objets qui n'ont pas
 * encore de modèle**. Six sur onze. C'est la dette de catalogue, et elle est
 * comptée en tête plutôt que cachée en bas.
 */

type Onglet = 'schema' | 'lignage' | 'qualite' | 'atelier'

const ONGLETS: { cle: Onglet; libelle: string; icone: typeof Table2 }[] = [
  { cle: 'schema', libelle: 'Schéma', icone: Table2 },
  { cle: 'lignage', libelle: 'Lignage', icone: GitBranch },
  { cle: 'qualite', libelle: 'Règles et qualité', icone: ShieldCheck },
  { cle: 'atelier', libelle: 'Atelier', icone: MessagesSquare },
]

export default function Objets() {
  const [choisi, setChoisi] = useState(socle.objets[0]?.cle ?? '')
  const [onglet, setOnglet] = useState<Onglet>('schema')

  /** Le modèle dbt qui correspond à un objet — s'il existe. */
  const modeleDe = useMemo(() => {
    const m = new Map<string, EntiteCatalogue[]>()
    for (const e of socle.catalogue.entites) {
      if (!e.objet) continue
      const o = socle.objets.find(x => x.nom === e.objet)
      if (!o) continue
      m.set(o.cle, [...(m.get(o.cle) ?? []), e])
    }
    return m
  }, [])

  const objet = socle.objets.find(o => o.cle === choisi) ?? socle.objets[0]
  const modeles = modeleDe.get(objet.cle) ?? []
  const c = socle.compteurs

  return (
    <div>
      <Titre surtitre="Livrable 12" icone={<Database />}
             note="Onze objets de données, leur schéma, leur propriétaire et les règles qui les tiennent. Le catalogue est lu depuis les transformations : rien n’y est saisi deux fois, donc rien ne peut y diverger du code.">
        Objets de données et catalogue
      </Titre>

      <Tuiles>
        <Tuile icone={<Database />} valeur={nombre(socle.objets.length)} libelle="Objets de données"
               precision={`${modeleDe.size} ont un modèle, ${socle.objets.length - modeleDe.size} n’en ont pas encore`} />
        <Tuile icone={<Table2 />} valeur={nombre(c.catalogue_champs)} libelle="Champs catalogués"
               precision={`sur ${nombre(c.catalogue_entites)} modèles, deux couches`} />
        <Tuile icone={<ShieldCheck />}
               valeur={`${Math.round((c.catalogue_champs_documentes / c.catalogue_champs) * 100)} %`}
               libelle="Champs documentés"
               precision={`${c.catalogue_champs_documentes} sur ${c.catalogue_champs} portent une définition`} />
        <Tuile icone={<CircleAlert />} valeur="0" libelle="Data Owners nommés" ton="accent"
               precision="le rôle n’existe pas encore — l’exigence la plus difficile du CCTP" />
      </Tuiles>

      <Encadre titre="Hypothèse de travail, pas constat" ton="accent">
        <p>{socle.avertissement}</p>
      </Encadre>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <nav aria-label="Objets de données" className="space-y-1.5">
          {socle.objets.map(o => {
            const n = (modeleDe.get(o.cle) ?? []).length
            const actif = o.cle === objet.cle
            return (
              <button
                key={o.cle} type="button"
                onClick={() => setChoisi(o.cle)}
                aria-current={actif ? 'true' : undefined}
                className={`flex w-full items-center gap-2 border border-border px-3 py-2 text-left
                            ${actif ? 'border-l-[3px] border-l-[var(--gpa-rouge)] bg-[var(--gpa-lavande)]'
                                    : 'border-l-[3px] border-l-transparent bg-card'}`}
              >
                <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{o.nom}</span>
                {n > 0
                  ? <Badge ton="succes">{n}</Badge>
                  : <Badge ton="neutre">—</Badge>}
              </button>
            )
          })}
          <p className="pt-1 text-xs text-muted-foreground">
            Le compteur est le nombre de <strong>modèles</strong> qui matérialisent l’objet. Un tiret
            signale un objet encore sans schéma : c’est la dette de catalogue, pas un oubli d’affichage.
          </p>
        </nav>

        <div className="min-w-0">
          <FicheObjet objet={objet} modeles={modeles} onglet={onglet} setOnglet={setOnglet} />
        </div>
      </div>

      <div className="mt-8">
        <Titre surtitre="Le modèle de données" icone={<GitBranch />}
               note="Les tables et ce qui alimente quoi. Les flèches sont lues dans les `ref()` du SQL — la seule déclaration de lignage qui ne puisse pas mentir, puisque c’est elle qui fait tourner la transformation.">
          Le schéma, tel qu’il tourne
        </Titre>
        <Carte className="mb-8 overflow-hidden p-0">
          <Mcd />
        </Carte>

        <Titre surtitre="Le catalogue" icone={<Layers />}>Neuf modèles, deux couches</Titre>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="bg-[var(--gpa-bleu)] text-white">
                {['Modèle', 'Couche', 'Objet', 'Propriétaire', 'Classification', 'Fraîcheur', 'Champs', 'Lignes'].map(t => (
                  <th key={t} className="p-2.5 text-left font-medium">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {socle.catalogue.entites.map(e => (
                <tr key={e.cle} className="border-b border-border">
                  <td className="p-2.5 font-mono text-[12px]">{e.modele}</td>
                  <td className="p-2.5">
                    <Badge ton={e.couche === 'referentiel' ? 'info' : 'neutre'}>{e.couche}</Badge>
                  </td>
                  <td className="p-2.5 text-muted-foreground">{e.objet ?? '—'}</td>
                  <td className="p-2.5">{e.proprietaire ?? <span className="text-muted-foreground">à nommer</span>}</td>
                  <td className="p-2.5 text-muted-foreground">{e.classification ?? '—'}</td>
                  <td className="p-2.5 text-muted-foreground">{e.fraicheur ?? '—'}</td>
                  <td className="p-2.5 tabular-nums">{e.champs.length}</td>
                  <td className="p-2.5 tabular-nums text-muted-foreground">{e.lignes ?? 'calculé'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Source : {socle.catalogue.source}. La couche <strong>socle</strong> normalise ce que
          l’application source contient ; la couche <strong>référentiel</strong> est ce qui fait foi
          et se consomme. Un modèle de référentiel n’a pas de volumétrie propre : il est calculé.
        </p>
      </div>

      <Provenance source={socle.source} date={socle.genere_le} />
    </div>
  )
}

function FicheObjet(
  { objet, modeles, onglet, setOnglet }:
  { objet: ObjetDeDonnees; modeles: EntiteCatalogue[]; onglet: Onglet; setOnglet: (o: Onglet) => void },
) {
  const meta = modeles[0]
  return (
    <Card className="overflow-hidden p-0">
      <header className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="gpa-surtitre">Objet de données</p>
            <h3 className="font-display text-[19px] leading-tight font-medium text-[var(--gpa-bleu)]">
              {objet.nom}
            </h3>
          </div>
          <EtiquettePreuve preuve={objet.preuve} />
        </div>
        <span className="gpa-filet" aria-hidden />
        <p className="max-w-[80ch] text-sm text-muted-foreground">{objet.definition}</p>

        <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Propriétaire', meta?.proprietaire, 'à nommer en atelier'],
            ['Système maître', meta?.source_applicative, 'inconnu'],
            ['Classification', meta?.classification, 'à définir'],
            ['Fraîcheur', meta?.fraicheur, 'à définir'],
            ['Destinataires', meta?.destinataires, 'à définir'],
            ['Modèles', modeles.map(m => m.modele).join(', ') || null, 'aucun'],
          ].map(([libelle, valeur, defaut]) => (
            <div key={libelle as string} className="flex gap-2">
              <dt className="shrink-0 text-muted-foreground">{libelle} :</dt>
              <dd className={valeur ? 'font-medium' : 'text-muted-foreground italic'}>
                {(valeur as string) ?? (defaut as string)}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="flex flex-wrap gap-1 border-b border-border bg-muted px-2 py-1.5">
        {ONGLETS.map(o => {
          const Icone = o.icone
          return (
            <Button key={o.cle} variant={onglet === o.cle ? 'primaire' : 'discret'} taille="sm"
                    onClick={() => setOnglet(o.cle)}>
              <Icone className="h-3.5 w-3.5" aria-hidden /> {o.libelle}
            </Button>
          )
        })}
      </div>

      <div className="p-4">
        {onglet === 'schema' && <Schema objet={objet} modeles={modeles} />}
        {onglet === 'lignage' && <Lignage objet={objet} modeles={modeles} />}
        {onglet === 'qualite' && <Qualite modeles={modeles} />}
        {onglet === 'atelier' && (
          <>
            <p className="gpa-surtitre">Les questions qui transforment l’hypothèse en fait</p>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
              {objet.questions.map(q => <li key={q}>{q}</li>)}
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              Ce qui fonde l’hypothèse : {objet.indice}
            </p>
          </>
        )}
      </div>
    </Card>
  )
}

function Schema({ objet, modeles }: { objet: ObjetDeDonnees; modeles: EntiteCatalogue[] }) {
  if (modeles.length === 0) {
    return (
      <>
        <p className="gpa-surtitre">Attributs pressentis — pas encore de schéma</p>
        <span className="gpa-filet" aria-hidden />
        <p className="mb-3 max-w-[80ch] text-sm text-muted-foreground">
          Cet objet n’a pas encore de modèle : ses attributs sont <strong>déduits</strong> du métier
          d’aménageur et des fiches publiques, sans type ni exemple. Les typer demande un accès à
          l’application qui le porte — c’est précisément ce que la mission apporte.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {objet.attributs.map(a => <Badge key={a} ton="neutre">{a}</Badge>)}
        </div>
      </>
    )
  }
  return (
    <div className="space-y-6">
      {modeles.map(m => (
        <div key={m.cle}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge ton={m.couche === 'referentiel' ? 'info' : 'neutre'}>{m.couche}</Badge>
            <code className="font-mono text-[13px] font-semibold text-[var(--gpa-bleu)]">{m.modele}</code>
            {m.lignes != null && (
              <span className="text-xs text-muted-foreground">{nombre(m.lignes)} lignes</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b-2 border-[var(--gpa-bleu)] text-left">
                  <th className="py-2 pr-3 font-medium">Champ</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Exemple</th>
                  <th className="py-2 font-medium">Définition</th>
                </tr>
              </thead>
              <tbody>
                {m.champs.map(ch => (
                  <tr key={ch.nom} className="border-b border-border align-top">
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-1.5 font-mono text-[12.5px]">
                        {ch.cle && <KeyRound className="h-3 w-3 text-[var(--gpa-rouge)]" aria-label="clé" />}
                        {!ch.cle && ch.obligatoire && (
                          <Asterisk className="h-3 w-3 text-muted-foreground" aria-label="obligatoire" />
                        )}
                        {ch.nom}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      {/* Un champ de la couche référentiel n'a pas de type lu :
                          il est CALCULÉ. Afficher « inconnu » ferait croire à une
                          lacune là où il n'y a qu'une autre nature de champ. */}
                      <Badge ton="neutre">
                        {ch.type ?? (m.couche === 'referentiel' ? 'calculé' : 'inconnu')}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 font-mono text-[12px] text-muted-foreground">
                      {ch.exemple ?? (m.couche === 'referentiel' ? 'dérivé' : '—')}
                    </td>
                    <td className="py-2 text-[13px] text-muted-foreground">
                      {ch.description ?? (
                        <span className="italic text-[var(--color-accentInk)]">
                          non documenté — à décrire en atelier
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {m.echantillon.length > 0 && (
            <div className="mt-3">
              <p className="gpa-surtitre">Échantillon — {m.echantillon.length} lignes réelles</p>
              <div className="mt-1.5 overflow-x-auto border border-border">
                <table className="w-full text-[11.5px]">
                  <thead>
                    <tr className="bg-muted">
                      {Object.keys(m.echantillon[0]).map(k => (
                        <th key={k} className="whitespace-nowrap px-2 py-1.5 text-left font-mono font-medium">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {m.echantillon.map((l, i) => (
                      <tr key={Object.values(l).join('|')} className={i % 2 ? 'bg-card' : 'bg-[var(--gpa-fond)]'}>
                        {Object.keys(m.echantillon[0]).map(k => (
                          <td key={k} className="whitespace-nowrap px-2 py-1 font-mono text-muted-foreground">
                            {l[k] || <span className="italic">vide</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Ces lignes viennent du jeu de démonstration du dossier d’offre — elles montrent le
                <strong> format réel</strong> d’une valeur, ce qu’aucune définition ne dit aussi bien.
              </p>
            </div>
          )}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        <KeyRound className="mr-1 inline h-3 w-3" aria-hidden /> clé ·
        <Asterisk className="mx-1 inline h-3 w-3" aria-hidden /> obligatoire. Les types et les
        exemples sont <strong>lus dans les données</strong>, jamais déclarés à la main.
      </p>
    </div>
  )
}

function Lignage({ objet, modeles }: { objet: ObjetDeDonnees; modeles: EntiteCatalogue[] }) {
  const colonne = (titre: string, icone: React.ReactNode, items: string[], vide: string) => (
    <div className="min-w-0 flex-1">
      <p className="gpa-surtitre flex items-center gap-1.5">
        <span className="[&_svg]:size-3.5" aria-hidden>{icone}</span>{titre}
      </p>
      <div className="mt-2 space-y-1.5">
        {items.length === 0
          ? <p className="text-sm italic text-muted-foreground">{vide}</p>
          : items.map(i => (
              <div key={i} className="border border-border bg-card px-2.5 py-1.5 text-[13px]">{i}</div>
            ))}
      </div>
    </div>
  )

  return (
    <>
      <p className="mb-4 max-w-[80ch] text-sm text-muted-foreground">
        D’où vient cet objet, et qui le consomme. C’est la lecture <strong>dans les deux sens</strong>
        que demande le livrable 14 — la même que la carte du SI, à la maille d’un seul objet.
      </p>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {colonne('Processus producteurs', <Workflow />, objet.processus, 'aucun processus identifié')}
        <ArrowRight className="mt-6 hidden h-4 w-4 shrink-0 text-[var(--gpa-rouge)] md:block" aria-hidden />
        {colonne('Modèles', <Layers />, modeles.map(m => `${m.modele} (${m.couche})`),
                 'aucun modèle — objet non matérialisé')}
        <ArrowRight className="mt-6 hidden h-4 w-4 shrink-0 text-[var(--gpa-rouge)] md:block" aria-hidden />
        {colonne('Applications', <AppWindow />, objet.applications, 'aucune application connue')}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Le <strong>système maître</strong> — celle des applications qui détient l’identifiant de
        référence — n’est pas connu. C’est la première question de chaque atelier, et tant qu’elle
        est sans réponse, la colonne de droite est une liste de candidats, pas une chaîne.
      </p>
    </>
  )
}

function Qualite({ modeles }: { modeles: EntiteCatalogue[] }) {
  const regles = modeles.flatMap(m =>
    m.champs.filter(c => c.regles.length > 0).map(c => ({ modele: m.modele, champ: c.nom, regles: c.regles })))

  if (regles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune règle n’est encore posée sur cet objet : sans modèle, il n’y a rien à contrôler.
        Les règles de gestion s’écrivent en atelier, puis deviennent des tests qui bloquent la
        publication quand ils échouent.
      </p>
    )
  }
  return (
    <>
      <p className="mb-3 max-w-[80ch] text-sm text-muted-foreground">
        Chaque règle est un <strong>test exécutable</strong>, pas une phrase dans un document : s’il
        échoue, la publication du référentiel s’arrête. C’est la différence entre une procédure de
        maintenance promise et une procédure outillée.
      </p>
      <ul className="space-y-2">
        {regles.map(r => (
          <li key={`${r.modele}.${r.champ}`} className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-succes" aria-hidden />
            <code className="font-mono text-[12.5px] text-[var(--gpa-bleu)]">{r.modele}.{r.champ}</code>
            {r.regles.map(x => <Badge key={x} ton="succes">{x}</Badge>)}
          </li>
        ))}
      </ul>
    </>
  )
}
