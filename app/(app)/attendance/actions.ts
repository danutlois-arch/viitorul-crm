'use server'

import { redirect } from 'next/navigation'
import {
  createAttendanceSessionForCurrentClub,
  deleteAttendanceSessionForCurrentClub,
  updateAttendanceSessionForCurrentClub,
} from '@/lib/attendance'
import { getActionRedirectUrl } from '@/lib/flash'
import type { AttendanceSession } from '@/lib/types'

export interface AttendanceFormState {
  error?: string
  success?: string
}

const validTypes: AttendanceSession['type'][] = [
  'antrenament',
  'recuperare',
  'sedinta_video',
  'sala',
]

export async function createAttendanceAction(
  _prevState: AttendanceFormState,
  formData: FormData
): Promise<AttendanceFormState> {
  const sessionId = String(formData.get('sessionId') ?? '').trim()
  const mode = String(formData.get('mode') ?? 'create').trim()
  const teamId = String(formData.get('teamId') ?? '').trim()
  const type = String(formData.get('type') ?? '').trim() as AttendanceSession['type']
  const date = String(formData.get('date') ?? '').trim()
  const hour = String(formData.get('hour') ?? '').trim()
  const location = String(formData.get('location') ?? '').trim()

  if (!teamId || !date || !hour || !location) {
    return { error: 'Completează echipa, data, ora și locația.' }
  }

  if (!validTypes.includes(type)) {
    return { error: 'Tipul sesiunii nu este valid.' }
  }

  const result =
    mode === 'edit' && sessionId
      ? await updateAttendanceSessionForCurrentClub({
          sessionId,
          teamId,
          type,
          date,
          hour,
          location,
        })
      : await createAttendanceSessionForCurrentClub({
          teamId,
          type,
          date,
          hour,
          location,
        })

  return result.ok ? { success: result.message } : { error: result.message }
}

export async function deleteAttendanceAction(formData: FormData) {
  const sessionId = String(formData.get('sessionId') ?? '').trim()

  if (!sessionId) {
    return
  }

  const result = await deleteAttendanceSessionForCurrentClub(sessionId)
  redirect(
    getActionRedirectUrl({
      fallbackPath: '/attendance',
      message: result.message,
      tone: result.ok ? 'success' : 'error',
      clearKeys: ['edit'],
    })
  )
}
