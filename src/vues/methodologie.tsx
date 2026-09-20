import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { socle, nombre } from '@/donnees/socle'
import { Titre, Encadre, Provenance } from './_ui'

/**
 * Le niveau 0 du CCTP, rendu exécutable.
 *
 * Le CCTP demande une « documentation du processus de cartographie » :
 * méthode, conventions de nommage, procédures de mise à jour et de contrôle.
 * Un document Word le dirait ; cette page le dit à l'endroit où la donnée est
 * lue, ce qui est la seule façon qu'elle soit lue.
 */
export default function Methodologie() {
  const etapes = [
    {
      titre: 'Partir des gens, vérifier par la machine',
      corps: 'Un référentiel construit à partir des seuls schémas d’architecture décrit le SI que la DSI croit avoir. Les entretiens disent où sont les doubles saisies et les fichiers Excel parallèles ; les exports et les journaux disent si c’est vrai. Les écarts entre les deux ne sont pas des erreurs à corriger : ce sont les résultats les plus utiles de la mission.',
    },
    {
      titre: 'Un identifiant par valeur, jamais du texte libre',
      corps: 'Treize listes contrôlées, 93 valeurs, chacune avec son identifiant et sa définition. Deux entretiens qui n’emploient pas les mêmes mots ne se recoupent pas ; avec un identifiant, un libellé peut être réécrit sans casser une ligne déjà saisie.',
    },
    {
      titre: 'Le niveau de preuve est une colonne',
      corps: 'Nommé par le CCTP · nommé par une offre d’emploi · nommé par un marché public · hypothèse. Puis, dès les ateliers : déclaré · corroboré · vérifié · contredit. Aucune entité ne s’affiche sans son niveau — c’est ce qui rend le référentiel utilisable par quelqu’un qui ne l’a pas construit.',
    },
    {
      titre: 'La chaîne se parcourt dans les deux sens',
      corps: 'Processus → application → fonctionnalité → objet de données → règle de gestion, plus les interfaces. Saisir un lien complet coûte le même effort que saisir une ligne de tableau, mais permet de répondre à « qui casse si cette application s’arrête ? » sans rouvrir quatre classeurs.',
    },
    {
      titre: 'La maintenance est outillée, pas promise',
      corps: 'Les transformations sont versionnées et testées (dbt) ; un contrôle qui échoue bloque la publication. Une procédure de mise à jour qui repose sur la bonne volonté d’une personne est une procédure qui tiendra six semaines.',
    },
    {
      titre: 'Les livrables restent bureautiques',
      corps: 'Le CCTP exige des formats modifiables — Word, Excel, PowerPoint, Visio ou Draw.io — réutilisables sans limitation. Cette application les exporte ; elle n’est jamais l’unique détenteur d’un livrable, et rien ici ne demande d’abonnement pour être relu dans trois ans.',
    },
  ]

  return (
    <div>
      <Titre surtitre="Niveau 0 du CCTP"
             note="Comment chaque entrée de ce référentiel a été obtenue, et comment l’enrichir. Cette page est le livrable méthodologique lui-même, pas son résumé.">
        Méthodologie
      </Titre>

      <div className="mb-7 grid gap-3 md:grid-cols-2">
        {etapes.map((e, i) => (
          <Card key={e.titre} className="p-4">
            <p className="gpa-surtitre">Principe {i + 1}</p>
            <p className="font-display text-[17px] leading-snug font-medium text-[var(--gpa-bleu)]">{e.titre}</p>
            <span className="gpa-filet" aria-hidden />
            <p className="text-sm text-muted-foreground">{e.corps}</p>
          </Card>
        ))}
      </div>

      <Titre surtitre="Traçabilité">D’où vient ce qui est affiché</Titre>
      <div className="mb-7 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-[var(--gpa-bleu)] text-white">
              <th className="p-2.5 text-left font-medium">Jeu</th>
              <th className="p-2.5 text-left font-medium">Source</th>
              <th className="p-2.5 text-left font-medium">Volume</th>
              <th className="p-2.5 text-left font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Opérations d’aménagement', 'carte publique des opérations de GPA', nombre(socle.compteurs.operations), 'réel'],
              ['Organisation, filiales, instances', 'site officiel, presse institutionnelle', nombre(socle.compteurs.filiales + socle.compteurs.directions_territoriales), 'réel'],
              ['Personnes', 'compositions d’instances publiées', nombre(socle.compteurs.personnes), 'partiel'],
              ['Applications', 'CCTP, offres d’emploi, avis d’attribution', nombre(socle.compteurs.applications + socle.compteurs.applications_hypothese), 'réel, gradué'],
              ['Objets de données', 'déduction du métier d’aménageur', nombre(socle.compteurs.objets), 'hypothèse'],
              ['Marchés publics', 'API BOAMP (DILA)', nombre(socle.compteurs.marches), 'réel'],
            ].map(l => (
              <tr key={l[0]} className="border-b border-border">
                <td className="p-2.5 font-medium">{l[0]}</td>
                <td className="p-2.5 text-muted-foreground">{l[1]}</td>
                <td className="p-2.5 tabular-nums">{l[2]}</td>
                <td className="p-2.5">
                  <Badge ton={l[3] === 'hypothèse' ? 'alerte' : l[3] === 'partiel' ? 'info' : 'succes'}>
                    {l[3]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Titre surtitre="Comment enrichir">Trois gestes, et un seul chemin d’écriture</Titre>
      <ol className="mb-7 max-w-[76ch] list-decimal space-y-2 pl-5 text-sm">
        <li>
          <strong>Un atelier par direction</strong>, sur le questionnaire à quatre onglets — 68
          questions, et une ligne de restitution par lien complet de la chaîne.
        </li>
        <li>
          <strong>L’import dans la couche source</strong> (<code>src_*</code>), sans correction
          manuelle : ce qui a été dit reste ce qui a été dit, et une contradiction se voit.
        </li>
        <li>
          <strong>La reconstruction du référentiel</strong> (<code>ref_*</code>) par les
          transformations versionnées, avec les contrôles qui bloquent en cas d’échec.
        </li>
      </ol>

      <Encadre titre="Ce que nous n’avons pas fait, et pourquoi c’est une décision" ton="accent">
        <p>
          Aucun annuaire nominatif n’a été reconstitué depuis les réseaux sociaux, alors que c’était
          techniquement à portée. Les personnes affichées siègent dans des instances dont la
          composition est publiée par l’établissement. L’annuaire des équipes vit dans votre Entra
          ID : il est à vous, et il entrera dans le référentiel en atelier, avec votre accord.
        </p>
      </Encadre>

      <Provenance source={socle.source} date={socle.genere_le} />
    </div>
  )
}
