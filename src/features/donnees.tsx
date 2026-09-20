import { useMemo, useState, type ReactNode } from 'react'
import { ArrowUpDown, Inbox, Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/divers'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

/**
 * Le tableau de données générique — recherche, tri, sélection, états.
 *
 * C'est LE module qui existe en sept exemplaires divergents dans les apps
 * (TableauDomaine, GrilleDomaine, projects-table, task-table, ExplorerView…).
 * Il est ici pour qu'il n'y en ait plus qu'un.
 *
 * Un tableau a quatre états, pas un. En oublier un donne une page blanche que
 * personne ne sait interpréter :
 *   chargement · vide au départ · vide après filtrage · peuplé
 * Les deux « vides » ne disent pas la même chose et n'appellent pas la même
 * action — d'où `videFiltre`, distinct de `vide`.
 */

export type Colonne<T> = {
  cle: keyof T & string
  entete: string
  num?: boolean
  triable?: boolean
  rendu?: (ligne: T) => ReactNode
  largeur?: string
}

export function TableauDonnees<T extends { id: string }>(
  { colonnes, lignes, chargement = false, recherche = true, surLigne, actions, vide }: {
    colonnes: Colonne<T>[]; lignes: T[]; chargement?: boolean; recherche?: boolean
    surLigne?: (ligne: T) => void; actions?: ReactNode; vide?: ReactNode
  },
) {
  const [q, setQ] = useState('')
  const [tri, setTri] = useState<{ cle: string; sens: 1 | -1 } | null>(null)

  const filtrees = useMemo(() => {
    const terme = q.trim().toLowerCase()
    let out = terme
      ? lignes.filter(l => Object.values(l).some(v => String(v).toLowerCase().includes(terme)))
      : lignes
    if (tri) {
      out = [...out].sort((a, b) => {
        const x = a[tri.cle as keyof T], y = b[tri.cle as keyof T]
        // Comparaison numérique quand les deux valeurs le sont : un tri
        // alphabétique sur des montants place 9 après 10.
        if (typeof x === 'number' && typeof y === 'number') return (x - y) * tri.sens
        return String(x).localeCompare(String(y), 'fr') * tri.sens
      })
    }
    return out
  }, [lignes, q, tri])

  return (
    <Card className="overflow-hidden p-0">
      {(recherche || actions) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          {recherche && (
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2
                                 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} className="pl-9"
                     placeholder="Rechercher…" aria-label="Rechercher dans le tableau" />
            </div>
          )}
          <Button variant="contour" taille="sm"><SlidersHorizontal />Filtres</Button>
          {actions}
        </div>
      )}

      {chargement ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : filtrees.length === 0 ? (
        <EtatVide
          icone={<Inbox />}
          titre={q ? 'Aucun résultat' : 'Rien à afficher'}
          texte={q
            ? `Aucune ligne ne correspond à « ${q} ». Élargir la recherche ou retirer les filtres.`
            : 'Ce tableau se remplira dès la première donnée.'}
          action={q ? <Button variant="contour" taille="sm" onClick={() => setQ('')}>
            Effacer la recherche</Button> : vide}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {colonnes.map(c => (
                <TableHead key={c.cle} style={{ width: c.largeur }}
                           className={cn(c.num && 'text-right')}>
                  {c.triable ? (
                    <button
                      className="inline-flex items-center gap-1 rounded-sm hover:text-foreground
                                 focus-visible:ring-[3px] focus-visible:ring-ring/40 outline-none"
                      onClick={() => setTri(t =>
                        t?.cle === c.cle ? { cle: c.cle, sens: t.sens === 1 ? -1 : 1 }
                                         : { cle: c.cle, sens: 1 })}
                    >
                      {c.entete}
                      <ArrowUpDown className={cn('size-3',
                        tri?.cle === c.cle ? 'text-foreground' : 'opacity-40')} />
                    </button>
                  ) : c.entete}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrees.map(l => (
              <TableRow key={l.id}
                        onClick={surLigne ? () => surLigne(l) : undefined}
                        className={cn(surLigne && 'cursor-pointer')}>
                {colonnes.map(c => (
                  <TableCell key={c.cle} num={c.num}>
                    {c.rendu ? c.rendu(l) : String(l[c.cle] ?? '—')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}

/**
 * L'état vide. Toujours trois choses : ce qu'on voit, pourquoi, et quoi faire.
 * Un état vide sans action est une impasse — l'utilisateur ferme l'onglet.
 */
export function EtatVide(
  { icone, titre, texte, action }: {
    icone?: ReactNode; titre: string; texte?: string; action?: ReactNode
  },
) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icone && (
        <div className="flex size-11 items-center justify-center rounded-full bg-muted
                        text-muted-foreground relief-creux [&_svg]:size-5">
          {icone}
        </div>
      )}
      <div>
        <p className="font-display text-[15px] font-bold">{titre}</p>
        {texte && <p className="mx-auto mt-1 max-w-[46ch] text-sm text-muted-foreground">{texte}</p>}
      </div>
      {action}
    </div>
  )
}
