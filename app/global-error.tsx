'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ro">
      <body className="bg-surface text-slate-800 antialiased">
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
          <section className="w-full rounded-[2rem] border border-rose-200 bg-white p-8 shadow-card">
            <p className="text-xs uppercase tracking-[0.28em] text-rose-600">Eroare critică</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-950">
              Aplicația are nevoie de o reîncărcare
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              A apărut o eroare neașteptată la nivel global. Încearcă o reîncărcare, apoi verifică
              setup-ul de producție dacă problema revine.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={reset}
                className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Reîncarcă aplicația
              </button>
            </div>
            {error.digest ? (
              <p className="mt-5 text-xs text-slate-400">Cod incident: {error.digest}</p>
            ) : null}
          </section>
        </main>
      </body>
    </html>
  )
}
