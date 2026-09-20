import { useState } from 'react'
import { Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Logo } from '@/components/brand/logo'

/**
 * L'écran de connexion — identités fédérées + lien magique.
 *
 * Le lien magique est le défaut, pas une option de repli : c'est le montage
 * déjà en service côté FlowAudit (Identity Platform), et il évite d'avoir à
 * stocker, faire tourner et réinitialiser des mots de passe. Le formulaire
 * mot de passe existe en variante pour les applications qui en héritent
 * (`variante="motdepasse"`), il n'est pas la voie recommandée.
 *
 * Le bouton reste actif pendant l'envoi et affiche son attente : le désactiver
 * fait disparaître le libellé sous le curseur, et l'utilisateur reclique.
 */

const IDP = [
  {
    cle: 'google', libelle: 'Continuer avec Google',
    icone: (
      <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
        <path fill="#4285F4" d="M45 24c0-1.6-.1-2.7-.4-4H24v7.5h12c-.2 2-1.5 5-4.4 7l6.7 5.2C42.2 36 45 30.6 45 24z" />
        <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.4c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8 40.5 15.4 46 24 46z" />
        <path fill="#FBBC05" d="M11.5 28.4c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4l-7.1-5.5C2.9 17 2 20.4 2 24s.9 7 2.4 9.9l7.1-5.5z" />
        <path fill="#EA4335" d="M24 10.8c3.2 0 6 1.1 8.2 3.2l6.1-6.1C34.9 4.5 29.9 2 24 2 15.4 2 8 7.5 4.4 14.1l7.1 5.5c1.8-5.3 6.7-8.8 12.5-8.8z" />
      </svg>
    ),
  },
  {
    cle: 'microsoft', libelle: 'Continuer avec Microsoft',
    icone: (
      <svg viewBox="0 0 23 23" className="size-[15px]" aria-hidden>
        <path fill="#F25022" d="M0 0h11v11H0z" /><path fill="#7FBA00" d="M12 0h11v11H12z" />
        <path fill="#00A4EF" d="M0 12h11v11H0z" /><path fill="#FFB900" d="M12 12h11v11H12z" />
      </svg>
    ),
  },
]

export function Connexion(
  { variante = 'lien', onConnexion }:
  { variante?: 'lien' | 'motdepasse'; onConnexion?: () => void },
) {
  const [email, setEmail] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState(false)

  function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setEnvoi(true)
    // Démonstration : l'appel réel remplace ce délai.
    setTimeout(() => { setEnvoi(false); setEnvoye(true); onConnexion?.() }, 900)
  }

  return (
    <div className="grid min-h-[560px] place-items-center p-6">
      <Card className="w-full max-w-[380px] p-7">
        <Logo className="mb-6 h-7" />
        <h2 className="text-xl">Se connecter</h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Accès réservé aux comptes autorisés.
        </p>

        <div className="space-y-2">
          {IDP.map(i => (
            <Button key={i.cle} variant="contour" className="w-full justify-center">
              {i.icone}{i.libelle}
            </Button>
          ))}
        </div>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="etiquette">ou</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {envoye ? (
          <div className="rounded-[var(--mode-radius-control)] border border-succes/35 bg-succes/10 p-4">
            <p className="flex items-center gap-2 font-mono text-[13px] font-bold text-succes">
              <Mail className="size-4" />Lien envoyé
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Un lien de connexion part vers <strong className="text-foreground">{email}</strong>.
              Il expire au bout de 15 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={soumettre} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="courriel">Adresse professionnelle</Label>
              <Input id="courriel" type="email" required autoComplete="email"
                     value={email} onChange={e => setEmail(e.target.value)}
                     placeholder="prenom@entreprise.fr" />
            </div>
            {variante === 'motdepasse' && (
              <div className="space-y-1.5">
                <Label htmlFor="mdp">Mot de passe</Label>
                <Input id="mdp" type="password" required autoComplete="current-password" />
              </div>
            )}
            <Button type="submit" className="w-full">
              {envoi && <Loader2 className="animate-spin" />}
              {variante === 'lien' ? 'Recevoir un lien de connexion' : 'Se connecter'}
            </Button>
          </form>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          {variante === 'lien'
            ? 'Aucun mot de passe à retenir ni à faire tourner.'
            : 'Mot de passe oublié ? Un lien de réinitialisation est envoyé par courriel.'}
        </p>
      </Card>
    </div>
  )
}
