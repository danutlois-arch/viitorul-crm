'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import {
  createStatisticAction,
  type StatisticFormState,
} from '@/app/(app)/statistics/actions'

const initialState: StatisticFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se salvează...' : 'Salvează statistica'}
    </button>
  )
}

export function StatisticForm({
  players,
  matches,
  source,
  existingStatistic,
}: {
  players: Array<{ id: string; name: string }>
  matches: Array<{ id: string; label: string }>
  source: 'supabase' | 'demo'
  existingStatistic?: {
    id: string
    matchId: string
    playerId: string
    starter: boolean
    minutesPlayed: number
    goals: number
    assists: number
    yellowCards: number
    redCards: number
    coachRating: number
    notes: string
  } | null
}) {
  const [state, formAction] = useFormState(createStatisticAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const isEditMode = Boolean(existingStatistic)

  useEffect(() => {
    if (state.success && !isEditMode) {
      formRef.current?.reset()
    }
  }, [state.success, isEditMode])

  if (!players.length || !matches.length) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-card">
        Ai nevoie de jucători și meciuri înregistrate înainte să poți salva statistici.
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
      <input type="hidden" name="statisticId" value={existingStatistic?.id ?? ''} />

      <div className="md:col-span-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {isEditMode
          ? 'Editezi o statistică de meci deja înregistrată.'
          : source === 'supabase'
            ? 'Statistica se salvează direct în Supabase pentru clubul autentificat.'
            : 'Mod demo activ. Formularul este pregătit pentru salvare reală după configurarea Supabase.'}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Meci</label>
        <select
          name="matchId"
          defaultValue={existingStatistic?.matchId ?? matches[0]?.id}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Jucător</label>
        <select
          name="playerId"
          defaultValue={existingStatistic?.playerId ?? players[0]?.id}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Titular</label>
        <select
          name="starter"
          defaultValue={existingStatistic?.starter ? 'da' : 'nu'}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          <option value="da">Da</option>
          <option value="nu">Nu</option>
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Minute jucate</label>
        <input
          type="number"
          name="minutesPlayed"
          min="0"
          defaultValue={existingStatistic?.minutesPlayed ?? 90}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Goluri</label>
        <input type="number" name="goals" min="0" defaultValue={existingStatistic?.goals ?? 0} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Assisturi</label>
        <input type="number" name="assists" min="0" defaultValue={existingStatistic?.assists ?? 0} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Cartonașe galbene</label>
        <input type="number" name="yellowCards" min="0" defaultValue={existingStatistic?.yellowCards ?? 0} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Cartonașe roșii</label>
        <input type="number" name="redCards" min="0" defaultValue={existingStatistic?.redCards ?? 0} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Rating antrenor</label>
        <input type="number" name="coachRating" min="0" max="10" step="0.1" defaultValue={existingStatistic?.coachRating ?? 7} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium text-slate-700">Observații</label>
        <input
          name="notes"
          defaultValue={existingStatistic?.notes ?? ''}
          placeholder="Ex: impact bun între linii, disciplină bună"
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
              href="/statistics"
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
