'use server'

import type { MatchStatus } from '@/lib/types'
import { saveCoachMatchStat } from '@/lib/coach'

export interface CoachMatchStatFormState {
  error?: string
  success?: string
}

export async function saveCoachMatchStatAction(
  _prevState: CoachMatchStatFormState,
  formData: FormData
): Promise<CoachMatchStatFormState> {
  const matchId = String(formData.get('matchId') ?? '').trim()
  const playerId = String(formData.get('playerId') ?? '').trim()
  const starter = String(formData.get('starter') ?? 'nu').trim() === 'da'
  const minutesPlayed = Number(formData.get('minutesPlayed') ?? 0)
  const goals = Number(formData.get('goals') ?? 0)
  const assists = Number(formData.get('assists') ?? 0)
  const yellowCards = Number(formData.get('yellowCards') ?? 0)
  const redCards = Number(formData.get('redCards') ?? 0)
  const coachRating = Number(formData.get('coachRating') ?? 0)
  const enteredMinute = Number(formData.get('enteredMinute') ?? 0)
  const exitedMinute = Number(formData.get('exitedMinute') ?? 0)
  const notes = String(formData.get('notes') ?? '').trim()

  if (!matchId || !playerId) {
    return { error: 'Lipsesc meciul sau jucătorul pentru această fișă.' }
  }

  const result = await saveCoachMatchStat({
    matchId,
    playerId,
    starter,
    minutesPlayed,
    goals,
    assists,
    yellowCards,
    redCards,
    coachRating,
    enteredMinute,
    exitedMinute,
    notes,
  })

  return result.ok ? { success: result.message } : { error: result.message }
}
