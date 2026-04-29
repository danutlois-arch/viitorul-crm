export default function AppLoading() {
  return (
    <main className="space-y-5">
      <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card">
        <div className="h-4 w-32 animate-pulse rounded-full bg-brand-100" />
        <div className="mt-4 h-10 w-80 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded-full bg-slate-100" />
      </section>
      <section className="grid gap-5 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card"
          >
            <div className="h-4 w-24 animate-pulse rounded-full bg-brand-100" />
            <div className="mt-4 h-8 w-28 animate-pulse rounded-2xl bg-slate-100" />
            <div className="mt-3 h-4 w-40 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </section>
    </main>
  )
}
