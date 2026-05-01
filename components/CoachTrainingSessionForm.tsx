'use client'

import { useFormState, useFormStatus } from 'react-dom'
import {
  createCoachTrainingSessionAction,
  type CoachTrainingRecordFormState,
} from '@/app/(app)/coach/actions'

const initialState: CoachTrainingRecordFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se creează...' : 'Creează sesiunea'}
    </button>
  )
}

export function CoachTrainingSessionForm() {
  const [state, formAction] = useFormState(createCoachTrainingSessionAction, initialState)

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-[2rem] border border-brand-100 bg-white p-5 shadow-card md:grid-cols-2 xl:grid-cols-4"
    >
      <div className="xl:col-span-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Creează rapid o sesiune pentru grupa ta direct din telefon: antrenament, recuperare,
        sală sau ședință video.
      </div>
      <label className="text-sm text-slate-600">
        Data
        <input
          type="date"
          name="date"
          required
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
        />
      </label>
      <label className="text-sm text-slate-600">
        Ora
        <input
          type="time"
          name="hour"
          required
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
        />
      </label>
      <label className="text-sm text-slate-600">
        Tip sesiune
        <select
          name="type"
          defaultValue="antrenament"
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
        >
          <option value="antrenament">Antrenament</option>
          <option value="recuperare">Recuperare</option>
          <option value="sedinta_video">Ședință video</option>
          <option value="sala">Sală</option>
        </select>
      </label>
      <label className="text-sm text-slate-600">
        Locație
        <input
          name="location"
          required
          placeholder="Baza sportivă"
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
        />
      </label>

      <div className="xl:col-span-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
        </div>
        <SubmitButton />
      </div>
    </form>
  )
}
