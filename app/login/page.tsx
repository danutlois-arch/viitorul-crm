import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/LoginForm'
import { isSupabaseConfigured } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function LoginPage() {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      redirect('/dashboard')
    }
  }

  return (
    <main className="min-h-screen p-6 lg:p-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] bg-pitch bg-grid bg-[size:34px_34px] p-8 text-white shadow-card lg:p-12">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Football Club SaaS</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight lg:text-6xl">
            Administrare modernă pentru cluburi și academii de fotbal din România.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-white/72 lg:text-lg">
            Evidență jucători, taxe, prezență, meciuri, statistici și rapoarte într-o singură platformă multi-club, pregătită pentru Supabase și RLS.
          </p>
        </section>

        <section className="rounded-[2rem] border border-brand-100 bg-white p-8 shadow-card">
          <h2 className="text-2xl font-semibold text-slate-950">Autentificare</h2>
          <p className="mt-2 text-sm text-slate-500">
            Login real cu Supabase Auth, sesiune server-side și roluri filtrate pe club.
          </p>

          <LoginForm />

          <div className="mt-8 rounded-2xl bg-brand-50 p-4 text-sm text-brand-900">
            Demo club: FC Viitorul Onești. Dacă nu ai configurat încă variabilele Supabase, formularul îți va spune asta explicit.
          </div>
        </section>
      </div>
    </main>
  )
}
