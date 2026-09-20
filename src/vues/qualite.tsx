import { Gauge, ShieldCheck, FileSearch } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { socle, nombre, euros, applications } from '@/donnees/socle'
import { Titre, Tuiles, Tuile, Encadre, Provenance } from './_ui'

/**
 * Qualité et confiance — la vue qui porte la North Star.
 *
 * Elle ne mesure pas notre activité (nombre d'entrées saisies) mais ce que GPA
 * peut faire du référentiel : combien de liens de la chaîne portent un
 * propriétaire nommé et une vérification datée. Aujourd'hui la réponse est
 * zéro, et c'est le chiffre honnête — il n'y a pas d'atelier tenu.
 */
export default function Qualite() {
  const c = socle.compteurs
  const total = c.noeuds
  const orphelins = c.orphelins
  const relies = total - orphelins
  const sansEditeur = applications.filter(a => !a.editeur).length

  const controles = [
    {
      nom: 'Chaque entrée porte un niveau de preuve',
      etat: 'passe' as const,
      detail: `${nombre(applications.length)} applications, ${nombre(socle.objets.length)} objets, ${nombre(socle.personnes.length)} personnes — aucune ligne sans source`,
    },
    {
      nom: 'Aucune nomenclature en texte libre',
      etat: 'partiel' as const,
      detail: 'les identifiants sont stables, mais les 13 listes contrôlées (93 valeurs) ne sont pas encore appliquées aux lignes',
    },
    {
      nom: 'Chaque objet de données a un système maître',
      etat: 'echoue' as const,
      detail: 'aucun système maître n’est connu — c’est la première question de chaque atelier',
    },
    {
      nom: 'Chaque objet de données a un Data Owner',
      etat: 'echoue' as const,
      detail: 'le rôle n’existe pas encore dans l’organisation ; c’est l’exigence la plus difficile du CCTP',
    },
    {
      nom: 'Aucun nœud orphelin',
      etat: 'echoue' as const,
      detail: `${nombre(orphelins)} nœuds sur ${nombre(total)} ne sont reliés à rien de connu`,
    },
    {
      nom: 'Chaque application a un éditeur identifié',
      etat: 'partiel' as const,
      detail: `${nombre(sansEditeur)} applications sur ${nombre(applications.length)} sans éditeur nommé`,
    },
  ]

  const tons = { passe: 'succes', partiel: 'alerte', echoue: 'danger' } as const
  const mots = { passe: 'passe', partiel: 'partiel', echoue: 'à faire' } as const

  return (
    <div>
      <Titre surtitre="L’indicateur qui compte" icone={<Gauge />}
             note="Un référentiel ne se juge pas au nombre de lignes qu’il contient, mais au nombre de liens qu’on peut suivre sans demander à personne. C’est ce que cette vue mesure — et elle affiche zéro là où c’est zéro.">
        Qualité et confiance du référentiel
      </Titre>

      <Tuiles>
        <Tuile valeur="0" libelle="Liens complets et vérifiés" ton="accent"
               precision="propriétaire nommé et vérification de moins de 90 jours — l’indicateur cible" />
        <Tuile valeur={`${Math.round((relies / total) * 100)} %`} libelle="Nœuds reliés"
               precision={`${nombre(relies)} sur ${nombre(total)}`} />
        <Tuile valeur={`3 / 6`} libelle="Maillons de la chaîne"
               precision="processus, objets, applications — restent fonctionnalités, interfaces, règles" />
        <Tuile valeur={socle.genere_le} libelle="Dernier relevé"
               precision="la fraîcheur est une donnée, pas une note de bas de page" />
      </Tuiles>

      <Titre surtitre="Six contrôles" icone={<ShieldCheck />}>Ce qui passe, ce qui ne passe pas encore</Titre>
      <div className="mb-6 space-y-2">
        {controles.map(x => (
          <Card key={x.nom} profondeur="plat" className="flex items-start gap-3 p-3">
            <Badge ton={tons[x.etat]}>{mots[x.etat]}</Badge>
            <div>
              <p className="text-sm font-medium">{x.nom}</p>
              <p className="text-sm text-muted-foreground">{x.detail}</p>
            </div>
          </Card>
        ))}
      </div>

      <Titre surtitre="Ce que les marchés publics apprennent" icone={<FileSearch />}>L’achat comme indice sur le SI</Titre>
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <p className="gpa-surtitre">Volume</p>
          <span className="gpa-filet" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {nombre(socle.marches.total)} avis relevés, {nombre(socle.marches.avec_montant)} avec un
            montant, {euros(socle.marches.montant_total_eur)} cumulés. Un avis d’attribution nomme
            souvent l’outil qu’une direction utilise — c’est ainsi que trois applications de cette
            cartographie ont été trouvées.
          </p>
        </Card>
        <Card className="p-4">
          <p className="gpa-surtitre">Titulaires les plus présents</p>
          <span className="gpa-filet" aria-hidden />
          <ul className="space-y-1 text-sm">
            {socle.marches.top_titulaires.slice(0, 6).map(([t, n]) => (
              <li key={t} className="flex items-start justify-between gap-2">
                <span className="min-w-0 truncate">{t}</span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{n}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Encadre titre="Pourquoi la première tuile affiche zéro" ton="accent">
        <p>
          Parce qu’aucun atelier n’a eu lieu. Un référentiel qui afficherait un taux flatteur avant
          le premier entretien mesurerait notre travail de collecte, pas la capacité de GPA à
          répondre à une question. La tuile bougera au premier objet de données doté d’un
          propriétaire nommé — et c’est le seul chiffre que nous proposons de suivre en comité.
        </p>
      </Encadre>

      <Provenance source={socle.source} date={socle.genere_le} />
    </div>
  )
}
