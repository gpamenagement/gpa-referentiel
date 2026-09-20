/* La table des filiales, hors du fichier de composant : même raison que pour
   les variantes du bouton — un module qui exporte un composant ET une constante
   casse le rafraîchissement à chaud. */

export const UNITES = {
  flowmetrik: { nom: 'Flowmetrik', domaine: 'Agence IA — marque mère' },
  flowspend: { nom: 'FlowSpend', domaine: 'Spend et procurement' },
  flowimmo: { nom: 'FlowImmo', domaine: 'Data et services immobilier' },
  flowenergy: { nom: 'FlowEnergy', domaine: 'Data et IA bâtiment' },
  flowretail: { nom: 'FlowRetail', domaine: 'Implantation et perf retail' },
  flowbank: { nom: 'FlowBank', domaine: 'Marchés financiers et banque' },
  flowgov: { nom: 'FlowGov', domaine: 'Institutions publiques' },
} as const

export type Unite = keyof typeof UNITES
