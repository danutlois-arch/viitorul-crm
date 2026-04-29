'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { loginAction, type LoginActionState } from '@/app/login/actions'

const initialState: LoginActionState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se autentifică...' : 'Intră în platformă'}
    </button>
  )
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState)

  return (
    <form action={formAction} className="mt-8 grid gap-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          name="email"
          required
          placeholder="office@club.ro"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-200 focus:ring"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Parolă</label>
        <input
          type="password"
          name="password"
          required
          placeholder="Introdu parola"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-200 focus:ring"
        />
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  )
}
