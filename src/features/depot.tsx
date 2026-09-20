import { useRef, useState } from 'react'
import { FileText, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/divers'
import { cn } from '@/lib/utils'

/**
 * Le dépôt de document. Repris de flowstart (`depot-document.tsx`) et de
 * flowsequences (`SelecteurFichier.tsx`), qui divergeaient sur l'essentiel.
 *
 * Trois points qu'aucun des deux ne tenait :
 *
 *  - la zone reste un vrai `<input type=file>` derrière le glisser-déposer.
 *    Une zone qui n'écoute QUE le drop est inaccessible au clavier, et sur
 *    mobile elle ne fait rien du tout ;
 *  - `dragleave` se déclenche aussi en survolant un enfant de la zone, d'où le
 *    compteur de profondeur — sans lui la zone clignote pendant le survol ;
 *  - la progression est par fichier, pas globale : une barre unique à 60 %
 *    ne dit pas lequel des cinq fichiers a échoué.
 */

export type Depot = { id: string; nom: string; taille: number; progression: number; erreur?: string }

export function ZoneDepot(
  { fichiers, onAjouter, onRetirer, accepte = '.pdf,.docx,.xlsx,.csv,.png,.jpg' }: {
    fichiers: Depot[]; onAjouter?: (f: File[]) => void; onRetirer?: (id: string) => void
    accepte?: string
  },
) {
  const [survol, setSurvol] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-3">
      <div
        onDragEnter={e => { e.preventDefault(); setSurvol(n => n + 1) }}
        onDragLeave={e => { e.preventDefault(); setSurvol(n => n - 1) }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault(); setSurvol(0)
          onAjouter?.(Array.from(e.dataTransfer.files))
        }}
        className={cn(
          'rounded-[var(--mode-radius-container)] border border-dashed border-input bg-secondary',
          'relief-creux p-8 text-center transition-colors duration-[var(--motion-rapide)]',
          survol > 0 && 'border-primary bg-accent',
        )}
      >
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-card
                        text-muted-foreground relief-pose">
          <Upload className="size-5" />
        </div>
        <p className="mt-3 text-sm font-semibold">Déposer un document</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          PDF, Word, Excel, CSV ou image — 25 Mo par fichier.
        </p>
        <Button variant="contour" taille="sm" className="mt-3" onClick={() => input.current?.click()}>
          Parcourir
        </Button>
        <input
          ref={input} type="file" multiple accept={accepte} className="sr-only"
          aria-label="Choisir des fichiers"
          onChange={e => onAjouter?.(Array.from(e.target.files ?? []))}
        />
      </div>

      {fichiers.map(f => (
        <Card key={f.id} className="flex items-center gap-3 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--mode-radius-control)]
                          bg-secondary text-muted-foreground relief-creux">
            <FileText className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{f.nom}</p>
            <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {(f.taille / 1024 / 1024).toFixed(1).replace('.', ',')} Mo
              {f.erreur && <span className="text-danger"> — {f.erreur}</span>}
            </p>
            {f.progression < 100 && !f.erreur && (
              <Progress value={f.progression} className="mt-1.5 h-1" />
            )}
          </div>
          <Button variant="discret" taille="icone" onClick={() => onRetirer?.(f.id)}
                  aria-label={`Retirer ${f.nom}`}>
            <X />
          </Button>
        </Card>
      ))}
    </div>
  )
}
