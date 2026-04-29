'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import {
  createAttendanceAction,
  type AttendanceFormState,
} from '@/app/(app)/attendance/actions'
import type { Team } from '@/lib/types'

const initialState: AttendanceFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se salvează...' : 'Marchează prezența'}
    </button>
  )
}

export function AttendanceForm({
  teams,
  source,
  existingAttendance,
}: {
  teams: Team[]
  source: 'supabase' | 'demo'
  existingAttendance?: {
    id: string
    teamId: string
    type: Team extends never ? never : 'antrenament' | 'recuperare' | 'sedinta_video' | 'sala'
    date: string
    hour: string
    location: string
  } | null
}) {
  const [state, formAction] = useFormState(createAttendanceAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const isEditMode = Boolean(existingAttendance)

  useEffect(() => {
    if (state.success && !isEditMode) {
      formRef.current?.reset()
    }
  }, [state.success, isEditMode])

  if (!teams.length) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-card">
        Adaugă mai întâi o echipă în modulul Echipe pentru a putea crea sesiuni de prezență.
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
      <input type="hidden" name="sessionId" value={existingAttendance?.id ?? ''} />
      <div className="md:col-span-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {isEditMode
          ? 'Editezi o sesiune existentă de prezență.'
          : source === 'supabase'
            ? 'Sesiunile de prezență noi se salvează direct în Supabase pentru clubul autentificat.'
            : 'Mod demo activ. Formularul este pregătit pentru salvare reală după configurarea Supabase.'}
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Echipă</label>
        <select
          name="teamId"
          defaultValue={existingAttendance?.teamId ?? teams[0]?.id}
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
        <label className="mb-2 block text-sm font-medium text-slate-700">Tip sesiune</label>
        <select
          name="type"
          defaultValue={existingAttendance?.type ?? 'antrenament'}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          <option value="antrenament">Antrenament</option>
          <option value="recuperare">Recuperare</option>
          <option value="sedinta_video">Ședință video</option>
          <option value="sala">Sală</option>
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Data</label>
        <input
          type="date"
          name="date"
          required
          defaultValue={existingAttendance?.date ?? ''}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Ora</label>
        <input
          type="time"
          name="hour"
          required
          defaultValue={existingAttendance?.hour ?? ''}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Locație</label>
        <input
          name="location"
          required
          defaultValue={existingAttendance?.location ?? ''}
          placeholder="Baza sportivă"
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
              href="/attendance"
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
