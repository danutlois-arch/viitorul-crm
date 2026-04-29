'use client'

import { useEffect, useState } from 'react'
import {
  clubThemes,
  getDefaultThemeKeyForClub,
  type ClubThemeKey,
} from '@/lib/club-branding'

function applyTheme(key: ClubThemeKey, storageKey: string) {
  const theme = clubThemes.find((item) => item.key === key) ?? clubThemes[0]
  document.documentElement.dataset.theme = theme.key
  Object.entries(theme.vars).forEach(([name, value]) => {
    document.documentElement.style.setProperty(name, value)
  })
  localStorage.setItem(storageKey, theme.key)
}

export function ThemeSwitcher({
  clubId,
  clubName,
  preferredThemeKey,
}: {
  clubId: string
  clubName: string
  preferredThemeKey?: string
}) {
  const defaultTheme =
    (preferredThemeKey as ClubThemeKey | undefined) ?? getDefaultThemeKeyForClub(clubName)
  const storageKey = `club-theme:${clubId}`
  const [themeKey, setThemeKey] = useState<ClubThemeKey>(defaultTheme)

  useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as ClubThemeKey | null
    const activeTheme = storedTheme ?? defaultTheme
    setThemeKey(activeTheme)
    applyTheme(activeTheme, storageKey)
  }, [defaultTheme, storageKey])

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        Tema club
      </label>
      <div className="flex flex-wrap gap-2">
        {clubThemes.map((theme) => (
          <button
            key={theme.key}
            type="button"
            onClick={() => {
              setThemeKey(theme.key)
              applyTheme(theme.key, storageKey)
            }}
            className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
              themeKey === theme.key
                ? 'border-brand-500 bg-brand-50 text-brand-800'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200'
            }`}
          >
            {theme.label}
          </button>
        ))}
      </div>
    </div>
  )
}
