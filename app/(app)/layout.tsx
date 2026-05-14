import { Suspense, type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { FlashToast } from '@/components/FlashToast'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { ThemeScript } from '@/components/ThemeScript'
import { getNotificationsForCurrentClub } from '@/lib/notifications'
import { getNotificationInboxForCurrentUser } from '@/lib/user-notifications'
import { getThemeByKey, getDefaultThemeKeyForClub } from '@/lib/club-branding'
import { ViewerResolutionError, getAppViewer } from '@/lib/auth'
import { isSupabaseAuthConfigured } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (isSupabaseAuthConfigured()) {
    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      redirect('/login')
    }
  }

  try {
    const [viewer, notifications, notificationInbox] = await Promise.all([
      getAppViewer(),
      getNotificationsForCurrentClub(),
      getNotificationInboxForCurrentUser(4),
    ])
    const theme = getThemeByKey(
      viewer.club.themeKey ?? getDefaultThemeKeyForClub(viewer.club.name)
    )
    const logoPath = viewer.club.logoUrl || theme.logoPath

    return (
      <div className="mx-auto min-h-screen max-w-[1600px] p-3 sm:p-4 lg:p-6">
        <ThemeScript
          clubId={viewer.club.id}
          clubName={viewer.club.name}
          preferredThemeKey={viewer.club.themeKey}
        />
        <Suspense fallback={null}>
          <FlashToast />
        </Suspense>
        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className="xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
            <Sidebar
              clubName={viewer.club.name}
              city={viewer.club.city}
              county={viewer.club.county}
              source={viewer.source}
              logoPath={logoPath}
              role={viewer.user.role}
              assignedTeamId={viewer.user.assignedTeamId}
            />
          </div>
          <div className="space-y-4">
            <Header
              clubId={viewer.club.id}
              clubName={viewer.club.name}
              fullName={viewer.user.fullName}
              role={viewer.user.role}
              source={viewer.source}
              logoPath={logoPath}
              preferredThemeKey={viewer.club.themeKey}
              notificationCount={notifications.totalCount}
              notificationPreview={notificationInbox}
            />
            <main className="space-y-5">{children}</main>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    if (error instanceof ViewerResolutionError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
          <section className="w-full rounded-[2rem] border border-rose-200 bg-white p-8 shadow-card">
            <p className="text-xs uppercase tracking-[0.28em] text-rose-600">Acces blocat în siguranță</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-950">
              Aplicația nu poate porni în live mode
            </h1>
            <p className="mt-3 text-sm text-slate-500">{error.message}</p>
            <p className="mt-3 text-sm text-slate-500">
              Corectează setup-ul Supabase sau datele de membership înainte de testare. Aplicația a blocat încărcarea pentru a evita o stare demo/live mixtă.
            </p>
            <div className="mt-6">
              <a
                href="/login"
                className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Înapoi la autentificare
              </a>
            </div>
          </section>
        </main>
      )
    }

    throw error
  }
}
