import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  LayoutDashboard, AppWindow, Database, Network, Building2, MapPinned,
  ShieldCheck, BookOpen,
} from 'lucide-react'
import { AppShell, type Entree } from '@/components/shell/app-shell'
import { Badge } from '@/components/ui/badge'
import { VUES, composant, vueParCle } from '@/registre'
import { socle } from '@/donnees/socle'

/**
 * L'adresse est le hash, et le hash est l'état.
 *
 * Pas de routeur : le socle n'en choisit pas, et une vue n'a besoin que d'être
 * citable. `#objets` s'envoie par courriel et ouvre la bonne page — c'est tout
 * ce qu'un référentiel demande à une URL.
 */
const ICONES: Record<string, ReactNode> = {
  accueil: <LayoutDashboard />,
  applications: <AppWindow />,
  objets: <Database />,
  carte: <Network />,
  organisation: <Building2 />,
  operations: <MapPinned />,
  qualite: <ShieldCheck />,
  methodologie: <BookOpen />,
}

const BADGES: Record<string, string> = {
  applications: String(socle.compteurs.applications + socle.compteurs.applications_hypothese),
  objets: String(socle.compteurs.objets),
  operations: String(socle.compteurs.operations),
  organisation: String(socle.compteurs.filiales + socle.compteurs.directions_territoriales),
}

function cleDuHash(): string {
  const brut = window.location.hash.replace(/^#/, '')
  return VUES.some(v => v.cle === brut) ? brut : 'accueil'
}

export default function App() {
  const [actif, setActif] = useState(cleDuHash)

  useEffect(() => {
    const suivre = () => setActif(cleDuHash())
    window.addEventListener('hashchange', suivre)
    return () => window.removeEventListener('hashchange', suivre)
  }, [])

  const vue = vueParCle(actif)
  const Contenu = useMemo(() => composant(vue), [vue])

  const entrees: Entree[] = VUES.map(v => ({
    cle: v.cle,
    libelle: v.libelle,
    icone: ICONES[v.cle],
    badge: BADGES[v.cle],
  }))

  return (
    <AppShell
      entrees={entrees}
      actif={actif}
      onNaviguer={cle => { window.location.hash = cle }}
      titre={vue.titre}
      sousTitre={vue.sousTitre}
      actions={vue.livrable ? <Badge ton="unite">{vue.livrable}</Badge> : undefined}
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
        <Contenu />
      </Suspense>
    </AppShell>
  )
}
