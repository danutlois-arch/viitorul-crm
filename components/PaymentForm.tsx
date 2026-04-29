'use client'

import { useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { createPaymentAction, type PaymentFormState } from '@/app/(app)/payments/actions'
import { getMonthOptions, labelToMonth } from '@/lib/payment-utils'
import type { Payment, Player } from '@/lib/types'

const initialState: PaymentFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se salvează...' : 'Înregistrează plata'}
    </button>
  )
}

interface PaymentFormProps {
  players: Player[]
  source: 'supabase' | 'demo'
  existingPayment?: Payment | null
}

export function PaymentForm({ players, source, existingPayment }: PaymentFormProps) {
  const [state, formAction] = useFormState(createPaymentAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const months = getMonthOptions()
  const isEditMode = Boolean(existingPayment)

  useEffect(() => {
    if (state.success && !isEditMode) {
      formRef.current?.reset()
    }
  }, [state.success, isEditMode])

  if (!players.length) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-card">
        Adaugă mai întâi jucători în modulul Jucători pentru a putea înregistra plăți.
      </section>
    )
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-3xl border border-brand-100 bg-white p-5 shadow-card md:grid-cols-3"
    >
      <input type="hidden" name="mode" value={isEditMode ? 'edit' : 'create'} />
      <input type="hidden" name="paymentId" value={existingPayment?.id ?? ''} />

      <div className="md:col-span-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {isEditMode
          ? 'Editezi o plată deja înregistrată în registrul financiar al clubului.'
          : source === 'supabase'
            ? 'Plățile se înregistrează direct în Supabase pentru clubul autentificat.'
            : 'Mod demo activ. Formularul este pregătit pentru salvare reală după configurarea Supabase.'}
      </div>

      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium text-slate-700">Jucător</label>
        <select
          name="playerId"
          required
          defaultValue={existingPayment?.playerId ?? players[0]?.id}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.firstName} {player.lastName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
        <select
          name="status"
          defaultValue={existingPayment?.status ?? 'platit'}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          <option value="platit">plătit</option>
          <option value="partial">parțial</option>
          <option value="restant">restant</option>
          <option value="scutit">scutit</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Lună</label>
        <select
          name="month"
          defaultValue={existingPayment ? labelToMonth(existingPayment.month) : new Date().getMonth() + 1}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">An</label>
        <input
          type="number"
          name="year"
          min="2024"
          max="2100"
          defaultValue={existingPayment?.year ?? new Date().getFullYear()}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Metodă plată</label>
        <select
          name="method"
          defaultValue={existingPayment?.method ?? 'transfer_bancar'}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          <option value="cash">cash</option>
          <option value="transfer_bancar">transfer bancar</option>
          <option value="card">card</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Sumă datorată</label>
        <input
          type="number"
          name="dueAmount"
          min="0"
          step="1"
          defaultValue={existingPayment?.dueAmount ?? 350}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Sumă plătită</label>
        <input
          type="number"
          name="paidAmount"
          min="0"
          step="1"
          defaultValue={existingPayment?.paidAmount ?? 350}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>

      <div className="md:col-span-3">
        <label className="mb-2 block text-sm font-medium text-slate-700">Observații</label>
        <input
          name="notes"
          placeholder="Ex: taxă lunară aprilie"
          defaultValue={existingPayment?.notes ?? ''}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>

      <div className="md:col-span-3 flex items-center justify-between gap-4">
        <div className="space-y-2">
          {state.error ? <div className="text-sm text-rose-600">{state.error}</div> : null}
          {state.success ? <div className="text-sm text-emerald-700">{state.success}</div> : null}
        </div>
        <div className="flex items-center gap-3">
          {isEditMode ? (
            <Link
              href="/payments"
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
