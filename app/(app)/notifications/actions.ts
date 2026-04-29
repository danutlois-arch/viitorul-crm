'use server'

import { redirect } from 'next/navigation'
import { getActionRedirectUrl } from '@/lib/flash'
import {
  markNotificationInboxItemAsRead,
  syncNotificationInboxForCurrentUser,
  updateCurrentUserNotificationSettings,
} from '@/lib/user-notifications'

export interface NotificationPreferencesFormState {
  error?: string
  success?: string
}

export async function updateNotificationPreferencesAction(
  _prevState: NotificationPreferencesFormState,
  formData: FormData
): Promise<NotificationPreferencesFormState> {
  const result = await updateCurrentUserNotificationSettings({
    emailEnabled: formData.get('emailEnabled') === 'on',
    paymentReminders: formData.get('paymentReminders') === 'on',
    matchReminders: formData.get('matchReminders') === 'on',
    suspensionReminders: formData.get('suspensionReminders') === 'on',
    attendanceReminders: formData.get('attendanceReminders') === 'on',
  })

  return result.ok ? { success: result.message } : { error: result.message }
}

export async function syncNotificationInboxAction() {
  const result = await syncNotificationInboxForCurrentUser()
  redirect(
    getActionRedirectUrl({
      fallbackPath: '/dashboard',
      message: result.message,
      tone: result.ok ? 'success' : 'error',
    })
  )
}

export async function markNotificationAsReadAction(formData: FormData) {
  const notificationId = String(formData.get('notificationId') ?? '').trim()

  if (!notificationId) {
    return
  }

  const result = await markNotificationInboxItemAsRead(notificationId)
  redirect(
    getActionRedirectUrl({
      fallbackPath: '/dashboard',
      message: result.message,
      tone: result.ok ? 'success' : 'error',
    })
  )
}
