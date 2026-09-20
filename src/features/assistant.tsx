import { useState } from 'react'
import { CornerDownLeft, Sparkles, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Marque } from '@/components/brand/logo'
import { cn } from '@/lib/utils'

/**
 * Le fil de conversation agent — présent dans zab, flowgo et flowstart, chaque
 * fois réécrit.
 *
 * Deux choix qui ne se devinent pas :
 *
 *  - le tour de l'agent porte la MARQUE, celui de l'humain une icône neutre.
 *    C'est ce qui rend le fil lisible d'un coup d'œil sans avoir à lire les
 *    libellés, et c'est un des rares endroits où le logo travaille vraiment ;
 *  - l'attente n'est pas un spinner mais trois points qui pulsent, parce qu'un
 *    spinner promet une durée bornée et qu'une génération ne l'est pas.
 */

export type Tour = { id: string; role: 'agent' | 'humain'; texte: string; horodatage?: string }

export function FilAgent(
  { tours, enCours = false, onEnvoyer }: {
    tours: Tour[]; enCours?: boolean; onEnvoyer?: (texte: string) => void
  },
) {
  const [saisie, setSaisie] = useState('')
  function envoyer() {
    if (!saisie.trim()) return
    onEnvoyer?.(saisie); setSaisie('')
  }
  return (
    <Card className="flex h-[520px] flex-col p-0">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {tours.map(t => (
          <div key={t.id} className={cn('flex gap-3', t.role === 'humain' && 'flex-row-reverse')}>
            <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-full',
                               t.role === 'agent' ? 'bg-secondary relief-pose'
                                                  : 'bg-primary text-primary-foreground')}>
              {t.role === 'agent' ? <Marque className="h-3.5" /> : <User className="size-3.5" />}
            </div>
            <div className={cn('max-w-[75%] rounded-[var(--mode-radius-container)] px-3.5 py-2.5 text-sm',
                               t.role === 'agent'
                                 ? 'bg-secondary text-foreground relief-pose'
                                 : 'bg-primary text-primary-foreground relief-controle')}>
              <p className="whitespace-pre-wrap leading-relaxed">{t.texte}</p>
              {t.horodatage && (
                <p className={cn('mt-1 font-mono text-[10px] tabular-nums',
                                 t.role === 'agent' ? 'text-muted-foreground' : 'opacity-70')}>
                  {t.horodatage}
                </p>
              )}
            </div>
          </div>
        ))}
        {enCours && (
          <div className="flex gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full
                            bg-secondary relief-pose">
              <Marque className="h-3.5" />
            </div>
            <div className="flex items-center gap-1 rounded-[var(--mode-radius-container)]
                            bg-secondary px-3.5 py-3 relief-pose">
              {[0, 1, 2].map(i => (
                <span key={i} aria-hidden
                      className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: `${i * 120}ms` }} />
              ))}
              <span className="sr-only">L'agent rédige sa réponse</span>
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-border p-3">
        <div className="relative">
          <Textarea
            value={saisie} onChange={e => setSaisie(e.target.value)}
            onKeyDown={e => {
              // Entrée envoie, Maj+Entrée saute une ligne — la convention que
              // tout le monde a en main. L'inverse fait envoyer des brouillons.
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer() }
            }}
            placeholder="Poser une question, décrire une tâche…"
            className="min-h-[68px] pr-12" aria-label="Message à l'agent"
          />
          <Button taille="icone" onClick={envoyer} disabled={!saisie.trim()}
                  className="absolute right-2 bottom-2" aria-label="Envoyer">
            <CornerDownLeft />
          </Button>
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Sparkles className="size-3" />Entrée pour envoyer, Maj + Entrée pour aller à la ligne.
        </p>
      </div>
    </Card>
  )
}
