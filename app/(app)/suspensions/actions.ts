'use server'

import { redirect } from 'next/navigation'
import { getActionRedirectUrl } from '@/lib/flash'
import {
  createSuspensionForCurrentClub,
  deleteSuspensionForCurrentClub,
  updateSuspensionForCurrentClub,
} from '@/lib/suspensions'
import type { Suspension } from '@/lib/types'

export interface SuspensionFormState {
  error?: string
  success?: string
}

const validReasons: Suspension['reason'][] = [
  'cartonas_rosu',
  'cumul_galbene',
  'decizie_comisie',
  'disciplinar',
]

export async function createSuspensionAction(
  _prevState: SuspensionFormState,
  formData: FormData
): Promise<SuspensionFormState> {
  const suspensionId = String(formData.get('suspensionId') ?? '').trim()
  const mode = String(formData.get('mode') ?? 'create').trim()
  const playerId = String(formData.get('playerId') ?? '').trim()
  const matchId = String(formData.get('matchId') ?? '').trim()
  const reason = String(formData.get('reason') ?? '').trim() as Suspension['reason']
  const rounds = Number(formData.get('rounds') ?? 0)
  const remainingRounds = Number(formData.get('remainingRounds') ?? 0)
  const startDate = String(formData.get('startDate') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim() as Suspension['status']

  if (!playerId || !startDate) {
    return { error: 'Selectează jucătorul și data de început.' }
  }

  if (!validReasons.includes(reason)) {
    return { error: 'Motivul suspendării nu este valid.' }
  }

  if (rounds < 1 || remainingRounds < 0) {
    return { error: 'Numărul de etape trebuie să fie valid.' }
  }

  const result =
    mode === 'edit' && suspensionId
      ? await updateSuspensionForCurrentClub({
          suspensionId,
          playerId,
          matchId,
          reason,
          rounds,
          remainingRounds,
          startDate,
          status,
        })
      : await createSuspensionForCurrentClub({
          playerId,
          matchId,
          reason,
          rounds,
          remainingRounds,
          startDate,
          status,
        })

  return result.ok ? { success: result.message } : { error: result.message }
}

export async function deleteSuspensionAction(formData: FormData) {
  const suspensionId = String(formData.get('suspensionId') ?? '').trim()

  if (!suspensionId) {
    return
  }

  const result = await deleteSuspensionForCurrentClub(suspensionId)
  redirect(
    getActionRedirectUrl({
      fallbackPath: '/suspensions',
      message: result.message,
      tone: result.ok ? 'success' : 'error',
      clearKeys: ['edit'],
    })
  )
}
