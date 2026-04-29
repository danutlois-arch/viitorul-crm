import { revalidatePath } from 'next/cache'
import { getAppViewer } from '@/lib/auth'
import { currentUser } from '@/lib/demo-data'
import { sendCurrentUserReminderDigest, sendReminderDigestToRecipient } from '@/lib/email-reminders'
import { isSupabaseConfigured } from '@/lib/env'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ReminderScheduleSettings } from '@/lib/types'

interface ScheduleRow {
  id: string
  user_id?: string
  club_id?: string
  active: boolean | null
  frequency: ReminderScheduleSettings['frequency']
  channel: ReminderScheduleSettings['channel']
  hour_local: number | null
  minute_local: number | null
  last_run_at: string | null
}

interface RunRow {
  id: string
  status: 'sent' | 'failed'
  trigger_type: 'manual' | 'scheduled'
  message: string | null
  created_at: string
}

function describeNextRun(schedule: ReminderScheduleSettings) {
  const time = `${String(schedule.hour).padStart(2, '0')}:${String(schedule.minute).padStart(2, '0')}`
  if (!schedule.active) {
    return 'Pauzat'
  }
  if (schedule.frequency === 'daily') {
    return `Zilnic la ${time}`
  }
  if (schedule.frequency === 'weekdays') {
    return `Luni-Vineri la ${time}`
  }
  return `Săptămânal la ${time}`
}

function defaultSchedule(): ReminderScheduleSettings {
  return {
    active: false,
    frequency: 'weekdays',
    hour: 9,
    minute: 0,
    channel: 'email',
    lastRunAt: null,
    nextRunLabel: 'Luni-Vineri la 09:00',
  }
}

export async function getCurrentUserReminderSchedule() {
  const viewer = await getAppViewer()

  if (!isSupabaseConfigured() || viewer.source === 'demo' || !viewer.user.id) {
    return defaultSchedule()
  }

  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('user_reminder_schedules')
    .select('id, active, frequency, channel, hour_local, minute_local, last_run_at')
    .eq('user_id', viewer.user.id)
    .maybeSingle()

  const row = data as ScheduleRow | null
  if (!row) {
    return defaultSchedule()
  }

  const schedule: ReminderScheduleSettings = {
    id: row.id,
    active: row.active ?? false,
    frequency: row.frequency,
    channel: row.channel,
    hour: row.hour_local ?? 9,
    minute: row.minute_local ?? 0,
    lastRunAt: row.last_run_at,
  }

  return {
    ...schedule,
    nextRunLabel: describeNextRun(schedule),
  }
}

export async function updateCurrentUserReminderSchedule(input: ReminderScheduleSettings) {
  const viewer = await getAppViewer()

  if (!isSupabaseConfigured() || viewer.source === 'demo' || !viewer.user.id) {
    return {
      ok: false,
      message: 'Conectează Supabase pentru a salva programarea reminder-elor recurente.',
    }
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('user_reminder_schedules').upsert({
    user_id: viewer.user.id,
    club_id: viewer.club.id,
    active: input.active,
    frequency: input.frequency,
    channel: input.channel,
    hour_local: input.hour,
    minute_local: input.minute,
  })

  if (error) {
    return { ok: false, message: 'Nu am putut salva programarea reminder-elor.' }
  }

  revalidatePath('/clubs')
  return { ok: true, message: 'Programarea reminder-elor a fost actualizată.' }
}

async function logReminderRun(input: {
  userId?: string
  clubId: string
  scheduleId?: string | null
  triggerType: 'manual' | 'scheduled'
  status: 'sent' | 'failed'
  message: string
}) {
  if (!isSupabaseConfigured() || !input.userId) {
    return
  }

  const supabase =
    process.env.SUPABASE_SERVICE_ROLE_KEY && input.triggerType === 'scheduled'
      ? createSupabaseAdminClient()
      : createSupabaseServerClient()
  await supabase.from('reminder_run_logs').insert({
    user_id: input.userId,
    club_id: input.clubId,
    schedule_id: input.scheduleId ?? null,
    trigger_type: input.triggerType,
    status: input.status,
    message: input.message,
  })
}

export async function runCurrentUserScheduledReminder(triggerType: 'manual' | 'scheduled' = 'manual') {
  const viewer = await getAppViewer()
  const schedule = await getCurrentUserReminderSchedule()

  if (!schedule.active && triggerType === 'scheduled') {
    return { ok: false, message: 'Programarea este dezactivată pentru acest utilizator.' }
  }

  const result = await sendCurrentUserReminderDigest()

  await logReminderRun({
    userId: viewer.user.id,
    clubId: viewer.club.id,
    scheduleId: schedule.id ?? null,
    triggerType,
    status: result.ok ? 'sent' : 'failed',
    message: result.message ?? 'Reminder rulat.',
  })

  if (result.ok && isSupabaseConfigured() && viewer.source !== 'demo' && viewer.user.id && schedule.id) {
    const supabase = createSupabaseServerClient()
    await supabase
      .from('user_reminder_schedules')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', schedule.id)
      .eq('user_id', viewer.user.id)
  }

  revalidatePath('/clubs')
  return result
}

export async function getRecentReminderRunsForCurrentClub(limit = 10) {
  const viewer = await getAppViewer()

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return [
      {
        id: 'demo-run-1',
        triggerType: 'manual',
        status: 'sent',
        message: 'Reminder demo trimis cu succes.',
        createdAt: new Date().toISOString(),
        userName: currentUser.fullName,
      },
    ]
  }

  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('reminder_run_logs')
    .select('id, trigger_type, status, message, created_at, profiles(full_name)')
    .eq('club_id', viewer.club.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (
    (data as
      | {
          id: string
          trigger_type: 'manual' | 'scheduled'
          status: 'sent' | 'failed'
          message: string | null
          created_at: string
          profiles?: { full_name: string }[] | null
        }[]
      | null) ?? []
  ).map((row) => ({
    id: row.id,
    triggerType: row.trigger_type,
    status: row.status,
    message: row.message ?? '',
    createdAt: row.created_at,
    userName: Array.isArray(row.profiles) ? row.profiles[0]?.full_name ?? '-' : '-',
  }))
}

export async function runDueReminderSchedules() {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, message: 'Conectează Supabase pentru rularea reminder-elor programate.' }
  }

  const supabase = createSupabaseAdminClient()
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const weekday = now.getDay()

  const { data } = await supabase
    .from('user_reminder_schedules')
    .select(
      `
        id,
        user_id,
        club_id,
        active,
        frequency,
        channel,
        hour_local,
        minute_local,
        last_run_at,
        profiles!user_reminder_schedules_user_id_fkey(full_name, email),
        clubs!user_reminder_schedules_club_id_fkey(name),
        user_notification_preferences(
          email_enabled,
          payment_reminders,
          match_reminders,
          suspension_reminders,
          attendance_reminders
        )
      `
    )
    .eq('active', true)
    .eq('channel', 'email')
    .eq('hour_local', hour)
    .eq('minute_local', minute)

  const schedules = ((data as (ScheduleRow & {
    profiles?: { full_name: string; email: string }[] | null
    clubs?: { name: string }[] | null
    user_notification_preferences?:
      | {
          email_enabled: boolean | null
          payment_reminders: boolean | null
          match_reminders: boolean | null
          suspension_reminders: boolean | null
          attendance_reminders: boolean | null
        }[]
      | null
  })[] | null) ?? []).filter((row) => {
    if (row.frequency === 'daily') return true
    if (row.frequency === 'weekdays') return weekday >= 1 && weekday <= 5
    return weekday === 1
  })

  let processed = 0
  let sent = 0
  let failed = 0

  for (const schedule of schedules) {
    const profile = Array.isArray(schedule.profiles) ? schedule.profiles[0] : null
    const club = Array.isArray(schedule.clubs) ? schedule.clubs[0] : null
    const preferences = Array.isArray(schedule.user_notification_preferences)
      ? schedule.user_notification_preferences[0]
      : null

    if (!schedule.user_id || !schedule.club_id || !profile?.email || !club?.name) {
      failed += 1
      await logReminderRun({
        userId: schedule.user_id,
        clubId: schedule.club_id ?? '',
        scheduleId: schedule.id,
        triggerType: 'scheduled',
        status: 'failed',
        message: 'Programarea nu are date suficiente pentru trimitere.',
      })
      continue
    }

    processed += 1
    const result = await sendReminderDigestToRecipient({
      clubId: schedule.club_id,
      userId: schedule.user_id,
      email: profile.email,
      fullName: profile.full_name,
      clubName: club.name,
      settings: {
        emailEnabled: preferences?.email_enabled ?? false,
        paymentReminders: preferences?.payment_reminders ?? true,
        matchReminders: preferences?.match_reminders ?? true,
        suspensionReminders: preferences?.suspension_reminders ?? true,
        attendanceReminders: preferences?.attendance_reminders ?? true,
      },
    })

    await logReminderRun({
      userId: schedule.user_id,
      clubId: schedule.club_id,
      scheduleId: schedule.id,
      triggerType: 'scheduled',
      status: result.ok ? 'sent' : 'failed',
      message: result.message ?? 'Reminder programat rulat.',
    })

    if (result.ok) {
      sent += 1
      await supabase
        .from('user_reminder_schedules')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', schedule.id)
        .eq('user_id', schedule.user_id)
    } else {
      failed += 1
    }
  }

  return {
    ok: true,
    message: `Programări evaluate: ${schedules.length}. Procesate: ${processed}. Trimise: ${sent}. Eșuate: ${failed}.`,
  }
}
