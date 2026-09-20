import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/divers'
import { cn } from '@/lib/utils'

/**
 * Le panneau de fiche — le tiroir latéral qui ouvre le détail d'une ligne sans
 * quitter la liste.
 *
 * Il existe en cinq copies dans les apps (FichePanel, MarchePanel, PartagePanel,
 * task-detail, ModaleZone). Le point qu'aucune ne tenait toutes : **garder la
 * liste visible**. Ouvrir une modale par-dessus fait perdre le contexte, et
 * l'utilisateur revient en arrière pour se repérer, puis se perd.
 *
 * Sur mobile, le panneau prend tout l'écran : un tiroir de 420 px sur 360 px
 * de large produirait le débordement horizontal que la charte refuse.
 */
export function PanneauFiche(
  { ouvert, onFermer, titre, sousTitre, actions, children }: {
    ouvert: boolean; onFermer: () => void; titre: string; sousTitre?: string
    actions?: ReactNode; children: ReactNode
  },
) {
  return (
    <>
      {ouvert && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onFermer} aria-hidden />
      )}
      <aside
        // `inert` et non le seul `aria-hidden` : un panneau fermé reste dans le
        // flux du clavier. Sans lui, une tabulation depuis la page atteint
        // « Enregistrer » et « Fermer » d'un tiroir invisible, et l'utilisateur
        // clavier se retrouve à piloter un écran qu'il ne voit pas.
        {...(ouvert ? {} : { inert: '' as unknown as boolean })}
        aria-hidden={!ouvert}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-card',
          'relief-flottant sm:w-[420px]',
          'transition-[transform,visibility] duration-[var(--motion-entree)] ease-[var(--motion-ease-drawer)]',
          // `invisible` en plus du décalage : sinon l'ombre portée du panneau
          // continue de peindre une bande grise le long du bord droit de
          // l'écran, alors qu'il n'y a rien à voir.
          ouvert ? 'visible translate-x-0' : 'invisible translate-x-full',
        )}
      >
        <header className="flex items-start gap-3 p-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base">{titre}</h2>
            {sousTitre && <p className="truncate text-sm text-muted-foreground">{sousTitre}</p>}
          </div>
          <Button variant="discret" taille="icone" onClick={onFermer} aria-label="Fermer la fiche">
            <X />
          </Button>
        </header>
        <Separator />
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {actions && (
          <>
            <Separator />
            <footer className="flex items-center justify-end gap-2 p-4">{actions}</footer>
          </>
        )}
      </aside>
    </>
  )
}

/** Une paire libellé / valeur. La brique de toute fiche. */
export function Champ({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,110px)_1fr] items-baseline gap-3 py-2">
      <span className="etiquette">{libelle}</span>
      <span className="min-w-0 text-sm">{children}</span>
    </div>
  )
}
