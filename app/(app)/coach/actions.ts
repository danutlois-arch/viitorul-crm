'use server'

import {
  createCoachTrainingSession,
  saveCoachMatchSquad,
  saveCoachMatchSummary,
  saveCoachMatchStat,
  saveCoachTrainingRecord,
} from '@/lib/coach'

export interface CoachMatchStatFormState {
  error?: string
  success?: string
}

export interface CoachTrainingRecordFormState {
  error?: string
  success?: string
}

export interface CoachMatchdayFormState {
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

export async function saveCoachTrainingRecordAction(
  _prevState: CoachTrainingRecordFormState,
  formData: FormData
): Promise<CoachTrainingRecordFormState> {
  const sessionId = String(formData.get('sessionId') ?? '').trim()
  const playerId = String(formData.get('playerId') ?? '').trim()
  const status = String(formData.get('status') ?? 'prezent').trim() as
    | 'prezent'
    | 'absent_motivat'
    | 'absent_nemotivat'
    | 'accidentat'
  const coachRating = Number(formData.get('coachRating') ?? 0)
  const notes = String(formData.get('notes') ?? '').trim()

  if (!sessionId || !playerId) {
    return { error: 'Lipsesc sesiunea sau jucătorul pentru această fișă.' }
  }

  const result = await saveCoachTrainingRecord({
    sessionId,
    playerId,
    status,
    coachRating,
    notes,
  })

  return result.ok ? { success: result.message } : { error: result.message }
}

export async function saveCoachMatchSquadAction(
  _prevState: CoachMatchdayFormState,
  formData: FormData
): Promise<CoachMatchdayFormState> {
  const matchId = String(formData.get('matchId') ?? '').trim()
  const playerId = String(formData.get('playerId') ?? '').trim()
  const calledUp = String(formData.get('calledUp') ?? 'nu').trim() === 'da'
  const present = String(formData.get('present') ?? 'nu').trim() === 'da'
  const starter = String(formData.get('starter') ?? 'nu').trim() === 'da'
  const minutesPlayed = Number(formData.get('minutesPlayed') ?? 0)

  if (!matchId || !playerId) {
    return { error: 'Lipsesc meciul sau jucătorul pentru fișa jocului.' }
  }

  const result = await saveCoachMatchSquad({
    matchId,
    playerId,
    calledUp,
    present,
    starter,
    minutesPlayed,
  })

  return result.ok ? { success: result.message } : { error: result.message }
}

export async function saveCoachMatchSummaryAction(
  _prevState: CoachMatchdayFormState,
  formData: FormData
): Promise<CoachMatchdayFormState> {
  const matchId = String(formData.get('matchId') ?? '').trim()
  const teamScore = Number(formData.get('teamScore') ?? 0)
  const opponentScore = Number(formData.get('opponentScore') ?? 0)
  const status = String(formData.get('status') ?? 'programat').trim() as
    | 'programat'
    | 'jucat'
    | 'amanat'
    | 'anulat'
  const notes = String(formData.get('notes') ?? '').trim()

  if (!matchId) {
    return { error: 'Lipsește meciul pentru rezumat.' }
  }

  const result = await saveCoachMatchSummary({
    matchId,
    teamScore,
    opponentScore,
    status,
    notes,
  })

  return result.ok ? { success: result.message } : { error: result.message }
}

export async function createCoachTrainingSessionAction(
  _prevState: CoachTrainingRecordFormState,
  formData: FormData
): Promise<CoachTrainingRecordFormState> {
  const date = String(formData.get('date') ?? '').trim()
  const hour = String(formData.get('hour') ?? '').trim()
  const location = String(formData.get('location') ?? '').trim()
  const type = String(formData.get('type') ?? 'antrenament').trim() as
    | 'antrenament'
    | 'recuperare'
    | 'sedinta_video'
    | 'sala'

  if (!date || !hour || !location) {
    return { error: 'Completează data, ora și locația pentru sesiunea de antrenament.' }
  }

  const result = await createCoachTrainingSession({
    date,
    hour,
    location,
    type,
  })

  return result.ok ? { success: result.message } : { error: result.message }
}
