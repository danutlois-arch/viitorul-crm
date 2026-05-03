'use client'

import { useFormState, useFormStatus } from 'react-dom'
import {
  saveCoachMatchSquadAction,
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
      {pending ? 'Se salvează...' : 'Salvează fișa'}
    </button>
  )
}

export function CoachSquadCard({
  matchId,
  player,
}: {
  matchId: string
  player: {
    playerId: string
    playerName: string
    position: string
    calledUp: boolean
    present: boolean
    starter: boolean
    minutesPlayed: number
  }
}) {
  const [state, formAction] = useFormState(saveCoachMatchSquadAction, initialState)

  return (
    <form
      action={formAction}
      className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-card"
    >
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="playerId" value={player.playerId} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{player.playerName}</h3>
          <p className="mt-1 text-sm text-slate-500">{player.position}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm text-slate-600">
          Convocat
          <select
            name="calledUp"
            defaultValue={player.calledUp ? 'da' : 'nu'}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          >
            <option value="da">Da</option>
            <option value="nu">Nu</option>
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Legitimat / prezent
          <select
            name="present"
            defaultValue={player.present ? 'da' : 'nu'}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          >
            <option value="da">Da</option>
            <option value="nu">Nu</option>
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Titular
          <select
            name="starter"
            defaultValue={player.starter ? 'da' : 'nu'}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          >
            <option value="da">Da</option>
            <option value="nu">Nu</option>
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Minute planificate/jucate
          <input
            type="number"
            min="0"
            max="130"
            name="minutesPlayed"
            defaultValue={player.minutesPlayed}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          />
        </label>
      </div>

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
