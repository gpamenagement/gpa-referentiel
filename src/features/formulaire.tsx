import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/menus'

/**
 * Le formulaire de référence — react-hook-form + zod.
 *
 * Le schéma zod est la source unique : il valide, il type le formulaire, et il
 * porte les messages en français. Écrire la validation deux fois — une fois en
 * schéma, une fois en message d'erreur ad hoc — est la façon la plus sûre de
 * les faire diverger.
 *
 * `aria-invalid` est posé depuis l'état du formulaire, pas à la main : c'est ce
 * qui fait annoncer l'erreur par un lecteur d'écran, et le liseré rouge seul ne
 * l'annonce à personne.
 */

const schema = z.object({
  raison: z.string().min(2, 'La raison sociale est requise.'),
  siren: z.string().regex(/^\d{9}$/, 'Le SIREN attend exactement 9 chiffres.'),
  segment: z.string().min(1, 'Choisir un segment.'),
  note: z.string().max(400, '400 caractères au maximum.').optional(),
})
type Valeurs = z.infer<typeof schema>

export function FormulaireCompte({ onEnvoyer }: { onEnvoyer?: (v: Valeurs) => void }) {
  const {
    register, handleSubmit, setValue, watch, formState: { errors, isSubmitting },
  } = useForm<Valeurs>({ resolver: zodResolver(schema), defaultValues: { segment: '' } })

  return (
    <Card className="p-5">
      <form
        onSubmit={handleSubmit(async v => {
          await new Promise(r => setTimeout(r, 700))
          onEnvoyer?.(v)
        })}
        className="grid gap-4 sm:grid-cols-2"
      >
        <div className="space-y-1.5">
          <Label htmlFor="raison">Raison sociale</Label>
          <Input id="raison" {...register('raison')} aria-invalid={!!errors.raison}
                 placeholder="Foncière régionale" />
          {errors.raison && <p className="text-xs text-danger">{errors.raison.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="siren">SIREN</Label>
          <Input id="siren" inputMode="numeric" {...register('siren')} aria-invalid={!!errors.siren}
                 placeholder="9 chiffres" />
          {errors.siren && <p className="text-xs text-danger">{errors.siren.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="segment">Segment</Label>
          {/* Radix Select ne pose pas de champ natif : la valeur doit être
              rendue au formulaire à la main, sinon zod la voit toujours vide. */}
          <Select value={watch('segment')}
                  onValueChange={v => setValue('segment', v, { shouldValidate: true })}>
            <SelectTrigger id="segment" aria-invalid={!!errors.segment}>
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent>
              {['Logement', 'Tertiaire', 'Retail', 'Public', 'Énergie', 'Hôtellerie'].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.segment && <p className="text-xs text-danger">{errors.segment.message}</p>}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="note">Note</Label>
          <Textarea id="note" {...register('note')} aria-invalid={!!errors.note}
                    placeholder="Contexte, points d'attention…" />
          {errors.note && <p className="text-xs text-danger">{errors.note.message}</p>}
        </div>

        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}Enregistrer
          </Button>
          <Button type="reset" variant="discret">Annuler</Button>
        </div>
      </form>
    </Card>
  )
}
