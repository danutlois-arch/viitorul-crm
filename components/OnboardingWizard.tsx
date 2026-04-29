import Link from 'next/link'

const nextStepLinks: Record<string, { href: string; label: string }> = {
  'club-profile': { href: '/clubs', label: 'Completează profilul clubului' },
  teams: { href: '/teams', label: 'Creează prima echipă' },
  players: { href: '/players', label: 'Adaugă jucători' },
  matches: { href: '/matches', label: 'Programează un meci' },
  attendance: { href: '/attendance', label: 'Creează o sesiune de prezență' },
  payments: { href: '/payments', label: 'Pornește modulul financiar' },
}

export function OnboardingWizard({
  steps,
  percent,
}: {
  steps: Array<{
    id: string
    title: string
    description: string
    done: boolean
  }>
  percent: number
}) {
  const nextStep = steps.find((step) => !step.done)
  const cta = nextStep ? nextStepLinks[nextStep.id] : null

  return (
    <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-brand-600">Wizard lansare</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            {nextStep ? 'Următorul pas recomandat' : 'Clubul este aproape gata de lansare'}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            {nextStep
              ? `${nextStep.title} este pasul cu cel mai bun impact acum. ${nextStep.description}`
              : 'Configurarea de bază este completă. De aici putem merge pe rafinări, raportare avansată și automatizări.'}
          </p>
        </div>
        <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
          Progres onboarding: {percent}%
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${Math.max(6, Math.min(percent, 100))}%` }}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.slice(0, 4).map((step) => (
          <article
            key={step.id}
            className={`rounded-2xl border p-4 ${
              step.done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {step.done ? 'Complet' : 'În lucru'}
            </p>
            <h3 className="mt-2 text-base font-semibold text-slate-950">{step.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{step.description}</p>
          </article>
        ))}
      </div>

      {cta ? (
        <div className="mt-5">
          <Link
            href={cta.href}
            className="inline-flex rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {cta.label}
          </Link>
        </div>
      ) : null}
    </section>
  )
}
