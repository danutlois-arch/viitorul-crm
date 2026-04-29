'use client'

import { useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import {
  createContributionAction,
  type ContributionFormState,
} from '@/app/(app)/payments/contributions-actions'

const initialState: ContributionFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-pitch px-4 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se creează...' : 'Adaugă contribuție'}
    </button>
  )
}

export function ContributionForm({
  source,
}: {
  source: 'supabase' | 'demo'
}) {
  const [state, formAction] = useFormState(createContributionAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-3xl border border-brand-100 bg-white p-5 shadow-card md:grid-cols-3"
    >
      <div className="md:col-span-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {source === 'supabase'
          ? 'Poți înregistra donații și sponsorizări online. Contribuțiile online primesc automat un link pregătit pentru checkout.'
          : 'Mod demo activ. Formularul este pregătit pentru donații și sponsorizări online după configurarea Supabase.'}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Tip contribuție</label>
        <select name="type" defaultValue="donatie" className="w-full rounded-2xl border border-slate-200 px-4 py-3">
          <option value="donatie">Donație</option>
          <option value="sponsorizare">Sponsorizare</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Sursă</label>
        <select name="source" defaultValue="online" className="w-full rounded-2xl border border-slate-200 px-4 py-3">
          <option value="online">Online</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Sumă</label>
        <input type="number" name="amount" min="1" defaultValue="500" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Nume contribuabil</label>
        <input
          name="contributorName"
          required
          placeholder="Ex: Maria Iftime"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          name="contributorEmail"
          placeholder="donator@exemplu.ro"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Telefon</label>
        <input
          name="contributorPhone"
          placeholder="+40 ..."
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>

      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium text-slate-700">Companie sponsor</label>
        <input
          name="sponsorCompany"
          placeholder="Ex: Construct Invest"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>

      <div className="md:col-span-3">
        <label className="mb-2 block text-sm font-medium text-slate-700">Observații</label>
        <input
          name="notes"
          placeholder="Ex: donație pentru transport U17 / sponsorizare panotaj"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>

      <div className="md:col-span-3 flex items-center justify-between gap-4">
        <div className="space-y-2">
          {state.error ? <div className="text-sm text-rose-600">{state.error}</div> : null}
          {state.success ? <div className="text-sm text-emerald-700">{state.success}</div> : null}
        </div>
        <div className="w-full max-w-[240px]">
          <SubmitButton />
        </div>
      </div>
    </form>
  )
}
