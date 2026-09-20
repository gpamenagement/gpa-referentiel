import {
  AllCommunityModule, ModuleRegistry, themeQuartz, type ColDef,
} from 'ag-grid-community'

/* Le socle AG Grid — enregistrement des modules, licence, thème et aides.
   Il vit hors du fichier de composant : un module qui exporte à la fois un
   composant et des constantes casse le rafraîchissement à chaud de Vite,
   l'état de la page est perdu à chaque frappe. */

ModuleRegistry.registerModules([AllCommunityModule])

/**
 * La licence Enterprise, chargée seulement si la clé existe.
 *
 * Convention reprise de flowimmo : `VITE_AG_GRID_LICENSE_KEY`. Sans clé, le
 * paquet Enterprise n'est **pas téléchargé du tout** — l'application reste en
 * Community, et on ne paie pas 400 ko pour des modules qu'on n'a pas le droit
 * d'utiliser.
 *
 * Sans licence, AG Grid affiche un filigrane d'évaluation dès qu'un module
 * Enterprise est employé. Ce n'est pas un défaut à masquer : c'est le contrat
 * de licence. Soit la clé est posée, soit on reste sur les modules Community —
 * qui couvrent déjà tri, filtres, pagination et virtualisation.
 */
const cleLicence = import.meta.env.VITE_AG_GRID_LICENSE_KEY

/** Vrai si les modules Enterprise sont chargés — donc utilisables. */
export const entrepriseActive = Boolean(cleLicence)

if (cleLicence) {
  void import('ag-grid-enterprise').then(async entreprise => {
    entreprise.LicenseManager?.setLicenseKey(cleLicence)
    // Enregistrer les modules, et pas seulement poser la clé : sans cet appel,
    // `rowGroup` et `aggFunc` lèvent « error #200 — module not registered ».
    // La clé autorise, elle ne charge pas.
    const { AllEnterpriseModule } = entreprise as unknown as { AllEnterpriseModule?: unknown }
    if (AllEnterpriseModule) ModuleRegistry.registerModules([AllEnterpriseModule as never])
  })
}

/**
 * Le thème Flowmetrik.
 *
 * Chaque paramètre pointe sur un token : changer la charte change la grille.
 * Aucune couleur n'est écrite ici — c'est la règle qui vaut pour tout le socle,
 * et elle vaut aussi pour une dépendance tierce.
 */
export const themeFlowmetrik = themeQuartz.withParams({
  // Surfaces
  backgroundColor: 'var(--card)',
  foregroundColor: 'var(--foreground)',
  headerBackgroundColor: 'var(--secondary)',
  headerTextColor: 'var(--muted-foreground)',
  oddRowBackgroundColor: 'transparent',
  rowHoverColor: 'color-mix(in srgb, var(--accent) 60%, transparent)',
  selectedRowBackgroundColor: 'color-mix(in srgb, var(--foreground) 7%, transparent)',
  // Filets — la grille reprend le filet hairline de la charte
  borderColor: 'var(--border)',
  rowBorder: true,
  headerRowBorder: true,
  columnBorder: false,

  // Typographie. L'en-tête est en étiquette de charte : Space Grotesk,
  // capitales, interlettrage ouvert — c'est ce qui distingue un tableau de
  // données d'un tableau de mise en page.
  fontFamily: 'var(--font-family-body)',
  fontSize: '14px',
  headerFontFamily: 'var(--font-family-data)',
  headerFontSize: '11px',
  headerFontWeight: 700,
  // Les chiffres sont tabulaires. Sans ça, une colonne de montants danse
  // d'une ligne à l'autre et devient illisible dès qu'on la compare du regard.
  cellFontFamily: 'var(--font-family-body)',

  // Géométrie — mode operate : rayon 6, densité forte
  borderRadius: 'var(--mode-radius-container)',
  wrapperBorderRadius: 'var(--mode-radius-container)',
  cellHorizontalPadding: 12,
  rowHeight: 40,
  headerHeight: 38,

  // Interaction. L'accent de filiale ne sert QU'ICI : le focus et la sélection
  // de colonne. C'est un usage ponctuel, très en dessous du plafond de 5 %.
  accentColor: 'var(--color-trace)',
  inputFocusBorder: '1px solid var(--ring)',
  focusShadow: '0 0 0 3px color-mix(in srgb, var(--ring) 40%, transparent)',
})

/** Aligne une colonne de nombres : à droite ET en chiffres tabulaires. */
export const colonneNombre = <T,>(c: ColDef<T>): ColDef<T> => ({
  type: 'numericColumn',
  cellClass: 'tabular-nums',
  ...c,
})
