'use server'

import { redirect } from 'next/navigation'
import { getActionRedirectUrl } from '@/lib/flash'
import {
  createStatisticEntryForCurrentClub,
  deleteStatisticEntryForCurrentClub,
  updateStatisticEntryForCurrentClub,
} from '@/lib/statistics'

export interface StatisticFormState {
  error?: string
  success?: string
}

export async function createStatisticAction(
  _prevState: StatisticFormState,
  formData: FormData
): Promise<StatisticFormState> {
  const statisticId = String(formData.get('statisticId') ?? '').trim()
  const mode = String(formData.get('mode') ?? 'create').trim()
  const matchId = String(formData.get('matchId') ?? '').trim()
  const playerId = String(formData.get('playerId') ?? '').trim()
  const starter = String(formData.get('starter') ?? 'nu').trim() === 'da'
  const minutesPlayed = Number(formData.get('minutesPlayed') ?? 0)
  const goals = Number(formData.get('goals') ?? 0)
  const assists = Number(formData.get('assists') ?? 0)
  const yellowCards = Number(formData.get('yellowCards') ?? 0)
  const redCards = Number(formData.get('redCards') ?? 0)
  const coachRating = Number(formData.get('coachRating') ?? 0)
  const notes = String(formData.get('notes') ?? '').trim()

  if (!matchId || !playerId) {
    return { error: 'Selectează meciul și jucătorul.' }
  }

  if (
    [minutesPlayed, goals, assists, yellowCards, redCards].some(
      (value) => Number.isNaN(value) || value < 0
    )
  ) {
    return { error: 'Valorile numerice trebuie să fie valide și pozitive.' }
  }

  const result =
    mode === 'edit' && statisticId
      ? await updateStatisticEntryForCurrentClub({
          statisticId,
          matchId,
          playerId,
          starter,
          minutesPlayed,
          goals,
          assists,
          yellowCards,
          redCards,
          coachRating,
          notes,
        })
      : await createStatisticEntryForCurrentClub({
          matchId,
          playerId,
          starter,
          minutesPlayed,
          goals,
          assists,
          yellowCards,
          redCards,
          coachRating,
          notes,
        })

  return result.ok ? { success: result.message } : { error: result.message }
}

export async function deleteStatisticAction(formData: FormData) {
  const statisticId = String(formData.get('statisticId') ?? '').trim()

  if (!statisticId) {
    return
  }

  const result = await deleteStatisticEntryForCurrentClub(statisticId)
  redirect(
    getActionRedirectUrl({
      fallbackPath: '/statistics',
      message: result.message,
      tone: result.ok ? 'success' : 'error',
      clearKeys: ['edit'],
    })
  )
}
