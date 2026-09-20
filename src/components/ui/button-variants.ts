import { cva } from 'class-variance-authority'

/* Les variantes vivent hors du fichier de composant : un module qui exporte à
   la fois un composant et autre chose casse le rafraîchissement à chaud de
   Vite — l'état de la page est perdu à chaque frappe dans ce fichier. */

export const variantesBouton = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-mono text-sm ' +
  'font-medium tracking-[-0.01em] rounded-[var(--mode-radius-control)] ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 " +
  'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:border-ring',
  {
    variants: {
      variant: {
        primaire: 'bg-primary text-primary-foreground relief-controle',
        secondaire: 'bg-secondary text-secondary-foreground border border-border relief-controle',
        contour: 'border border-input bg-card text-foreground relief-controle',
        // L'accent de filiale reste plafonné : un bouton, pas une barre entière.
        unite: 'bg-[var(--color-accent)] text-[var(--color-accentText)] relief-controle',
        danger: 'bg-destructive text-destructive-foreground relief-controle',
        discret: 'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground ' +
                 'transition-colors duration-[var(--motion-rapide)]',
        lien: 'bg-transparent text-foreground underline-offset-4 hover:underline p-0 h-auto',
      },
      taille: {
        sm: 'h-8 px-3 text-[13px] gap-1.5',
        normal: 'py-[var(--mode-density-controlPadY)] px-[var(--mode-density-controlPadX)]',
        lg: 'h-11 px-6 text-[15px]',
        icone: 'size-9 p-0',
      },
    },
    defaultVariants: { variant: 'primaire', taille: 'normal' },
  },
)
