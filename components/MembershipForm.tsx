'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import {
  createMembershipAction,
  type MembershipFormState,
} from '@/app/(app)/clubs/memberships-actions'
import { membershipRoles } from '@/lib/membership-catalog'
import type { Team } from '@/lib/types'

const initialState: MembershipFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se salvează...' : 'Salvează rolul'}
    </button>
  )
}

export function MembershipForm({
  source,
  existingMembership,
  teams,
}: {
  source: 'supabase' | 'demo'
  existingMembership?: {
    id: string
    email: string
    role: string
    assignedTeamId?: string | null
  } | null
  teams: Pick<Team, 'id' | 'name'>[]
}) {
  const [state, formAction] = useFormState(createMembershipAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const isEditMode = Boolean(existingMembership)
  const [selectedRole, setSelectedRole] = useState(existingMembership?.role ?? 'coach')

  useEffect(() => {
    if (state.success && !isEditMode) {
      formRef.current?.reset()
    }
  }, [state.success, isEditMode])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-3xl border border-brand-100 bg-white p-5 shadow-card md:grid-cols-2"
    >
      <input type="hidden" name="mode" value={isEditMode ? 'edit' : 'create'} />
      <input type="hidden" name="membershipId" value={existingMembership?.id ?? ''} />

      <div className="md:col-span-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {isEditMode
          ? 'Editezi rolul unui utilizator deja asociat clubului.'
          : source === 'supabase'
            ? 'Adaugi un utilizator existent în platformă la clubul curent, pe baza emailului din profil.'
            : 'Mod demo activ. Formularul este pregătit pentru gestionarea rolurilor după configurarea Supabase.'}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Email utilizator</label>
        <input
          name="email"
          type="email"
          defaultValue={existingMembership?.email ?? ''}
          disabled={isEditMode}
          placeholder="utilizator@club.ro"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 disabled:bg-slate-50"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Rol</label>
        <select
          name="role"
          defaultValue={existingMembership?.role ?? 'coach'}
          onChange={(event) => setSelectedRole(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        >
          {membershipRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {selectedRole === 'coach' ? (
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Grupa / echipa alocată</label>
          <select
            name="assignedTeamId"
            defaultValue={existingMembership?.assignedTeamId ?? ''}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          >
            <option value="">Alege grupa antrenorului</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500">
            Antrenorul va vedea și gestiona doar această grupă în Coach Center.
          </p>
        </div>
      ) : null}

      <div className="md:col-span-2 flex items-center justify-between gap-4">
        <div className="space-y-2">
          {state.error ? <div className="text-sm text-rose-600">{state.error}</div> : null}
          {state.success ? <div className="text-sm text-emerald-700">{state.success}</div> : null}
        </div>
        <div className="flex items-center gap-3">
          {isEditMode ? (
            <Link
              href="/clubs"
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
