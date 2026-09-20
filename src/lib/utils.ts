import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* Les formateurs Intl sont construits UNE fois. Le coût de construction est de
   plusieurs ordres de grandeur supérieur à celui du formatage : le refaire à
   chaque cellule d'un tableau de 500 lignes se voit au défilement. */
const EUROS = new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0,
})
const EUROS_CENTIMES = new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2,
})
const NOMBRE = new Intl.NumberFormat('fr-FR')

/** Un montant en euros. Sans décimales par défaut — un cockpit compte en milliers. */
export function euros(n: number, centimes = false) {
  return (centimes ? EUROS_CENTIMES : EUROS).format(n)
}

/** Abrège pour une tuile de métrique : 398 000 → « 398 k€ ». */
export function eurosCourts(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M€`
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)} k€`
  return `${n} €`
}

export function nombre(n: number) {
  return NOMBRE.format(n)
}
