import { useState, type ReactNode } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Logo, SignatureFlowmetrik } from '@/components/brand/logo'
import { BandeauDemonstration } from '@/composants/bandeau-demonstration'

/**
 * La coquille : barre latérale + barre haute + zone de contenu.
 *
 * Sur mobile la latérale devient un tiroir. Ce n'est pas une commodité : la
 * charte refuse le débordement horizontal sur mobile, et une latérale fixe de
 * 220 px sur un écran de 360 px le produit mécaniquement.
 */

export type Entree = { cle: string; libelle: string; icone: ReactNode; badge?: string }

export function AppShell(
  { entrees, actif, onNaviguer, titre, sousTitre, actions, children }: {
    entrees: Entree[]; actif: string; onNaviguer: (cle: string) => void
    titre: string; sousTitre?: string; actions?: ReactNode; children: ReactNode
  },
) {
  const [ouvert, setOuvert] = useState(false)
  return (
    // Une colonne, et non plus une rangée : la bannière occupe toute la largeur
    // en haut de la fenêtre, latérale comprise. Collée (`sticky`), elle reste
    // lisible quel que soit l'écran atteint par un lien direct — c'est tout son
    // intérêt : un visiteur qui arrive par `#objets` ne lira pas la page
    // méthodologie, il lira cette ligne.
    <div className="flex min-h-screen flex-col bg-background">
      <BandeauDemonstration />
      <div className="flex min-h-0 flex-1">
      {/* Voile du tiroir mobile. `md:hidden` et non un test JS : le CSS sait
          déjà à quelle largeur on est, un état React de plus se désynchronise.
          Un `<button>` et non un `<div onClick>` : un div cliquable n'est ni
          atteignable au clavier ni annoncé, et « fermer en cliquant à côté »
          devient alors la seule sortie — inaccessible à qui n'a pas de souris. */}
      {ouvert && (
        <button
          type="button" aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOuvert(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-sidebar-border',
          'md:sticky md:top-[var(--hauteur-bandeau)] md:h-[calc(100vh-var(--hauteur-bandeau))]',
          'bg-sidebar gpa-motif-blanc transition-transform duration-[var(--motion-entree)] ease-[var(--motion-ease-drawer)]',
          'md:translate-x-0',
          ouvert ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          {/* Le fichier blanc, et seulement ici : la latérale est marine. */}
          <Logo ton="sombre" className="h-7" />
          <Button variant="discret" taille="icone" className="md:hidden"
                  onClick={() => setOuvert(false)} aria-label="Fermer le menu">
            <X />
          </Button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
          {entrees.map(e => (
            <button
              key={e.cle}
              onClick={() => { onNaviguer(e.cle); setOuvert(false) }}
              aria-current={actif === e.cle ? 'page' : undefined}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-[var(--mode-radius-control)] px-2.5 py-2',
                'text-left text-sm text-sidebar-foreground',
                'transition-colors duration-[var(--motion-rapide)]',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                'focus-visible:ring-[3px] focus-visible:ring-ring/40 outline-none',
                // L'entrée active se soulève hors de la latérale creusée.
                actif === e.cle &&
                  'bg-sidebar-accent font-semibold text-sidebar-accent-foreground relief-pose',
              )}
            >
              <span className="[&_svg]:size-4 shrink-0 opacity-70">{e.icone}</span>
              <span className="flex-1 truncate">{e.libelle}</span>
              {e.badge && (
                <span className="rounded-full bg-primary px-1.5 py-px font-mono text-[10px]
                                 font-bold text-primary-foreground tabular-nums">
                  {e.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-3">
          <SignatureFlowmetrik />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-[var(--hauteur-bandeau)] z-30 flex h-14 items-center gap-3 border-b border-border
                           bg-background/85 px-4 backdrop-blur">
          <Button variant="discret" taille="icone" className="md:hidden"
                  onClick={() => setOuvert(true)} aria-label="Ouvrir le menu">
            <Menu />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] leading-tight font-medium">{titre}</h1>
            {sousTitre && <p className="truncate text-xs text-muted-foreground">{sousTitre}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        </header>
          <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
