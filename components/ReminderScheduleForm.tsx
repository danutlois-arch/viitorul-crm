'use client'

import { useFormState, useFormStatus } from 'react-dom'
import {
  type ReminderScheduleFormState,
  updateReminderScheduleAction,
} from '@/app/(app)/notifications/schedule-actions'
import type { ReminderScheduleSettings } from '@/lib/types'

const initialState: ReminderScheduleFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se salvează...' : 'Salvează programarea'}
    </button>
  )
}

export function ReminderScheduleForm({
  schedule,
}: {
  schedule: ReminderScheduleSettings
}) {
  const [state, formAction] = useFormState(updateReminderScheduleAction, initialState)

  return (
    <form action={formAction} className="rounded-[2rem] border border-brand-100 bg-white p-5 shadow-card">
      <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Programare reminder</p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950">Reminder recurent</h2>
      <p className="mt-2 text-sm text-slate-500">
        Configurează o trimitere regulată pentru digestul de alerte. Acum este pregătită pentru rulare manuală și conectare ulterioară la cron.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={schedule.active}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
          />
          <div>
            <p className="text-sm font-semibold text-slate-900">Activează trimiterea recurentă</p>
            <p className="mt-1 text-sm text-slate-500">
              Programarea curentă: {schedule.nextRunLabel ?? 'neconfigurată'}.
            </p>
          </div>
        </label>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Frecvență</label>
          <select
            name="frequency"
            defaultValue={schedule.frequency}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          >
            <option value="daily">Zilnic</option>
            <option value="weekdays">Luni-Vineri</option>
            <option value="weekly">Săptămânal</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Ora</label>
            <input
              type="number"
              min="0"
              max="23"
              name="hour"
              defaultValue={schedule.hour}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Minute</label>
            <input
              type="number"
              min="0"
              max="59"
              name="minute"
              defaultValue={schedule.minute}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
          {schedule.lastRunAt ? (
            <p className="text-xs text-slate-400">
              Ultima rulare: {new Date(schedule.lastRunAt).toLocaleString('ro-RO')}
            </p>
          ) : null}
        </div>
        <SubmitButton />
      </div>
    </form>
  )
}
