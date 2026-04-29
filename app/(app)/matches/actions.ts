'use server'

import { redirect } from 'next/navigation'
import { competitions } from '@/lib/catalogs'
import { getActionRedirectUrl } from '@/lib/flash'
import {
  createMatchForCurrentClub,
  deleteMatchForCurrentClub,
  updateMatchForCurrentClub,
} from '@/lib/matches'
import type { CompetitionName, Match } from '@/lib/types'

export interface MatchFormState {
  error?: string
  success?: string
}

export async function createMatchAction(
  _prevState: MatchFormState,
  formData: FormData
): Promise<MatchFormState> {
  const matchId = String(formData.get('matchId') ?? '').trim()
  const mode = String(formData.get('mode') ?? 'create').trim()
  const teamId = String(formData.get('teamId') ?? '').trim()
  const competition = String(formData.get('competition') ?? '').trim() as CompetitionName
  const round = String(formData.get('round') ?? '').trim()
  const opponent = String(formData.get('opponent') ?? '').trim()
  const venueType = String(formData.get('venueType') ?? '').trim() as Match['venueType']
  const date = String(formData.get('date') ?? '').trim()
  const hour = String(formData.get('hour') ?? '').trim()
  const location = String(formData.get('location') ?? '').trim()
  const notes = String(formData.get('notes') ?? '').trim()

  if (!teamId || !opponent || !date || !hour || !location) {
    return { error: 'Completează echipa, adversarul, data, ora și locația.' }
  }

  if (!competitions.includes(competition)) {
    return { error: 'Competiția selectată nu este validă.' }
  }

  if (venueType !== 'acasa' && venueType !== 'deplasare') {
    return { error: 'Tipul meciului trebuie să fie acasă sau deplasare.' }
  }

  const result =
    mode === 'edit' && matchId
      ? await updateMatchForCurrentClub({
          matchId,
          teamId,
          competition,
          round,
          opponent,
          venueType,
          date,
          hour,
          location,
          notes,
        })
      : await createMatchForCurrentClub({
          teamId,
          competition,
          round,
          opponent,
          venueType,
          date,
          hour,
          location,
          notes,
        })

  return result.ok ? { success: result.message } : { error: result.message }
}

export async function deleteMatchAction(formData: FormData) {
  const matchId = String(formData.get('matchId') ?? '').trim()

  if (!matchId) {
    return
  }

  const result = await deleteMatchForCurrentClub(matchId)
  redirect(
    getActionRedirectUrl({
      fallbackPath: '/matches',
      message: result.message,
      tone: result.ok ? 'success' : 'error',
      clearKeys: ['edit'],
    })
  )
}
