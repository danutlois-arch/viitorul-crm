'use client'

import { useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { createMatchAction, type MatchFormState } from '@/app/(app)/matches/actions'
import type { CompetitionName, Match, Team } from '@/lib/types'

const initialState: MatchFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se salvează...' : 'Salvează meciul'}
    </button>
  )
}

export function MatchForm({
  teams,
  competitions,
  source,
  existingMatch,
}: {
  teams: Team[]
  competitions: CompetitionName[]
  source: 'supabase' | 'demo'
  existingMatch?: Match | null
}) {
  const [state, formAction] = useFormState(createMatchAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const isEditMode = Boolean(existingMatch)

  useEffect(() => {
    if (state.success && !isEditMode) {
      formRef.current?.reset()
    }
  }, [state.success, isEditMode])

  if (!teams.length) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-card">
        Adaugă mai întâi o echipă în modulul Echipe pentru a putea programa meciuri.
      </section>
    )
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-3xl border border-brand-100 bg-white p-5 shadow-card md:grid-cols-2"
    >
      <input type="hidden" name="mode" value={isEditMode ? 'edit' : 'create'} />
      <input type="hidden" name="matchId" value={existingMatch?.id ?? ''} />

      <div className="md:col-span-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {isEditMode
          ? 'Editezi un meci existent din calendarul clubului.'
          : source === 'supabase'
            ? 'Meciurile noi se salvează direct în Supabase pentru clubul autentificat.'
            : 'Mod demo activ. Formularul este pregătit pentru salvare reală după configurarea Supabase.'}
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Echipă</label>
        <select
          name="teamId"
          defaultValue={existingMatch?.teamId ?? teams[0]?.id}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Competiție</label>
        <select
          name="competition"
          defaultValue={existingMatch?.competition ?? competitions[0]}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          {competitions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Adversar</label>
        <input
          name="opponent"
          placeholder="CSM Bacău"
          required
          defaultValue={existingMatch?.opponent ?? ''}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Etapă</label>
        <input
          name="round"
          placeholder="Etapa 12 / Amical"
          defaultValue={existingMatch?.round ?? ''}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Data</label>
        <input
          type="date"
          name="date"
          required
          defaultValue={existingMatch?.date ?? ''}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Ora</label>
        <input
          type="time"
          name="hour"
          required
          defaultValue={existingMatch?.hour ?? ''}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Acasă / deplasare</label>
        <select
          name="venueType"
          defaultValue={existingMatch?.venueType ?? 'acasa'}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          <option value="acasa">Acasă</option>
          <option value="deplasare">Deplasare</option>
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Locație</label>
        <input
          name="location"
          required
          placeholder="Stadionul Municipal"
          defaultValue={existingMatch?.location ?? ''}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium text-slate-700">Observații</label>
        <input
          name="notes"
          placeholder="Ex: joc important pentru calificare"
          defaultValue={existingMatch?.notes ?? ''}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>
      <div className="md:col-span-2 flex items-center justify-between gap-4">
        <div className="space-y-2">
          {state.error ? <div className="text-sm text-rose-600">{state.error}</div> : null}
          {state.success ? <div className="text-sm text-emerald-700">{state.success}</div> : null}
        </div>
        <div className="flex items-center gap-3">
          {isEditMode ? (
            <Link
              href="/matches"
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
