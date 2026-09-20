import { useEffect, useMemo, useRef } from 'react'
import { Command } from 'cmdk'
import { ArrowRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * La palette de commandes — ⌘K. Reprise de flowsequences (`Palette.tsx`).
 *
 * Deux choses qui ne se devinent pas :
 *
 *  - le raccourci écoute `metaKey || ctrlKey` : sur un Mac c'est ⌘, sur Linux
 *    et Windows c'est Ctrl, et ne gérer que l'un des deux rend la palette
 *    inaccessible à la moitié des postes ;
 *  - `preventDefault` est obligatoire, sinon Chrome ouvre sa propre recherche
 *    de favoris par-dessus et la palette s'ouvre derrière, invisible.
 */

export type Commande = {
  id: string; libelle: string; groupe: string; indice?: string
  icone?: React.ReactNode; action?: () => void
}

export function PaletteCommandes(
  { commandes, ouvert, onOuvert }: {
    commandes: Commande[]; ouvert: boolean; onOuvert: (v: boolean) => void
  },
) {
  // L'écouteur est posé UNE fois, pour la vie du composant. Le rattacher à
  // chaque changement de `ouvert` le désabonne et le réabonne à chaque frappe :
  // une touche pressée pile entre les deux est perdue, et l'utilisateur voit un
  // raccourci qui « marche une fois sur trois ».
  //
  // La référence est mise à jour dans un effet et NON pendant le rendu : muter
  // une ref en plein rendu est ce que React interdit explicitement, parce qu'un
  // rendu abandonné — concurrent, ou le doublon de StrictMode — laisse alors la
  // ref pointer sur un état qui n'a jamais été affiché.
  const dernier = useRef({ ouvert, onOuvert })
  useEffect(() => { dernier.current = { ouvert, onOuvert } })

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const { ouvert: o, onOuvert: cb } = dernier.current
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); cb(!o) }
      if (e.key === 'Escape') cb(false)
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  // Un seul parcours : le groupement et l'ordre d'apparition sortent ensemble.
  // Chaîner `map` puis `Set` puis un `filter` par groupe relit la liste autant
  // de fois qu'il y a de groupes.
  const parGroupe = useMemo(() => {
    const m = new Map<string, Commande[]>()
    for (const c of commandes) {
      const g = m.get(c.groupe)
      if (g) g.push(c); else m.set(c.groupe, [c])
    }
    return [...m]
  }, [commandes])

  return (
    <Command.Dialog
      open={ouvert} onOpenChange={onOuvert} label="Palette de commandes"
      className={cn(
        'fixed top-[18%] left-1/2 z-50 w-[92vw] max-w-[560px] -translate-x-1/2',
        'overflow-hidden rounded-[var(--mode-radius-container)] border border-border',
        'bg-popover text-popover-foreground relief-flottant',
      )}
      overlayClassName="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]"
    >
      <div className="flex items-center gap-2.5 border-b border-border px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Command.Input
          placeholder="Chercher une commande, un dossier, un réglage…"
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <Command.List className="max-h-[320px] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
          Aucune commande ne correspond.
        </Command.Empty>
        {parGroupe.map(([g, entrees]) => (
          <Command.Group
            key={g} heading={g}
            className="[&_[cmdk-group-heading]]:etiquette [&_[cmdk-group-heading]]:px-2.5
                       [&_[cmdk-group-heading]]:py-1.5"
          >
            {entrees.map(c => (
              <Command.Item
                key={c.id} value={`${c.groupe} ${c.libelle}`}
                onSelect={() => { c.action?.(); onOuvert(false) }}
                className={cn('flex cursor-pointer items-center gap-2.5 rounded-[var(--mode-radius-control)]',
                  'px-2.5 py-2 text-sm select-none',
                  'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground')}
              >
                <span className="text-muted-foreground [&_svg]:size-4">{c.icone ?? <ArrowRight />}</span>
                <span className="flex-1">{c.libelle}</span>
                {c.indice && (
                  <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5
                                  font-mono text-[10px] text-muted-foreground">
                    {c.indice}
                  </kbd>
                )}
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command.Dialog>
  )
}
