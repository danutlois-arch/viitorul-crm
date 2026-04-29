'use client'

import { useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { createTeamAction, type TeamFormState } from '@/app/(app)/teams/actions'
import { DEFAULT_SEASON } from '@/lib/app-config'
import type { CompetitionName, Team, TeamCategory } from '@/lib/types'

const initialState: TeamFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se salvează...' : 'Salvează echipa'}
    </button>
  )
}

interface TeamFormProps {
  categories: TeamCategory[]
  competitions: CompetitionName[]
  source: 'supabase' | 'demo'
  existingTeam?: Team | null
}

export function TeamForm({ categories, competitions, source, existingTeam }: TeamFormProps) {
  const [state, formAction] = useFormState(createTeamAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const isEditMode = Boolean(existingTeam)

  useEffect(() => {
    if (state.success && !isEditMode) {
      formRef.current?.reset()
    }
  }, [state.success, isEditMode])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-3xl border border-brand-100 bg-white p-5 shadow-card md:grid-cols-3"
    >
      <input type="hidden" name="mode" value={isEditMode ? 'edit' : 'create'} />
      <input type="hidden" name="teamId" value={existingTeam?.id ?? ''} />

      <div className="md:col-span-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {isEditMode
          ? 'Editezi o echipă existentă. Modificările se aplică direct în structura clubului.'
          : source === 'supabase'
            ? 'Echipele noi se salvează direct în Supabase pentru clubul autentificat.'
            : 'Mod demo activ. Formularul este pregătit pentru salvare reală după configurarea Supabase.'}
      </div>
      <div className="md:col-span-3">
        <label className="mb-2 block text-sm font-medium text-slate-700">Nume echipă</label>
        <input
          name="name"
          placeholder="FC Viitorul Onești U15"
          required
          defaultValue={existingTeam?.name ?? ''}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-200 focus:ring"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Categorie</label>
        <select
          name="category"
          defaultValue={existingTeam?.category ?? categories[0]}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Competiție</label>
        <select
          name="competition"
          defaultValue={existingTeam?.competition ?? competitions[0]}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          {competitions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Sezon</label>
        <input
          name="season"
          defaultValue={existingTeam?.season ?? DEFAULT_SEASON}
          required
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-200 focus:ring"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Antrenor principal</label>
        <input
          name="headCoach"
          placeholder="Ex: Mihai Stoica"
          defaultValue={existingTeam?.headCoach ?? ''}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-200 focus:ring"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Antrenor secund</label>
        <input
          name="assistantCoach"
          placeholder="Ex: Paul Cristea"
          defaultValue={existingTeam?.assistantCoach ?? ''}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-200 focus:ring"
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium text-slate-700">Team manager</label>
        <input
          name="teamManager"
          placeholder="Ex: Andrei Enache"
          defaultValue={existingTeam?.teamManager ?? ''}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-200 focus:ring"
        />
      </div>

      <div className="md:col-span-3 flex items-center justify-between gap-4">
        <div className="space-y-2">
          {state.error ? <div className="text-sm text-rose-600">{state.error}</div> : null}
          {state.success ? <div className="text-sm text-emerald-700">{state.success}</div> : null}
        </div>
        <div className="flex items-center gap-3">
          {isEditMode ? (
            <Link
              href="/teams"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50"
            >
              Anulează
            </Link>
          ) : null}
          <SubmitButton />
        </div>
      </div>
    </form>
  )
}
