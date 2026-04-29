'use client'
import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import {
  updateClubSettingsAction,
  type ClubSettingsFormState,
} from '@/app/(app)/clubs/actions'
import { ClubLogo } from '@/components/ClubLogo'
import { clubThemes, getThemeByKey } from '@/lib/club-branding'
import type { Club } from '@/lib/types'

const initialState: ClubSettingsFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se salvează...' : 'Salvează setările clubului'}
    </button>
  )
}

export function ClubSettingsForm({
  club,
  source,
}: {
  club: Club
  source: 'supabase' | 'demo'
}) {
  const [state, formAction] = useFormState(updateClubSettingsAction, initialState)
  const [themeKey, setThemeKey] = useState(club.themeKey ?? 'viitorul-onesti')
  const [logoUrl, setLogoUrl] = useState(club.logoUrl ?? '')
  const activeTheme = getThemeByKey(themeKey)
  const previewLogo = logoUrl || activeTheme.logoPath

  useEffect(() => {
    setThemeKey(club.themeKey ?? 'viitorul-onesti')
    setLogoUrl(club.logoUrl ?? '')
  }, [club.logoUrl, club.themeKey])

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="clubId" value={club.id} />
      <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card">
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {source === 'supabase'
            ? 'Datele clubului și brandingul se salvează direct în Supabase pentru clubul activ.'
            : 'Mod demo activ. Formularul este pregătit pentru salvare reală după configurarea Supabase și politicilor RLS.'}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Nume club</label>
            <input
              name="name"
              required
              defaultValue={club.name}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">CUI</label>
            <input
              name="cui"
              required
              defaultValue={club.cui}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Oraș</label>
            <input
              name="city"
              required
              defaultValue={club.city}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Județ</label>
            <input
              name="county"
              required
              defaultValue={club.county}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              name="email"
              required
              defaultValue={club.email}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Telefon</label>
            <input
              name="phone"
              defaultValue={club.phone}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Adresă</label>
            <input
              name="address"
              defaultValue={club.address}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Website</label>
            <input
              name="website"
              defaultValue={club.website}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status abonament</label>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {club.subscriptionStatus}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Social media</label>
            <textarea
              name="socialMedia"
              rows={4}
              defaultValue={club.socialMedia.join('\n')}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Logo URL</label>
              <input
                name="logoUrl"
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="https://... sau /fc-viitorul-onesti-logo.png"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Upload logo</label>
              <input
                type="file"
                name="logoFile"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
              <p className="mt-2 text-xs text-slate-500">
                Recomandat: logo pătrat, fundal transparent, maxim 2 MB pentru încărcare rapidă pe mobil.
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Tema club</label>
              <select
                name="themeKey"
                value={themeKey}
                onChange={(event) => setThemeKey(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              >
                {clubThemes.map((theme) => (
                  <option key={theme.key} value={theme.key}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl bg-brand-50 p-4 text-sm text-slate-700">
              Setările de branding salvează tema implicită a clubului. Staff-ul poate testa local alte variante, dar tema clubului rămâne baza oficială.
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Preview branding</p>
            <div className="mt-4 flex items-center gap-4">
              <ClubLogo
                src={previewLogo}
                alt={club.name}
                className="relative h-20 w-20 rounded-3xl bg-white p-2 shadow-sm"
                imageClassName="p-2"
                fallbackClassName="text-base"
              />
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{club.name}</h3>
                <p className="text-sm text-slate-500">{activeTheme.label}</p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              {['--brand-500', '--brand-300', '--pitch', '--surface-accent'].map((token) => (
                <div
                  key={token}
                  className="h-12 flex-1 rounded-2xl border border-black/5"
                  style={{ backgroundColor: `rgb(${activeTheme.vars[token]})` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            {state.error ? <div className="text-sm text-rose-600">{state.error}</div> : null}
            {state.success ? <div className="text-sm text-emerald-700">{state.success}</div> : null}
          </div>
          <SubmitButton />
        </div>
      </section>
    </form>
  )
}
