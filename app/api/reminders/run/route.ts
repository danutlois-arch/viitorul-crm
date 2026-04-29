import { NextResponse } from 'next/server'
import { runDueReminderSchedules } from '@/lib/scheduled-reminders'

export async function POST(request: Request) {
  const expectedToken = process.env.REMINDERS_CRON_SECRET

  if (!expectedToken) {
    return NextResponse.json(
      { ok: false, message: 'REMINDERS_CRON_SECRET nu este configurat.' },
      { status: 500 }
    )
  }

  const providedToken =
    request.headers.get('x-cron-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (providedToken !== expectedToken) {
    return NextResponse.json({ ok: false, message: 'Neautorizat.' }, { status: 401 })
  }

  const result = await runDueReminderSchedules()
  return NextResponse.json(result)
}
