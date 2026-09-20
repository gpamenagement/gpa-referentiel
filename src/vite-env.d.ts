/// <reference types="vite/client" />

/**
 * Les variables d'environnement lues par l'application.
 *
 * Les déclarer typées, plutôt que de se contenter de la référence Vite : une
 * faute de frappe sur `import.meta.env.VITE_...` rend `undefined` en silence,
 * et le défaut ne se voit qu'en production — là où la variable existe et où
 * elle est mal lue.
 */
interface ImportMetaEnv {
  /**
   * Licence AG Grid Enterprise. Absente, l'application reste en Community et
   * le paquet Enterprise n'est pas téléchargé. Convention partagée avec
   * flowimmo — même nom, même comportement.
   */
  readonly VITE_AG_GRID_LICENSE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
