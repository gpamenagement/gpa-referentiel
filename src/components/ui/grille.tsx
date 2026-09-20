import { useMemo, type ReactNode } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { AgGridReactProps } from 'ag-grid-react'
import type { ColDef, GridOptions } from 'ag-grid-community'
import { AG_GRID_LOCALE_FR } from '@ag-grid-community/locale'
import { cn } from '@/lib/utils'
import { themeFlowmetrik } from './grille-theme'

/**
 * La grille de données — AG Grid, habillé aux tokens Flowmetrik.
 *
 * Elle n'est PAS le tableau par défaut. `TableauDonnees` (`@/features/donnees`)
 * couvre tout ce qui tient en quelques centaines de lignes : recherche, tri,
 * quatre états, zéro dépendance. AG Grid coûte ~400 ko et une licence pour ses
 * modules Enterprise — il se justifie quand on a besoin de ce qu'il est seul à
 * faire :
 *
 *   colonnes figées · groupement de lignes · agrégation · tableau croisé ·
 *   export Excel · édition de masse · virtualisation au-delà de 10 000 lignes
 *
 * Sortir AG Grid pour afficher vingt lignes est le sur-outillage le plus
 * courant d'une application de gestion, et il se paie au premier chargement.
 *
 * ── L'habillage ────────────────────────────────────────────────────────────
 * On passe par l'API de thème (`themeQuartz.withParams`) et NON par les
 * feuilles CSS héritées (`ag-grid.css` + `ag-theme-quartz.css`). Deux raisons :
 *
 *  - les paramètres acceptent des `var(--…)`, donc la grille suit nos tokens —
 *    y compris la bascule clair/sombre et l'accent de filiale — sans qu'on
 *    écrive une seule couleur ;
 *  - importer les CSS héritées ET l'API de thème produit une grille à moitié
 *    stylée par chacune, et le résultat dépend de l'ordre des imports.
 *
 * C'est la même approche que `carrefourTheme` sur danmdata, avec les tokens
 * Flowmetrik à la place du bleu Carrefour écrit en dur.
 */

export type ProprietesGrille<T> = AgGridReactProps<T> & {
  colonnes: ColDef<T>[]
  lignes: T[]
  /** Hauteur du cadre. AG Grid virtualise : il lui faut une hauteur bornée. */
  hauteur?: number | string
  className?: string
  barreOutils?: ReactNode
}

/**
 * Les réglages qui devraient être le défaut d'AG Grid et ne le sont pas.
 * Les redéclarer sur chaque grille est la façon la plus sûre de les faire
 * diverger d'un écran à l'autre.
 */
const DEFAUTS: GridOptions = {
  defaultColDef: {
    sortable: true,
    resizable: true,
    filter: true,
    // Sans `flex`, les colonnes gardent leur largeur calculée et laissent un
    // vide à droite dès que la fenêtre s'élargit.
    flex: 1,
    minWidth: 110,
  },
  // Français : sans locale, les menus, les filtres et la pagination sortent en
  // anglais au milieu d'une application française.
  localeText: AG_GRID_LOCALE_FR,
  animateRows: true,
  // Le bandeau « aucune ligne » d'AG Grid est un texte nu au centre. On le
  // remplace par le nôtre à l'appel, via `overlayNoRowsTemplate`.
  suppressCellFocus: false,
  pagination: true,
  paginationPageSize: 50,
  paginationPageSizeSelector: [25, 50, 100, 200],
}

export function Grille<T>(
  { colonnes, lignes, hauteur = 460, className, barreOutils, ...reste }: ProprietesGrille<T>,
) {
  // Les colonnes sont mémoïsées : un tableau neuf à chaque rendu fait
  // reconstruire toute la grille, et l'utilisateur perd son tri, sa sélection
  // et sa position de défilement à chaque frappe ailleurs dans la page.
  const cols = useMemo(() => colonnes, [colonnes])

  return (
    <div className={cn('overflow-hidden rounded-[var(--mode-radius-container)]',
                       'border border-border bg-card relief-pose', className)}>
      {barreOutils && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          {barreOutils}
        </div>
      )}
      <div style={{ height: hauteur }}>
        <AgGridReact<T>
          theme={themeFlowmetrik}
          columnDefs={cols}
          rowData={lignes}
          {...DEFAUTS}
          {...reste}
        />
      </div>
    </div>
  )
}
