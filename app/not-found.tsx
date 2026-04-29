import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-card">
        <p className="text-xs uppercase tracking-[0.28em] text-brand-600">404</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Pagina nu a fost găsită</h1>
        <p className="mt-3 text-sm text-slate-500">
          Linkul poate fi vechi sau resursa poate să nu mai existe în clubul curent.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Înapoi în dashboard
          </Link>
        </div>
      </section>
    </main>
  )
}
