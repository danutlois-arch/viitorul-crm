import type { ReadinessCheck } from '@/lib/ops-readiness'

export function LaunchReadinessPanel({
  percent,
  readyCount,
  totalCount,
  allReady,
  checks,
  pendingChecks,
  publicAppUrl,
}: {
  percent: number
  readyCount: number
  totalCount: number
  allReady: boolean
  checks: ReadinessCheck[]
  pendingChecks: ReadinessCheck[]
  publicAppUrl: string | null
}) {
  return (
    <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.26em] text-brand-600">Launch readiness</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Status lansare producție</h2>
          <p className="mt-2 text-sm text-slate-500">
            Panou rapid pentru configurările critice: Supabase, plăți, email și cron automat.
          </p>
        </div>
        <div
          className={`rounded-[1.5rem] border px-5 py-4 ${
            allReady
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em]">Scor readiness</p>
          <p className="mt-2 text-3xl font-semibold">{percent}%</p>
          <p className="mt-1 text-sm">
            {readyCount} din {totalCount} verificări trecute
          </p>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/70">
            <div
              className={`h-full rounded-full transition-all ${
                allReady ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {checks.map((check) => (
          <article
            key={check.id}
            className={`rounded-2xl border p-4 ${
              check.ready ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
            }`}
          >
            <p className="text-sm font-semibold text-slate-950">{check.label}</p>
            <p className="mt-2 text-sm text-slate-600">{check.description}</p>
            <p
              className={`mt-3 text-xs font-semibold uppercase tracking-[0.16em] ${
                check.ready ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {check.ready ? 'Configurat' : 'Necesită atenție'}
            </p>
            {!check.ready && check.recommendation ? (
              <p className="mt-2 text-xs text-slate-500">{check.recommendation}</p>
            ) : null}
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">URL public detectat</p>
          <p className="mt-1 break-all">{publicAppUrl ?? 'Lipsește din configurare.'}</p>
          <p className="mt-3 text-xs text-slate-500">
            Checklist-ul operațional complet este documentat în `docs/ops-checklist.md`.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Pașii rămași prioritari</p>
          {pendingChecks.length ? (
            <ul className="mt-3 space-y-2">
              {pendingChecks.slice(0, 3).map((check) => (
                <li key={check.id} className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{check.label}:</span>{' '}
                  {check.recommendation ?? check.description}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-emerald-700">
              Totul arată bine pentru lansare. Mai rămâne doar testul final end-to-end.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
