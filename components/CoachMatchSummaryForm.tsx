'use client'

import { useFormState, useFormStatus } from 'react-dom'
import {
  saveCoachMatchSummaryAction,
  type CoachMatchdayFormState,
} from '@/app/(app)/coach/actions'

const initialState: CoachMatchdayFormState = {}

function SaveButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se salvează...' : 'Salvează rezumatul'}
    </button>
  )
}

export function CoachMatchSummaryForm({
  matchId,
  summary,
}: {
  matchId: string
  summary: {
    teamScore: number
    opponentScore: number
    status: 'programat' | 'jucat' | 'amanat' | 'anulat'
    notes: string
  }
}) {
  const [state, formAction] = useFormState(saveCoachMatchSummaryAction, initialState)

  return (
    <form
      action={formAction}
      className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-card"
    >
      <input type="hidden" name="matchId" value={matchId} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm text-slate-600">
          Golurile noastre
          <input
            type="number"
            min="0"
            max="30"
            name="teamScore"
            defaultValue={summary.teamScore}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          />
        </label>
        <label className="text-sm text-slate-600">
          Golurile adversarului
          <input
            type="number"
            min="0"
            max="30"
            name="opponentScore"
            defaultValue={summary.opponentScore}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          />
        </label>
        <label className="text-sm text-slate-600">
          Status meci
          <select
            name="status"
            defaultValue={summary.status}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          >
            <option value="programat">Programat</option>
            <option value="jucat">Jucat</option>
            <option value="amanat">Amânat</option>
            <option value="anulat">Anulat</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block text-sm text-slate-600">
        Observații după meci
        <textarea
          name="notes"
          defaultValue={summary.notes}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          placeholder="Scurt rezumat tactic, concluzii, puncte bune și ce corectăm."
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
