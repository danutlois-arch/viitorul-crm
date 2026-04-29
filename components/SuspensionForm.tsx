'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import {
  createSuspensionAction,
  type SuspensionFormState,
} from '@/app/(app)/suspensions/actions'
import type { Suspension } from '@/lib/types'

const initialState: SuspensionFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se salvează...' : 'Salvează suspendarea'}
    </button>
  )
}

export function SuspensionForm({
  players,
  matches,
  source,
  existingSuspension,
}: {
  players: Array<{ id: string; name: string }>
  matches: Array<{ id: string; label: string }>
  source: 'supabase' | 'demo'
  existingSuspension?: Suspension | null
}) {
  const [state, formAction] = useFormState(createSuspensionAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const isEditMode = Boolean(existingSuspension)

  useEffect(() => {
    if (state.success && !isEditMode) {
      formRef.current?.reset()
    }
  }, [state.success, isEditMode])

  if (!players.length) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-card">
        Ai nevoie de jucători înregistrați înainte să poți administra suspendări.
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
      <input type="hidden" name="suspensionId" value={existingSuspension?.id ?? ''} />

      <div className="md:col-span-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {isEditMode
          ? 'Editezi o suspendare existentă din registrul disciplinar.'
          : source === 'supabase'
            ? 'Suspendările se salvează direct în Supabase pentru clubul autentificat.'
            : 'Mod demo activ. Formularul este pregătit pentru salvare reală după configurarea Supabase.'}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Jucător</label>
        <select
          name="playerId"
          defaultValue={existingSuspension?.playerId ?? players[0]?.id}
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
        <label className="mb-2 block text-sm font-medium text-slate-700">Meci asociat</label>
        <select
          name="matchId"
          defaultValue={existingSuspension?.matchId ?? ''}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          <option value="">Fără meci asociat</option>
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Motiv</label>
        <select
          name="reason"
          defaultValue={existingSuspension?.reason ?? 'cartonas_rosu'}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          <option value="cartonas_rosu">cartonaș roșu</option>
          <option value="cumul_galbene">cumul galbene</option>
          <option value="decizie_comisie">decizie comisie</option>
          <option value="disciplinar">disciplinar</option>
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Etape total</label>
        <input type="number" name="rounds" min="1" defaultValue={existingSuspension?.rounds ?? 1} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Etape rămase</label>
        <input type="number" name="remainingRounds" min="0" defaultValue={existingSuspension?.remainingRounds ?? 1} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Data început</label>
        <input type="date" name="startDate" defaultValue={existingSuspension?.startDate ?? ''} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
        <select
          name="status"
          defaultValue={existingSuspension?.status ?? 'activa'}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          <option value="activa">activă</option>
          <option value="expirata">expirată</option>
        </select>
      </div>

      <div className="md:col-span-2 flex items-center justify-between gap-4">
        <div className="space-y-2">
          {state.error ? <div className="text-sm text-rose-600">{state.error}</div> : null}
          {state.success ? <div className="text-sm text-emerald-700">{state.success}</div> : null}
        </div>
        <div className="flex items-center gap-3">
          {isEditMode ? (
            <Link
              href="/suspensions"
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
