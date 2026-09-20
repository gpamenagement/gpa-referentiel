import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/* Les primitives Radix, habillées par le relief. Regroupées ici tant qu'elles
   tiennent en une ligne chacune : un fichier par composant de 12 lignes coûte
   plus en navigation qu'il ne rapporte en clarté. Elles se dégroupent le jour
   où l'une dépasse la cinquantaine de lignes. */

/* --- Onglets ------------------------------------------------------------- */
export const Tabs = TabsPrimitive.Root
export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--mode-radius-control)] bg-secondary p-1',
        'relief-creux', className)}
      {...props}
    />
  )
}
export function TabsTrigger(
  { className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>,
) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[calc(var(--mode-radius-control)-2px)] px-3 py-1.5',
        'font-mono text-[13px] font-medium text-muted-foreground whitespace-nowrap',
        'transition-[color,box-shadow,background-color] duration-[var(--motion-rapide)]',
        // L'onglet actif se SOULÈVE hors du creux : c'est la métaphore du
        // relief appliquée à une sélection, et elle se lit sans couleur.
        'data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:relief-pose',
        'focus-visible:ring-[3px] focus-visible:ring-ring/40 outline-none', className)}
      {...props}
    />
  )
}
/* Radix pose `tabIndex=0` sur le contenu d'onglet pour qu'il soit atteignable
   quand il défile — c'est juste, mais il arrive alors sans anneau. Le poser ici
   évite de le répéter sur chaque page. */
export function TabsContent(
  { className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>,
) {
  return (
    <TabsPrimitive.Content
      className={cn('rounded-[var(--mode-radius-control)]',
        'focus-visible:ring-[3px] focus-visible:ring-ring/40 outline-none', className)}
      {...props}
    />
  )
}

/* --- Interrupteur -------------------------------------------------------- */
export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent',
        'relief-creux transition-colors duration-[var(--motion-rapide)]',
        'data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted',
        'focus-visible:ring-[3px] focus-visible:ring-ring/40 outline-none', className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block size-4 rounded-full bg-card relief-pose ring-0',
          'transition-transform duration-[var(--motion-rapide)] ease-[var(--motion-ease-out)]',
          'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5')}
      />
    </SwitchPrimitive.Root>
  )
}

/* --- Case à cocher ------------------------------------------------------- */
export function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer relative size-4 shrink-0 rounded-[3px] border border-input bg-card relief-creux',
        // La zone atteignable fait 24 px — WCAG 2.2 AA — sans que le dessin
        // grossisse : agrandir la case casserait son alignement optique avec
        // le texte, et la densité de toute la ligne.
        'before:absolute before:-inset-1 before:content-[""]',
        'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        'data-[state=checked]:border-primary transition-colors duration-[var(--motion-rapide)]',
        'focus-visible:ring-[3px] focus-visible:ring-ring/40 outline-none', className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="size-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

/* --- Filet --------------------------------------------------------------- */
export function Separator(
  { className, orientation = 'horizontal', ...props }:
  React.ComponentProps<typeof SeparatorPrimitive.Root>,
) {
  return (
    <SeparatorPrimitive.Root
      decorative orientation={orientation}
      className={cn('shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)}
      {...props}
    />
  )
}

/* --- Progression --------------------------------------------------------- */
export function Progress(
  { className, value = 0, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>,
) {
  return (
    <ProgressPrimitive.Root
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted relief-creux', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-transform duration-[var(--motion-entree)] ease-[var(--motion-ease-out)]"
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

/* --- Infobulle ----------------------------------------------------------- */
export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger
export function TooltipContent(
  { className, sideOffset = 6, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>,
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 rounded-[var(--mode-radius-control)] border border-border bg-popover px-2.5 py-1.5',
          'text-xs text-popover-foreground relief-flottant',
          'animate-in fade-in-0 zoom-in-95 duration-[var(--motion-interaction,120ms)]', className)}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}

/* --- Squelette de chargement --------------------------------------------
   L'onde qui traverse est l'écho du logo animé : la même idée de flux, à
   l'échelle d'un bloc de contenu. */
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('anim-onde rounded-[var(--mode-radius-control)] bg-muted text-foreground',
                       className)} {...props} />
  )
}
