import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import * as RadioPrimitive from '@radix-ui/react-radio-group'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/* Tout ce qui se déploie par-dessus la page. Un seul jeu de classes pour les
   surfaces flottantes, défini une fois ici : sinon chaque menu réinvente son
   ombre et sa durée, et trois menus voisins s'ouvrent à trois vitesses. */
const SURFACE_FLOTTANTE =
  'z-50 min-w-[8rem] overflow-hidden rounded-[var(--mode-radius-container)] border border-border ' +
  'bg-popover p-1 text-popover-foreground relief-flottant ' +
  'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 ' +
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'

const ENTREE =
  'relative flex cursor-pointer items-center gap-2 rounded-[var(--mode-radius-control)] ' +
  'px-2.5 py-1.5 text-sm outline-none select-none ' +
  'focus:bg-accent focus:text-accent-foreground ' +
  'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground ' +
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'

/* --- Liste déroulante ---------------------------------------------------- */
export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export function SelectTrigger(
  { className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>,
) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-[var(--mode-radius-control)]',
        'border border-input bg-card relief-creux',
        'px-[var(--mode-density-controlPadX)] py-[var(--mode-density-controlPadY)] text-sm',
        'data-[placeholder]:text-muted-foreground',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50', className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent(
  { className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Content>,
) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper" sideOffset={4}
        className={cn(SURFACE_FLOTTANTE,
          'max-h-[--radix-select-content-available-height] w-[--radix-select-trigger-width]',
          className)}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex justify-center py-1">
          <ChevronUp className="size-3.5 opacity-50" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex justify-center py-1">
          <ChevronDown className="size-3.5 opacity-50" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem(
  { className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>,
) {
  return (
    <SelectPrimitive.Item className={cn(ENTREE, 'pr-8', className)} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2.5">
        <Check className="size-3.5" strokeWidth={3} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

/* --- Menu contextuel ----------------------------------------------------- */
export const DropdownMenu = DropdownPrimitive.Root
export const DropdownMenuTrigger = DropdownPrimitive.Trigger

export function DropdownMenuContent(
  { className, sideOffset = 4, ...props }: React.ComponentProps<typeof DropdownPrimitive.Content>,
) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content sideOffset={sideOffset}
                                 className={cn(SURFACE_FLOTTANTE, className)} {...props} />
    </DropdownPrimitive.Portal>
  )
}
export function DropdownMenuItem(
  { className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Item>,
) {
  return <DropdownPrimitive.Item className={cn(ENTREE, className)} {...props} />
}
export function DropdownMenuSeparator(
  { className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Separator>,
) {
  return <DropdownPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
}
export function DropdownMenuLabel(
  { className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Label>,
) {
  return <DropdownPrimitive.Label className={cn('etiquette px-2.5 py-1.5', className)} {...props} />
}

/* --- Bulle --------------------------------------------------------------- */
export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export function PopoverContent(
  { className, sideOffset = 6, align = 'start', ...props }:
  React.ComponentProps<typeof PopoverPrimitive.Content>,
) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset} align={align}
        className={cn(SURFACE_FLOTTANTE, 'w-72 p-4', className)} {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

/* --- Vignette -----------------------------------------------------------
   Le repli n'est pas décoratif : une photo de profil manque une fois sur deux,
   et sans lui la ligne saute de hauteur au chargement. */
export function Avatar(
  { src, nom, className }: { src?: string; nom: string; className?: string },
) {
  const initiales = nom.split(' ').map(m => m[0]).slice(0, 2).join('').toUpperCase()
  return (
    <AvatarPrimitive.Root
      className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
    >
      {src && <AvatarPrimitive.Image src={src} alt={nom} className="size-full object-cover grayscale" />}
      <AvatarPrimitive.Fallback
        className="flex size-full items-center justify-center bg-secondary
                   font-mono text-[11px] font-bold text-muted-foreground relief-creux"
      >
        {initiales}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}

/* --- Accordéon ----------------------------------------------------------- */
export const Accordion = AccordionPrimitive.Root
export function AccordionItem(
  { className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>,
) {
  return <AccordionPrimitive.Item className={cn('border-b border-border last:border-0', className)} {...props} />
}
export function AccordionTrigger(
  { className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>,
) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn('flex flex-1 items-center justify-between gap-3 py-3.5 text-left text-sm',
          'font-semibold transition-colors duration-[var(--motion-rapide)] hover:text-muted-foreground',
          '[&[data-state=open]>svg]:rotate-180',
          'focus-visible:ring-[3px] focus-visible:ring-ring/40 outline-none', className)}
        {...props}
      >
        {children}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground
                                transition-transform duration-[var(--motion-rapide)]" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}
export function AccordionContent(
  { className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>,
) {
  return (
    <AccordionPrimitive.Content
      className={cn('overflow-hidden text-sm text-muted-foreground',
        'data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up', className)}
      {...props}
    >
      <div className="pb-3.5">{children}</div>
    </AccordionPrimitive.Content>
  )
}

/* --- Zone défilante ------------------------------------------------------ */
export function ScrollArea(
  { className, children, ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.Root>,
) {
  return (
    <ScrollAreaPrimitive.Root className={cn('relative overflow-hidden', className)} {...props}>
      <ScrollAreaPrimitive.Viewport className="size-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar orientation="vertical"
        className="flex w-2 touch-none p-0.5 transition-colors select-none">
        <ScrollAreaPrimitive.Thumb className="flex-1 rounded-full bg-border" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  )
}

/* --- Choix exclusif ------------------------------------------------------ */
/* Même raison que TabsContent : Radix rend la racine focusable pour la
   navigation aux flèches, et elle arrive sans anneau. */
export function RadioGroup(
  { className, ...props }: React.ComponentProps<typeof RadioPrimitive.Root>,
) {
  return (
    <RadioPrimitive.Root
      className={cn('rounded-[var(--mode-radius-control)]',
        'focus-visible:ring-[3px] focus-visible:ring-ring/40 outline-none', className)}
      {...props}
    />
  )
}
export function RadioGroupItem(
  { className, ...props }: React.ComponentProps<typeof RadioPrimitive.Item>,
) {
  return (
    <RadioPrimitive.Item
      className={cn('relative size-4 shrink-0 rounded-full border border-input bg-card relief-creux',
        // Même raison que pour la case : cible de 24 px, dessin de 16.
        'before:absolute before:-inset-1 before:content-[""]',
        'data-[state=checked]:border-primary',
        'focus-visible:ring-[3px] focus-visible:ring-ring/40 outline-none', className)}
      {...props}
    >
      <RadioPrimitive.Indicator className="flex items-center justify-center">
        <span className="size-2 rounded-full bg-primary" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Item>
  )
}

/* --- Curseur ------------------------------------------------------------- */
export function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn('relative flex w-full touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-muted relief-creux">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block size-4 rounded-full border border-border bg-card relief-pose
                   focus-visible:ring-[3px] focus-visible:ring-ring/40 outline-none"
      />
    </SliderPrimitive.Root>
  )
}
