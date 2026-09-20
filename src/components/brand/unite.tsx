import { createContext, useContext, type ReactNode } from 'react'
import type { Unite } from './unites'

/**
 * Le contrat de filiale, appliqué à une application entière ou à une seule
 * zone : « le squelette Flowmetrik + un seul groupe de tokens remplacé ».
 *
 * Poser `data-unit` suffit — la surcharge vit dans tokens.css et ne touche que
 * les cinq variables d'accent. Aucun composant n'a besoin de savoir dans quelle
 * filiale il tourne, et c'est le but : un composant qui teste la filiale est le
 * début d'une deuxième bibliothèque.
 */
const Ctx = createContext<Unite>('flowmetrik')
export const useUnite = () => useContext(Ctx)

export function FournisseurUnite(
  { unite, children, className }: { unite: Unite; children: ReactNode; className?: string },
) {
  return (
    <Ctx.Provider value={unite}>
      {/* `flowmetrik` est le défaut de :root — poser l'attribut ne servirait
          qu'à laisser croire qu'il surcharge quelque chose. */}
      <div data-unit={unite === 'flowmetrik' ? undefined : unite} className={className}>
        {children}
      </div>
    </Ctx.Provider>
  )
}
