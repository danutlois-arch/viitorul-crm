'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { createPlayerAction, type PlayerFormState } from '@/app/(app)/players/actions'
import Link from 'next/link'
import type { Player, Team } from '@/lib/types'

const initialState: PlayerFormState = {}

const positions = [
  'Portar',
  'Fundaș central',
  'Fundaș lateral',
  'Mijlocaș defensiv',
  'Mijlocaș central',
  'Mijlocaș ofensiv',
  'Extremă',
  'Atacant',
]

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Se salvează...' : 'Salvează jucătorul'}
    </button>
  )
}

interface PlayerFormProps {
  teams: Team[]
  source: 'supabase' | 'demo'
  existingPlayer?: Player | null
}

export function PlayerForm({ teams, source, existingPlayer }: PlayerFormProps) {
  const [state, formAction] = useFormState(createPlayerAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const isEditMode = Boolean(existingPlayer)
  const [previewUrl, setPreviewUrl] = useState(existingPlayer?.profileImageUrl ?? '')

  useEffect(() => {
    if (state.success && !isEditMode) {
      formRef.current?.reset()
      setPreviewUrl('')
    }
  }, [state.success, isEditMode])

  useEffect(() => {
    setPreviewUrl(existingPlayer?.profileImageUrl ?? '')
  }, [existingPlayer?.profileImageUrl])

  if (!teams.length) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-card">
        Adaugă mai întâi o echipă în modulul Echipe pentru a putea înregistra jucători.
      </section>
    )
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 rounded-3xl border border-brand-100 bg-white p-5 shadow-card md:grid-cols-2"
    >
      <input type="hidden" name="clubId" value={existingPlayer?.clubId ?? teams[0]?.clubId ?? ''} />
      <input type="hidden" name="mode" value={isEditMode ? 'edit' : 'create'} />
      <input type="hidden" name="playerId" value={existingPlayer?.id ?? ''} />
      <input type="hidden" name="existingProfileImageUrl" value={existingPlayer?.profileImageUrl ?? ''} />

      <div className="md:col-span-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {isEditMode
          ? 'Editezi un jucător existent din lot. Modificările se aplică direct în registrul clubului.'
          : source === 'supabase'
            ? 'Datele se salvează direct în Supabase pentru clubul autentificat.'
            : 'Mod demo activ. Formularul validează datele, dar nu persistă până nu configurezi Supabase.'}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Prenume</label>
        <input
          name="firstName"
          required
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-200 focus:ring"
          placeholder="Andrei"
          defaultValue={existingPlayer?.firstName ?? ''}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Nume</label>
        <input
          name="lastName"
          required
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-200 focus:ring"
          placeholder="Popescu"
          defaultValue={existingPlayer?.lastName ?? ''}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Echipă</label>
        <select
          name="teamId"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-200 focus:ring"
          defaultValue={existingPlayer?.teamId ?? teams[0]?.id}
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Data nașterii</label>
        <input
          type="date"
          name="dateOfBirth"
          required
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-200 focus:ring"
          defaultValue={existingPlayer?.dateOfBirth ?? ''}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Poziție</label>
        <select
          name="position"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-200 focus:ring"
          defaultValue={existingPlayer?.position ?? 'Mijlocaș central'}
        >
          {positions.map((position) => (
            <option key={position}>{position}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Părinte / tutore</label>
        <input
          name="guardianName"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-200 focus:ring"
          placeholder="Cristina Popescu"
          defaultValue={existingPlayer?.guardianName ?? ''}
        />
      </div>
      <div className="md:col-span-2 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[120px_1fr]">
        <div className="flex items-center justify-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-3xl bg-white shadow-sm">
            {previewUrl ? (
              <Image src={previewUrl} alt="Poză jucător" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Fără poză
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Poză profil</label>
          <input
            type="file"
            name="profileImageFile"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) {
                setPreviewUrl(existingPlayer?.profileImageUrl ?? '')
                return
              }

              setPreviewUrl(URL.createObjectURL(file))
            }}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
          <p className="mt-2 text-xs text-slate-500">
            Poți încărca o imagine nouă sau păstra poza existentă a jucătorului.
          </p>
        </div>
      </div>
      <div className="md:col-span-2 flex items-center justify-between gap-4">
        <div className="space-y-2">
          {state.error ? <div className="text-sm text-rose-600">{state.error}</div> : null}
          {state.success ? <div className="text-sm text-emerald-700">{state.success}</div> : null}
        </div>
        <div className="flex items-center gap-3">
          {isEditMode ? (
            <Link
              href="/players"
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
