/**
 * Le socle de données, typé.
 *
 * Généré par `scripts/importer_base_gpa.py` depuis la base publique du dossier
 * d'offre. Aucune vue ne lit un autre fichier : une seule source, un seul
 * chemin de lecture — c'est ce qui rend le référentiel vérifiable.
 *
 * `socle.json` est versionné. Il n'est pas une copie de commodité : c'est
 * l'état daté de ce que nous savions au jour du relevé, et une vue doit pouvoir
 * afficher cette date.
 */
import brut from './socle.json'

export type Preuve = string | null

export type Application = {
  cle: string
  nom: string
  categorie: string | null
  role: string | null
  editeur: string | null
  volumetrie: unknown
  preuve: Preuve
  citation: string | null
  remarque: string | null
  /** Le logo de l'éditeur quand l'application en porte le nom — sinon null,
   *  jamais un logo approchant. */
  logo: string | null
}

export type ObjetDeDonnees = {
  cle: string
  nom: string
  definition: string | null
  processus: string[]
  applications: string[]
  attributs: string[]
  indice: string | null
  questions: string[]
  preuve: Preuve
}

export type Personne = {
  cle: string
  nom: string | null
  prenom: string | null
  fonction: string | null
  direction: string | null
  depuis: string | null
  preuve: Preuve
  source: string | null
  url: string | null
}

export type Operation = {
  cle: string
  nom: string | null
  commune: string | null
  departements: string[]
  dt: string | null
  types: string[]
  surface_ha: number | null
  logements: number | null
  photo: string | null
  url: string | null
  /** Le site publie un périmètre — mais ses coordonnées ne sont PAS dans le jeu
   *  public : seul le nombre de points l'est. */
  perimetre_publie: boolean
  perimetre_nb_points: number | null
  localisation: { lat: number; lon: number } | null
}

export type Entite = { nom: string; statut: string | null; note: string | null }

/** Un champ du catalogue — type et exemple viennent des données, pas d'une saisie. */
export type Champ = {
  nom: string
  description: string | null
  type: string | null
  exemple: string | null
  regles: string[]
  cle: boolean
  obligatoire: boolean
}

export type EntiteCatalogue = {
  cle: string
  modele: string
  couche: 'socle' | 'referentiel'
  /** L'objet de données du référentiel auquel ce modèle correspond. */
  objet: string | null
  source_applicative: string | null
  description: string
  proprietaire: string | null
  classification: string | null
  fraicheur: string | null
  destinataires: string | null
  lignes: number | null
  champs: Champ[]
  champs_documentes: number
  /** Trois lignes réelles du jeu source — vides pour un modèle calculé. */
  echantillon: Record<string, string>[]
}

/** `de` alimente `vers` — lu dans les `ref()` du SQL, la seule déclaration
 *  de lignage qui ne puisse pas mentir puisqu'elle fait tourner le calcul. */
export type RelationModele = { de: string; vers: string; type: string }

export type Noeud = { id: string; libelle: string; type: TypeNoeud; preuve: Preuve }
export type Arete = { source: string; cible: string; type: string }
export type TypeNoeud = 'processus' | 'application' | 'objet' | 'fonctionnalite' | 'interface' | 'regle'

export type Socle = {
  genere_le: string
  source: string
  avertissement: string | null
  compteurs: Record<string, number>
  catalogue: {
    source?: string; note?: string
    entites: EntiteCatalogue[]
    relations: RelationModele[]
  }
  niveaux_de_preuve: unknown[]
  applications: Application[]
  applications_hypothese: Application[]
  objets: ObjetDeDonnees[]
  processus: string[]
  organisation: {
    directions_territoriales: Entite[]
    directions_fonctionnelles: Entite[]
    directions_support: Entite[]
    filiales: Entite[]
    directions_cctp: { nom: string; preuve: string }[]
  }
  personnes: Personne[]
  operations: Operation[]
  marches: {
    total: number
    avec_montant: number
    montant_total_eur: number
    par_annee: Record<string, number>
    top_titulaires: [string, number][]
  }
  graphe: { noeuds: Noeud[]; aretes: Arete[]; orphelins: string[] }
}

export const socle = brut as unknown as Socle

/** Toutes les applications, inventaire et hypothèses confondus — dans cet ordre. */
export const applications: Application[] = [
  ...socle.applications,
  ...socle.applications_hypothese,
]

/**
 * Le ton d'étiquette d'un niveau de preuve.
 *
 * Une seule table, ici, pour que la même preuve porte la même couleur dans
 * toutes les vues. Deux vues qui teintent différemment la même valeur font
 * douter de la donnée, pas du style.
 */
export function tonDePreuve(preuve: Preuve): 'succes' | 'info' | 'alerte' | 'neutre' {
  if (!preuve) return 'neutre'
  if (preuve.includes('CCTP')) return 'succes'
  if (preuve.includes('marché public') || preuve.includes('offre d')) return 'info'
  if (preuve.includes('hypothèse') || preuve.includes('déduit') || preuve.includes('citée')) return 'alerte'
  if (preuve.includes('prouv')) return 'succes'
  if (preuve.includes('confirmer')) return 'alerte'
  return 'neutre'
}

export function nombre(n: number): string {
  return n.toLocaleString('fr-FR')
}

export function euros(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M€`
  return `${nombre(Math.round(n))} €`
}
