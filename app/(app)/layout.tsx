import { Suspense, type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { FlashToast } from '@/components/FlashToast'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { ThemeScript } from '@/components/ThemeScript'
import { getNotificationsForCurrentClub } from '@/lib/notifications'
import { getNotificationInboxForCurrentUser } from '@/lib/user-notifications'
import { getThemeByKey, getDefaultThemeKeyForClub } from '@/lib/club-branding'
import { getAppViewer } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      redirect('/login')
    }
  }

  const [viewer, notifications, notificationInbox] = await Promise.all([
    getAppViewer(),
    getNotificationsForCurrentClub(),
    getNotificationInboxForCurrentUser(4),
  ])
  const theme = getThemeByKey(viewer.club.themeKey ?? getDefaultThemeKeyForClub(viewer.club.name))
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
}
