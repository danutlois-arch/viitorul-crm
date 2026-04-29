'use server'

import { redirect } from 'next/navigation'
import { competitions, teamCategories } from '@/lib/catalogs'
import { getActionRedirectUrl } from '@/lib/flash'
import {
  createTeamForCurrentClub,
  deleteTeamForCurrentClub,
  updateTeamForCurrentClub,
} from '@/lib/teams'

export interface TeamFormState {
  error?: string
  success?: string
}

export async function createTeamAction(
  _prevState: TeamFormState,
  formData: FormData
): Promise<TeamFormState> {
  const teamId = String(formData.get('teamId') ?? '').trim()
  const mode = String(formData.get('mode') ?? 'create').trim()
  const name = String(formData.get('name') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const competition = String(formData.get('competition') ?? '').trim()
  const season = String(formData.get('season') ?? '').trim()
  const headCoach = String(formData.get('headCoach') ?? '').trim()
  const assistantCoach = String(formData.get('assistantCoach') ?? '').trim()
  const teamManager = String(formData.get('teamManager') ?? '').trim()

  if (!name || !season) {
    return { error: 'Completează numele echipei și sezonul.' }
  }

  if (!teamCategories.includes(category as (typeof teamCategories)[number])) {
    return { error: 'Categoria selectată nu este validă.' }
  }

  if (!competitions.includes(competition as (typeof competitions)[number])) {
    return { error: 'Competiția selectată nu este validă.' }
  }

  const result =
    mode === 'edit' && teamId
      ? await updateTeamForCurrentClub({
          teamId,
          name,
          category: category as (typeof teamCategories)[number],
          competition: competition as (typeof competitions)[number],
          season,
          headCoach,
          assistantCoach,
          teamManager,
        })
      : await createTeamForCurrentClub({
          name,
          category: category as (typeof teamCategories)[number],
          competition: competition as (typeof competitions)[number],
          season,
          headCoach,
          assistantCoach,
          teamManager,
        })

  return result.ok ? { success: result.message } : { error: result.message }
}

export async function deleteTeamAction(formData: FormData) {
  const teamId = String(formData.get('teamId') ?? '').trim()

  if (!teamId) {
    return
  }

  const result = await deleteTeamForCurrentClub(teamId)
  redirect(
    getActionRedirectUrl({
      fallbackPath: '/teams',
      message: result.message,
      tone: result.ok ? 'success' : 'error',
      clearKeys: ['edit'],
    })
  )
}
