export function OnboardingChecklist({
  percent,
  completed,
  total,
  steps,
}: {
  percent: number
  completed: number
  total: number
  steps: Array<{
    id: string
    title: string
    description: string
    done: boolean
  }>
}) {
  return (
    <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-brand-600">Onboarding club</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Configurare rapidă pentru lansare
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Urmărește pașii esențiali pentru ca un club nou să poată folosi platforma zilnic.
          </p>
        </div>
        <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
          {completed}/{total} pași finalizați · {percent}%
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-5 grid gap-3">
        {steps.map((step) => (
          <article
            key={step.id}
            className={`rounded-2xl border px-4 py-4 ${
              step.done
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{step.description}</p>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  step.done
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {step.done ? 'Complet' : 'În așteptare'}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
