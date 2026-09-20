import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { socle, nombre, euros } from '@/donnees/socle'
import { A_VENIR, VUES } from '@/registre'
import { Titre, Tuile, Tuiles, Encadre, Provenance } from './_ui'

/**
 * L'accueil dit trois choses, dans cet ordre : ce que contient le référentiel,
 * d'où il vient, et ce qui lui manque. La troisième est celle qui compte — un
 * référentiel qui se présente comme complet n'est pas crédible le jour où on
 * l'ouvre.
 */
export default function Accueil() {
  const c = socle.compteurs
  const parPreuve = new Map<string, number>()
  for (const a of [...socle.applications, ...socle.applications_hypothese]) {
    const k = a.preuve ?? 'sans source'
    parPreuve.set(k, (parPreuve.get(k) ?? 0) + 1)
  }

  return (
    <div>
      <section className="gpa-aplat-bleu gpa-motif-blanc mb-7 px-6 py-8">
        <p className="gpa-surtitre text-white/70">Marché 202600092 — cartographie SI, référentiel fonctionnel et schéma directeur</p>
        <h2 className="mt-2 max-w-[34ch] font-display text-[28px] leading-tight font-medium text-white">
          La première version du référentiel, livrée avec l’offre.
        </h2>
        <span className="gpa-filet gpa-filet--blanc" aria-hidden />
        <p className="max-w-[70ch] text-[15px] text-white/85">
          Grand Paris Aménagement est un établissement public : une part considérable de son
          patrimoine informationnel est déjà publique. Nous l’avons rassemblée et structurée
          avant le dépôt de l’offre. Elle est incomplète, et chaque entrée dit pourquoi.
        </p>
      </section>

      <Tuiles>
        <Tuile valeur={nombre(c.applications + c.applications_hypothese)} libelle="Applications"
               precision={`${c.applications} nommées par le CCTP, ${c.applications_hypothese} en hypothèse`} />
        <Tuile valeur={nombre(c.objets)} libelle="Objets de données"
               precision="déduits du métier d’aménageur, à confirmer en atelier" />
        <Tuile valeur={nombre(c.operations)} libelle="Opérations"
               precision={`dont ${c.operations_avec_perimetre} avec leur périmètre géographique`} />
        <Tuile valeur={nombre(c.aretes)} libelle="Liens de la chaîne"
               precision={`${c.noeuds} nœuds, ${c.orphelins} encore orphelins`} ton="accent" />
      </Tuiles>

      <Titre surtitre="Ce que porte cette version">Cinq jeux, cinq provenances</Titre>
      <div className="mb-7 grid gap-3 md:grid-cols-2">
        {[
          { quoi: 'Les opérations d’aménagement', source: 'la carte publique des opérations de GPA', statut: 'réel', vue: 'operations' },
          { quoi: 'Les directions, filiales et instances', source: 'le site officiel et la presse institutionnelle', statut: 'réel', vue: 'organisation' },
          { quoi: 'Les applications et le SI', source: 'le CCTP, les offres d’emploi, les avis d’attribution', statut: 'réel, gradué', vue: 'applications' },
          { quoi: 'Les personnes', source: 'instances de gouvernance publiées', statut: 'partiel', vue: 'organisation' },
          { quoi: 'Les objets de données', source: 'déduits des applications et du métier', statut: 'hypothèse', vue: 'objets' },
          { quoi: 'Les marchés publics', source: 'API BOAMP (DILA)', statut: 'réel', vue: 'qualite' },
        ].map(l => (
          <Card key={l.quoi} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{l.quoi}</p>
              <Badge ton={l.statut === 'hypothèse' ? 'alerte' : l.statut === 'partiel' ? 'info' : 'succes'}>
                {l.statut}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{l.source}</p>
            <a href={`#${l.vue}`} className="mt-2 inline-block text-sm text-[var(--gpa-bleu)] underline underline-offset-4">
              {VUES.find(v => v.cle === l.vue)?.libelle}
            </a>
          </Card>
        ))}
      </div>

      <Titre surtitre="Ce qui manque, et nous le disons">Deux choses ne s’obtiennent pas de l’extérieur</Titre>
      <Encadre titre="Le catalogue de données réel" ton="accent">
        <p>
          Il ne s’obtient que par les accès aux applications. Les {nombre(c.objets)} objets affichés
          sont une <strong>hypothèse de travail</strong> : aucun n’a été observé dans le SI de GPA.
          Chaque fiche porte les questions que nous poserons en atelier.
        </p>
      </Encadre>
      <Encadre titre="L’annuaire nominatif">
        <p>
          Les {nombre(c.personnes)} personnes affichées sont des instances de gouvernance publiées —
          conseil d’administration, comité de direction, rôles nommés dans un avis public. L’annuaire
          des équipes, lui, vit dans l’Entra ID de l’établissement et viendra en atelier. Nous
          n’avons reconstitué aucun trombinoscope à partir des réseaux sociaux.
        </p>
      </Encadre>

      <Titre surtitre="Les vues du contrat">Ce qui s’ouvre au fil de la mission</Titre>
      <div className="mb-2 grid gap-2 md:grid-cols-2">
        {A_VENIR.map(v => (
          <Card key={v.libelle} profondeur="plat" className="flex items-start gap-3 p-3">
            <Badge ton="neutre">{v.livrable}</Badge>
            <div>
              <p className="text-sm font-medium">{v.libelle}</p>
              <p className="text-sm text-muted-foreground">{v.quoi}</p>
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {nombre(socle.marches.total)} marchés publics de l’établissement sont également en base,
        pour {euros(socle.marches.montant_total_eur)} cumulés sur {Object.keys(socle.marches.par_annee).length} années —
        ils servent à identifier les applications par leurs avis d’attribution.
      </p>

      <Provenance source={socle.source} date={socle.genere_le} />
    </div>
  )
}
