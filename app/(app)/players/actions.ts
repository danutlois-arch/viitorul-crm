'use server'

import { redirect } from 'next/navigation'
import { getActionRedirectUrl } from '@/lib/flash'
import {
  createPlayerForCurrentClub,
  deletePlayerForCurrentClub,
  updatePlayerForCurrentClub,
} from '@/lib/players'
import { uploadPlayerProfileImage } from '@/lib/storage'

export interface PlayerFormState {
  error?: string
  success?: string
}

const validPositions = new Set([
  'Portar',
  'Fundaș central',
  'Fundaș lateral',
  'Mijlocaș defensiv',
  'Mijlocaș central',
  'Mijlocaș ofensiv',
  'Extremă',
  'Atacant',
])

export async function createPlayerAction(
  _prevState: PlayerFormState,
  formData: FormData
): Promise<PlayerFormState> {
  const playerId = String(formData.get('playerId') ?? '').trim()
  const mode = String(formData.get('mode') ?? 'create').trim()
  const firstName = String(formData.get('firstName') ?? '').trim()
  const lastName = String(formData.get('lastName') ?? '').trim()
  const teamId = String(formData.get('teamId') ?? '').trim()
  const clubId = String(formData.get('clubId') ?? '').trim()
  const dateOfBirth = String(formData.get('dateOfBirth') ?? '').trim()
  const position = String(formData.get('position') ?? '').trim()
  const guardianName = String(formData.get('guardianName') ?? '').trim()
  const existingProfileImageUrl = String(formData.get('existingProfileImageUrl') ?? '').trim()
  const profileImageFile = formData.get('profileImageFile')

  if (!firstName || !lastName || !teamId || !dateOfBirth) {
    return { error: 'Completează prenumele, numele, echipa și data nașterii.' }
  }

  if (!validPositions.has(position)) {
    return { error: 'Poziția selectată nu este validă.' }
  }

  const birthDate = new Date(dateOfBirth)
  if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
    return { error: 'Data nașterii trebuie să fie validă.' }
  }

  let profileImageUrl = existingProfileImageUrl
  if (profileImageFile instanceof File && profileImageFile.size > 0) {
    const uploadResult = await uploadPlayerProfileImage({
      clubId: clubId || 'club',
      playerId: mode === 'edit' ? playerId : undefined,
      file: profileImageFile,
    })

    if (!uploadResult.ok) {
      return { error: uploadResult.message }
    }

    profileImageUrl = uploadResult.publicUrl
  }

  const result =
    mode === 'edit' && playerId
      ? await updatePlayerForCurrentClub({
          playerId,
          teamId,
          firstName,
          lastName,
          dateOfBirth,
          position,
          guardianName,
          profileImageUrl,
        })
      : await createPlayerForCurrentClub({
          teamId,
          firstName,
          lastName,
          dateOfBirth,
          position,
          guardianName,
          profileImageUrl,
        })

  return result.ok ? { success: result.message } : { error: result.message }
}

export async function deletePlayerAction(formData: FormData) {
  const playerId = String(formData.get('playerId') ?? '').trim()

  if (!playerId) {
    return
  }

  const result = await deletePlayerForCurrentClub(playerId)
  redirect(
    getActionRedirectUrl({
      fallbackPath: '/players',
      message: result.message,
      tone: result.ok ? 'success' : 'error',
      clearKeys: ['edit'],
    })
  )
}
