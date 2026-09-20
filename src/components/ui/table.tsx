import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Le tableau de données. Trois choses y sont tenues d'office parce que, laissées
 * à l'appel, elles sont oubliées une fois sur deux :
 *
 *  - l'en-tête est en `etiquette` (Space Grotesk, capitales) — c'est ce qui
 *    distingue un tableau de données d'un tableau de mise en page ;
 *  - `<td class="num">` aligne à droite ET passe en chiffres tabulaires ;
 *  - la dernière ligne perd son filet, sinon il double la bordure de la carte.
 */
export function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full caption-bottom border-collapse text-sm', className)} {...props} />
    </div>
  )
}
export function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead className={cn('', className)} {...props} />
}
export function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={cn('', className)} {...props} />
}
export function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn('border-b border-border transition-colors duration-[var(--motion-rapide)]',
        'hover:bg-accent/60 data-[state=selected]:bg-accent last:border-0', className)}
      {...props}
    />
  )
}
export function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th className={cn('etiquette border-b border-border px-3 py-2.5 text-left align-middle',
                      'whitespace-nowrap', className)} {...props} />
  )
}
export function TableCell(
  { className, num = false, ...props }: React.ComponentProps<'td'> & { num?: boolean },
) {
  return (
    <td className={cn('px-3 py-3 align-middle text-muted-foreground',
                      num && 'text-right tabular-nums text-foreground', className)} {...props} />
  )
}
