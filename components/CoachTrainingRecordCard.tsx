'use client'

import { useFormState, useFormStatus } from 'react-dom'
import {
  saveCoachTrainingRecordAction,
  type CoachTrainingRecordFormState,
} from '@/app/(app)/coach/actions'

const initialState: CoachTrainingRecordFormState = {}

function SaveButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se salvează...' : 'Salvează fișa'}
    </button>
  )
}

export function CoachTrainingRecordCard({
  sessionId,
  player,
}: {
  sessionId: string
  player: {
    playerId: string
    playerName: string
    position: string
    status: 'prezent' | 'absent_motivat' | 'absent_nemotivat' | 'accidentat'
    coachRating: number
    notes: string
  }
}) {
  const [state, formAction] = useFormState(saveCoachTrainingRecordAction, initialState)

  return (
    <form
      action={formAction}
      className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-card"
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="playerId" value={player.playerId} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{player.playerName}</h3>
          <p className="mt-1 text-sm text-slate-500">{player.position}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-600">
          Prezență
          <select
            name="status"
            defaultValue={player.status}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          >
            <option value="prezent">Prezent</option>
            <option value="absent_motivat">Absent motivat</option>
            <option value="absent_nemotivat">Absent nemotivat</option>
            <option value="accidentat">Accidentat</option>
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Nota antrenament
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            name="coachRating"
            defaultValue={player.coachRating}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm text-slate-600">
        Observații antrenament
        <textarea
          name="notes"
          defaultValue={player.notes}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          placeholder="Atitudine, intensitate, progres, exerciții, recomandări."
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
        </div>
        <SaveButton />
      </div>
    </form>
  )
}
