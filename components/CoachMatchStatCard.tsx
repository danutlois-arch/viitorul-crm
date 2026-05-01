'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { saveCoachMatchStatAction, type CoachMatchStatFormState } from '@/app/(app)/coach/actions'

const initialState: CoachMatchStatFormState = {}

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

export function CoachMatchStatCard({
  matchId,
  player,
}: {
  matchId: string
  player: {
    playerId: string
    playerName: string
    position: string
    starter: boolean
    minutesPlayed: number
    goals: number
    assists: number
    yellowCards: number
    redCards: number
    coachRating: number
    enteredMinute: number
    exitedMinute: number
    notes: string
  }
}) {
  const [state, formAction] = useFormState(saveCoachMatchStatAction, initialState)

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
        <label className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          Titular
          <select
            name="starter"
            defaultValue={player.starter ? 'da' : 'nu'}
            className="ml-2 bg-transparent text-sm text-slate-900 outline-none"
          >
            <option value="da">Da</option>
            <option value="nu">Nu</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm text-slate-600">
          Minute jucate
          <input
            type="number"
            min="0"
            max="130"
            name="minutesPlayed"
            defaultValue={player.minutesPlayed}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          />
        </label>
        <label className="text-sm text-slate-600">
          Goluri
          <input
            type="number"
            min="0"
            max="20"
            name="goals"
            defaultValue={player.goals}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          />
        </label>
        <label className="text-sm text-slate-600">
          Assisturi
          <input
            type="number"
            min="0"
            max="20"
            name="assists"
            defaultValue={player.assists}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          />
        </label>
        <label className="text-sm text-slate-600">
          Nota antrenor
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
        <label className="text-sm text-slate-600">
          Cartonașe galbene
          <input
            type="number"
            min="0"
            max="2"
            name="yellowCards"
            defaultValue={player.yellowCards}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          />
        </label>
        <label className="text-sm text-slate-600">
          Cartonașe roșii
          <input
            type="number"
            min="0"
            max="1"
            name="redCards"
            defaultValue={player.redCards}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          />
        </label>
        <label className="text-sm text-slate-600">
          Intrat în minutul
          <input
            type="number"
            min="0"
            max="130"
            name="enteredMinute"
            defaultValue={player.enteredMinute}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          />
        </label>
        <label className="text-sm text-slate-600">
          Ieșit în minutul
          <input
            type="number"
            min="0"
            max="130"
            name="exitedMinute"
            defaultValue={player.exitedMinute}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm text-slate-600">
        Observații rapide
        <textarea
          name="notes"
          defaultValue={player.notes}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          placeholder="Schimbare, cartonaș, moment cheie, indicații pentru analiza de după meci."
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
