'use server'

import { redirect } from 'next/navigation'
import { getActionRedirectUrl } from '@/lib/flash'
import { sendCurrentUserReminderDigest } from '@/lib/email-reminders'

export async function sendReminderDigestEmailAction() {
  const result = await sendCurrentUserReminderDigest()
  const message = result.message ?? (result.ok ? 'Email trimis.' : 'Nu am putut trimite emailul.')
  redirect(
    getActionRedirectUrl({
      fallbackPath: '/clubs',
      message,
      tone: result.ok ? 'success' : 'error',
    })
  )
}
