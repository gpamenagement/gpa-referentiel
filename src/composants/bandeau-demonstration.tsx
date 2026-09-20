import { Info } from 'lucide-react'

/**
 * Le bandeau qui dit ce que ce site est.
 *
 * Il n'est pas décoratif et il ne se referme pas. Un site public portant le
 * logotype et la charte d'un établissement public, construit sans lui, doit
 * dire en toutes lettres — à la première ligne de chaque écran — d'où viennent
 * ses données et à quel titre il existe. Un visiteur qui découvre la page par
 * un lien direct ne lira pas la page « méthodologie » ; il lira ceci.
 */
export function BandeauDemonstration() {
  return (
    <aside
      role="note"
      className="mb-5 flex items-start gap-2.5 border-l-[4px] border-l-[var(--gpa-rouge)]
                 bg-[var(--gpa-lavande)] px-4 py-3"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gpa-bleu)]" aria-hidden />
      <p className="text-[13px] leading-snug text-[var(--gpa-bleu)]">
        <strong>Démonstration.</strong> Cette application est une maquette fonctionnelle construite
        par <strong>Flowmetrik</strong> à partir de <strong>données publiques uniquement</strong>,
        dans le cadre d’une réponse à l’appel d’offres n° 202600092 de Grand Paris Aménagement.
        Elle ne contient aucune donnée interne de l’établissement, n’est reliée à aucun de ses
        systèmes, et les objets de données y sont des hypothèses de travail signalées comme telles.
      </p>
    </aside>
  )
}
