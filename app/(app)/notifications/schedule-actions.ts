'use server'

import { redirect } from 'next/navigation'
import { getActionRedirectUrl } from '@/lib/flash'
import {
  runCurrentUserScheduledReminder,
  updateCurrentUserReminderSchedule,
} from '@/lib/scheduled-reminders'
import type { ReminderScheduleSettings } from '@/lib/types'

export interface ReminderScheduleFormState {
  error?: string
  success?: string
}

const allowedFrequencies: ReminderScheduleSettings['frequency'][] = ['daily', 'weekdays', 'weekly']

export async function updateReminderScheduleAction(
  _prevState: ReminderScheduleFormState,
  formData: FormData
): Promise<ReminderScheduleFormState> {
  const frequency = String(formData.get('frequency') ?? 'weekdays') as ReminderScheduleSettings['frequency']
  const hour = Number(formData.get('hour') ?? 9)
  const minute = Number(formData.get('minute') ?? 0)

  if (!allowedFrequencies.includes(frequency)) {
    return { error: 'Frecvența selectată nu este validă.' }
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { error: 'Ora de rulare nu este validă.' }
  }

  const result = await updateCurrentUserReminderSchedule({
    active: formData.get('active') === 'on',
    frequency,
    hour,
    minute,
    channel: 'email',
  })

  return result.ok ? { success: result.message } : { error: result.message }
}

export async function runReminderNowAction() {
  const result = await runCurrentUserScheduledReminder('manual')
  redirect(
    getActionRedirectUrl({
      fallbackPath: '/clubs',
      message: result.message ?? (result.ok ? 'Reminder rulat.' : 'Nu am putut rula reminder-ul.'),
      tone: result.ok ? 'success' : 'error',
    })
  )
}
