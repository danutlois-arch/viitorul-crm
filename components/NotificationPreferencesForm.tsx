'use client'

import { useFormState, useFormStatus } from 'react-dom'
import {
  type NotificationPreferencesFormState,
  updateNotificationPreferencesAction,
} from '@/app/(app)/notifications/actions'
import type { NotificationPreferenceSettings } from '@/lib/types'

const initialState: NotificationPreferencesFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se salvează...' : 'Salvează preferințele'}
    </button>
  )
}

function ToggleField({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: keyof NotificationPreferenceSettings
  label: string
  description: string
  defaultChecked: boolean
}) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
      />
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </label>
  )
}

export function NotificationPreferencesForm({
  settings,
}: {
  settings: NotificationPreferenceSettings
}) {
  const [state, formAction] = useFormState(updateNotificationPreferencesAction, initialState)

  return (
    <form action={formAction} className="rounded-[2rem] border border-brand-100 bg-white p-5 shadow-card">
      <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Preferințe personale</p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950">Notificări și remindere</h2>
      <p className="mt-2 text-sm text-slate-500">
        Alege ce tipuri de alerte vrei să vezi și să pregătim ulterior pentru email sau alte canale.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <ToggleField
          name="emailEnabled"
          label="Pregătire pentru email"
          description="Păstrează preferința pentru viitoarele notificări trimise prin email."
          defaultChecked={settings.emailEnabled}
        />
        <ToggleField
          name="paymentReminders"
          label="Taxe și contribuții"
          description="Alerte pentru restanțe, plăți și contribuții externe."
          defaultChecked={settings.paymentReminders}
        />
        <ToggleField
          name="matchReminders"
          label="Meciuri apropiate"
          description="Remindere pentru meciuri programate în perioada imediată."
          defaultChecked={settings.matchReminders}
        />
        <ToggleField
          name="suspensionReminders"
          label="Suspendări active"
          description="Alerte despre indisponibilități disciplinare și etape rămase."
          defaultChecked={settings.suspensionReminders}
        />
        <ToggleField
          name="attendanceReminders"
          label="Prezență și participare"
          description="Alerte când prezența medie scade sub pragul dorit."
          defaultChecked={settings.attendanceReminders}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
        </div>
        <SubmitButton />
      </div>
    </form>
  )
}
