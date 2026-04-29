'use client'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-[2rem] border border-rose-200 bg-white p-8 shadow-card">
        <p className="text-xs uppercase tracking-[0.28em] text-rose-600">A apărut o problemă</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">
          Nu am putut încărca această zonă a aplicației
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Aplicația a blocat elegant eroarea, ca să nu pierzi contextul. Încearcă din nou, iar dacă
          problema persistă verifică setările de mediu, conexiunea Supabase sau ultimul flux rulat.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Reîncearcă
          </button>
          <a
            href="/clubs"
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Mergi la Cluburi
          </a>
        </div>
        {error.digest ? (
          <p className="mt-5 text-xs text-slate-400">Cod incident: {error.digest}</p>
        ) : null}
      </section>
    </main>
  )
}
