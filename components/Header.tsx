'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/login/actions'
import { ClubLogo } from '@/components/ClubLogo'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { DEFAULT_SEASON } from '@/lib/app-config'
import { navigation } from '@/lib/navigation'
import type { NotificationInboxItem, UserRole } from '@/lib/types'

const roleLabels = {
  super_admin: 'Super Admin',
  club_admin: 'Admin Club',
  sporting_director: 'Director Sportiv',
  coach: 'Antrenor',
  team_manager: 'Team Manager',
  parent: 'Părinte',
  player: 'Jucător',
} as const

interface HeaderProps {
  clubId: string
  clubName: string
  fullName: string
  role: UserRole
  source: 'supabase' | 'demo'
  logoPath?: string
  preferredThemeKey?: string
  notificationCount?: number
  notificationPreview?: NotificationInboxItem[]
}

export function Header({
  clubId,
  clubName,
  fullName,
  role,
  source,
  logoPath,
  preferredThemeKey,
  notificationCount = 0,
  notificationPreview = [],
}: HeaderProps) {
  const pathname = usePathname()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const currentPage = navigation.find((item) => item.href === pathname)

  return (
    <header className="flex flex-col gap-5 rounded-[2rem] border border-brand-100 bg-white px-5 py-4 shadow-card xl:flex-row xl:items-center xl:justify-between">
      <div className="flex items-center gap-4">
        {logoPath ? (
          <ClubLogo
            src={logoPath}
            alt={clubName}
            className="hidden h-14 w-14 border border-brand-100 bg-brand-50 p-1 sm:flex"
            imageClassName="p-1"
            fallbackClassName="text-sm"
          />
        ) : null}
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-brand-600">Platformă club</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {currentPage?.label ?? 'Dashboard'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {clubName} · sezon {DEFAULT_SEASON}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 xl:min-w-[520px]">
        <ThemeSwitcher
          clubId={clubId}
          clubName={clubName}
          preferredThemeKey={preferredThemeKey}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDrawerOpen((value) => !value)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                notificationCount > 0
                  ? 'border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              {notificationCount > 0 ? `${notificationCount} alerte active` : 'Fără alerte critice'}
            </button>

            {isDrawerOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[min(92vw,26rem)] rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-2xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-brand-600">Inbox rapid</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950">Notificări recente</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                  >
                    Închide
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {notificationPreview.length ? (
                    notificationPreview.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          {!item.isRead ? (
                            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                              Nouă
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{item.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      Nu există încă notificări sincronizate pentru acest utilizator.
                    </div>
                  )}
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  Pentru istoric complet și setări mergi în zona Cluburi.
                </p>
              </div>
            ) : null}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {fullName} · {roleLabels[role]}
          </div>
          {source === 'demo' ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Mod demo până conectezi Supabase
            </div>
          ) : null}
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Deconectare
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
