/**
 * Le registre des vues — source unique de la navigation.
 *
 * Patron repris de `showcase/registre.ts` du socle : le menu, le titre de page
 * et le chargement paresseux sortent tous d'ici. Ajouter une vue, c'est ajouter
 * une ligne ; il n'y a pas de second endroit à tenir, donc pas de menu qui
 * dérive de son contenu.
 *
 * `cle` est aussi l'adresse : `#matrice` s'envoie par courriel et ouvre la vue.
 * Une entité citée doit être atteignable — un identifiant nu n'est pas une vue.
 */
import { lazy, type ComponentType } from 'react'

export type Famille = 'referentiel' | 'analyses' | 'territoire' | 'methode'

export type Vue = {
  cle: string
  libelle: string
  titre: string
  sousTitre: string
  famille: Famille
  /** Le livrable du CCTP que la vue produit, s'il y en a un. */
  livrable?: string
  charge: () => Promise<{ default: ComponentType }>
}

export const VUES: Vue[] = [
  {
    cle: 'accueil',
    libelle: 'Accueil',
    titre: 'Référentiel SI et cartographie',
    sousTitre: 'Première version, livrée avec l’offre — marché 202600092',
    famille: 'referentiel',
    charge: () => import('./vues/accueil'),
  },
  {
    cle: 'applications',
    libelle: 'Applications',
    titre: 'Cartographie applicative',
    sousTitre: 'Une fiche par application, avec le niveau de preuve de chaque entrée',
    famille: 'referentiel',
    livrable: 'Livrable 10',
    charge: () => import('./vues/applications'),
  },
  {
    cle: 'objets',
    libelle: 'Objets de données',
    titre: 'Objets de données et référentiels',
    sousTitre: 'Les onze objets du métier d’aménageur, et les questions à poser en atelier',
    famille: 'referentiel',
    livrable: 'Livrable 12',
    charge: () => import('./vues/objets'),
  },
  {
    cle: 'carte',
    libelle: 'Carte du SI',
    titre: 'Carte du système d’information',
    sousTitre: 'Processus → objets de données → applications, parcourue dans les deux sens',
    famille: 'referentiel',
    livrable: 'Livrables 14 et 16',
    charge: () => import('./vues/carte-si'),
  },
  {
    cle: 'organisation',
    libelle: 'Organisation',
    titre: 'Organisation, filiales et gouvernance',
    sousTitre: 'Directions, entités liées et instances publiées',
    famille: 'referentiel',
    charge: () => import('./vues/organisation'),
  },
  {
    cle: 'operations',
    libelle: 'Opérations',
    titre: 'Opérations d’aménagement',
    sousTitre: '58 opérations publiées, dont 46 avec leur périmètre',
    famille: 'territoire',
    livrable: 'Livrable 9',
    charge: () => import('./vues/operations'),
  },
  {
    cle: 'qualite',
    libelle: 'Qualité',
    titre: 'Qualité et confiance du référentiel',
    sousTitre: 'Ce que le référentiel sait, et ce qu’il ne sait pas encore',
    famille: 'analyses',
    charge: () => import('./vues/qualite'),
  },
  {
    cle: 'methodologie',
    libelle: 'Méthodologie',
    titre: 'Méthodologie',
    sousTitre: 'Comment chaque entrée a été obtenue, et comment l’enrichir',
    famille: 'methode',
    livrable: 'Niveau 0 du CCTP',
    charge: () => import('./vues/methodologie'),
  },
]

/** Les vues du contrat qui ne sont pas encore ouvertes — déclarées, pas cachées. */
export const A_VENIR: { libelle: string; livrable: string; quoi: string }[] = [
  { libelle: 'Processus métiers', livrable: 'Livrable 9', quoi: 'la cartographie des processus du périmètre retenu, une fois les ateliers tenus' },
  { libelle: 'Fonctionnalités opérationnelles', livrable: 'Livrable 11', quoi: 'le niveau que seul un atelier par direction peut remplir' },
  { libelle: 'Interfaces et flux', livrable: 'Livrables 13 et 17', quoi: 'les trois familles du CCTP §5 — automatisées, semi-automatisées, manuelles' },
  { libelle: 'Redondances', livrable: 'Livrable 15', quoi: 'saisies doubles et fonctionnalités en doublon, dérivées de la matrice' },
  { libelle: 'Gouvernance des données', livrable: 'Livrable 18', quoi: 'Owner, Steward, Custodian — et les objets orphelins' },
  { libelle: 'Schéma directeur', livrable: 'Livrables 21 à 23', quoi: 'vision cible, urbanisation et feuille de route' },
]

export function vueParCle(cle: string): Vue {
  return VUES.find(v => v.cle === cle) ?? VUES[0]
}

export const composant = (v: Vue) => lazy(v.charge)
