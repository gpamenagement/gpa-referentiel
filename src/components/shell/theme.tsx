import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Le thème. Deux pièges, tous deux vécus :
 *
 *  - la classe se pose sur `<html>`, pas sur un div de l'application : sinon
 *    les portails Radix (modale, menu, infobulle) sortent HORS du sous-arbre
 *    thémé et s'affichent en clair par-dessus une application sombre ;
 *  - la valeur est lue AVANT le premier rendu et non dans un effet, sinon la
 *    page clignote en blanc à chaque chargement.
 */
type Theme = 'light' | 'dark'
const Ctx = createContext<{ theme: Theme; bascule: () => void }>({ theme: 'light', bascule: () => {} })
export const useTheme = () => useContext(Ctx)

function initial(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stocke = localStorage.getItem('fm-theme') as Theme | null
  if (stocke) return stocke
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function FournisseurTheme({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initial)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('fm-theme', theme)
  }, [theme])
  // L'objet est mémoïsé : un littéral neuf à chaque rendu re-rend TOUT ce qui
  // consomme le contexte, y compris les tableaux, à chaque frappe ailleurs.
  const valeur = useMemo(
    () => ({ theme, bascule: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')) }),
    [theme],
  )
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>
}

export function BasculeTheme() {
  const { theme, bascule } = useTheme()
  return (
    <Button variant="discret" taille="icone" onClick={bascule}
            aria-label={theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}>
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}
