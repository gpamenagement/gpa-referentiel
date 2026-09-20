import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Le champ de saisie. Creusé, pas soulevé : dans une grammaire de relief, un
 * champ est un réceptacle. Le soulever le ferait lire comme un bouton, et on
 * observe les utilisateurs cliquer dessus en attendant qu'il se passe quelque
 * chose.
 */
export function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex w-full min-w-0 rounded-[var(--mode-radius-control)] border border-input bg-card',
        'px-[var(--mode-density-controlPadX)] py-[var(--mode-density-controlPadY)] text-sm',
        'relief-creux placeholder:text-muted-foreground',
        'transition-[color,box-shadow,border-color] duration-[var(--motion-rapide)]',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-danger aria-invalid:ring-danger/30',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-20 w-full rounded-[var(--mode-radius-control)] border border-input bg-card',
        'px-[var(--mode-density-controlPadX)] py-[var(--mode-density-controlPadY)] text-sm',
        'relief-creux placeholder:text-muted-foreground field-sizing-content',
        'transition-[color,box-shadow,border-color] duration-[var(--motion-rapide)]',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 outline-none',
        className,
      )}
      {...props}
    />
  )
}

export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return <label data-slot="label" className={cn('etiquette block', className)} {...props} />
}
