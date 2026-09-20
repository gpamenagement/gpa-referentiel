import {
  Agent, Ajouter, Barres, BaseDonnees, Carte, Chargement, Chercher, Cible, Connexion,
  Croissance, Document, Dupliquer, Envoyer, Erreur, Etincelle, Filtrer, Flux, Horloge,
  Modifier, Notification, Partager, Rafraichir, Supprimer, Tableau, Telecharger,
  Televerser, Trier, Alerte, Valide, Verrou,
} from './icones-animees'

/* Le catalogue vit hors du fichier de composants : un module qui exporte à la
   fois des composants et une constante casse le rafraîchissement à chaud de
   Vite — l'état de la page est perdu à chaque frappe dans ce fichier. */

/** Le catalogue, pour la vitrine et pour la recherche. */
export const ICONES_ANIMEES = [
  { cle: 'telecharger', nom: 'Télécharger', geste: 'la flèche descend', C: Telecharger },
  { cle: 'televerser', nom: 'Téléverser', geste: 'la flèche monte', C: Televerser },
  { cle: 'envoyer', nom: 'Envoyer', geste: "l'avion part", C: Envoyer },
  { cle: 'rafraichir', nom: 'Rafraîchir', geste: 'un tour complet', C: Rafraichir },
  { cle: 'chercher', nom: 'Chercher', geste: 'la loupe balaie', C: Chercher },
  { cle: 'filtrer', nom: 'Filtrer', geste: 'les curseurs glissent', C: Filtrer },
  { cle: 'trier', nom: 'Trier', geste: 'les flèches se croisent', C: Trier },
  { cle: 'ajouter', nom: 'Ajouter', geste: 'la croix pivote', C: Ajouter },
  { cle: 'supprimer', nom: 'Supprimer', geste: 'le couvercle se soulève', C: Supprimer },
  { cle: 'modifier', nom: 'Modifier', geste: 'le crayon écrit', C: Modifier },
  { cle: 'dupliquer', nom: 'Dupliquer', geste: 'la copie se décale', C: Dupliquer },
  { cle: 'partager', nom: 'Partager', geste: 'les nœuds s\'écartent', C: Partager },
  { cle: 'valide', nom: 'Validé', geste: 'la coche se dessine', C: Valide },
  { cle: 'erreur', nom: 'Erreur', geste: 'le cercle se secoue', C: Erreur },
  { cle: 'alerte', nom: 'Alerte', geste: 'le point clignote', C: Alerte },
  { cle: 'chargement', nom: 'Chargement', geste: 'rotation continue', C: Chargement },
  { cle: 'notification', nom: 'Notification', geste: 'la cloche sonne', C: Notification },
  { cle: 'verrou', nom: 'Verrou', geste: "l'anse s'ouvre", C: Verrou },
  { cle: 'croissance', nom: 'Croissance', geste: 'la courbe se trace', C: Croissance },
  { cle: 'barres', nom: 'Barres', geste: 'elles poussent à la file', C: Barres },
  { cle: 'base', nom: 'Base de données', geste: 'une couche se détache', C: BaseDonnees },
  { cle: 'document', nom: 'Document', geste: 'la corne se plie', C: Document },
  { cle: 'tableau', nom: 'Tableau', geste: 'les colonnes tombent', C: Tableau },
  { cle: 'carte', nom: 'Carte', geste: "l'épingle se pose", C: Carte },
  { cle: 'agent', nom: 'Agent', geste: 'il cligne des yeux', C: Agent },
  { cle: 'etincelle', nom: 'Étincelle', geste: 'les éclats scintillent', C: Etincelle },
  { cle: 'flux', nom: 'Flux', geste: 'les tirets circulent', C: Flux },
  { cle: 'connexion', nom: 'Connexion', geste: 'les maillons se tendent', C: Connexion },
  { cle: 'horloge', nom: 'Horloge', geste: 'les aiguilles tournent', C: Horloge },
  { cle: 'cible', nom: 'Cible', geste: 'les cercles se resserrent', C: Cible },
] as const
