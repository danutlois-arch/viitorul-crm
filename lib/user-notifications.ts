import { revalidatePath } from 'next/cache'
import { getAppViewer } from '@/lib/auth'
import { currentUser } from '@/lib/demo-data'
import { isSupabaseConfigured } from '@/lib/env'
import { getNotificationsForCurrentClub } from '@/lib/notifications'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { NotificationInboxItem, NotificationPreferenceSettings } from '@/lib/types'

const defaultSettings: NotificationPreferenceSettings = {
  emailEnabled: false,
  paymentReminders: true,
  matchReminders: true,
  suspensionReminders: true,
  attendanceReminders: true,
}

export type NotificationSettingsWithUserContext = NotificationPreferenceSettings

interface PreferenceRow {
  email_enabled: boolean | null
  payment_reminders: boolean | null
  match_reminders: boolean | null
  suspension_reminders: boolean | null
  attendance_reminders: boolean | null
}

interface InboxRow {
  id: string
  notification_key: string
  title: string
  description: string | null
  tone: NotificationInboxItem['tone']
  href: string | null
  category: string
  is_read: boolean | null
  created_at: string
}

function mapPreferenceRow(row?: PreferenceRow | null): NotificationPreferenceSettings {
  return {
    emailEnabled: row?.email_enabled ?? defaultSettings.emailEnabled,
    paymentReminders: row?.payment_reminders ?? defaultSettings.paymentReminders,
    matchReminders: row?.match_reminders ?? defaultSettings.matchReminders,
    suspensionReminders: row?.suspension_reminders ?? defaultSettings.suspensionReminders,
    attendanceReminders: row?.attendance_reminders ?? defaultSettings.attendanceReminders,
  }
}

function mapInboxRow(row: InboxRow): NotificationInboxItem {
  return {
    id: row.id,
    notificationKey: row.notification_key,
    title: row.title,
    description: row.description ?? '',
    tone: row.tone,
    href: row.href ?? '/dashboard',
    category: row.category,
    isRead: row.is_read ?? false,
    createdAt: row.created_at,
  }
}

async function getCurrentUserContext() {
  const viewer = await getAppViewer()

  if (!isSupabaseConfigured() || viewer.source === 'demo' || !viewer.user.id) {
    return { viewer, userId: currentUser.id, source: 'demo' as const }
  }

  return { viewer, userId: viewer.user.id, source: 'supabase' as const }
}

export async function getCurrentUserNotificationSettings() {
  const context = await getCurrentUserContext()

  if (context.source === 'demo') {
    return defaultSettings
  }

  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('user_notification_preferences')
    .select(
      'email_enabled, payment_reminders, match_reminders, suspension_reminders, attendance_reminders'
    )
    .eq('user_id', context.userId)
    .maybeSingle()

  return mapPreferenceRow(data as PreferenceRow | null)
}

export async function updateCurrentUserNotificationSettings(input: NotificationPreferenceSettings) {
  const context = await getCurrentUserContext()

  if (context.source === 'demo') {
    return {
      ok: false,
      message: 'Conectează Supabase pentru a salva preferințele de notificare pe utilizator.',
    }
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('user_notification_preferences').upsert({
    user_id: context.userId,
    email_enabled: input.emailEnabled,
    payment_reminders: input.paymentReminders,
    match_reminders: input.matchReminders,
    suspension_reminders: input.suspensionReminders,
    attendance_reminders: input.attendanceReminders,
  })

  if (error) {
    return { ok: false, message: 'Nu am putut salva preferințele de notificare.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/clubs')
  revalidatePath('/reports')
  return { ok: true, message: 'Preferințele de notificare au fost salvate.' }
}

export async function getNotificationInboxForCurrentUser(limit = 8) {
  const context = await getCurrentUserContext()

  if (context.source === 'demo') {
    const notifications = await getNotificationsForCurrentClub()
    return notifications.items.slice(0, limit).map((item, index) => ({
      id: `demo-inbox-${index + 1}`,
      notificationKey: item.id,
      title: item.title,
      description: item.description,
      tone: item.tone,
      href: item.href,
      category: item.category,
      isRead: false,
      createdAt: new Date().toISOString(),
    }))
  }

  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('notification_inbox')
    .select('id, notification_key, title, description, tone, href, category, is_read, created_at')
    .eq('user_id', context.userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return ((data as InboxRow[] | null) ?? []).map(mapInboxRow)
}

export async function syncNotificationInboxForCurrentUser() {
  const context = await getCurrentUserContext()

  if (context.source === 'demo') {
    return {
      ok: false,
      message: 'Conectează Supabase pentru a sincroniza inbox-ul de notificări în contul utilizatorului.',
    }
  }

  const settings = await getCurrentUserNotificationSettings()
  const notifications = await getNotificationsForCurrentClub(settings)

  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('notification_inbox').upsert(
    notifications.items.map((item) => ({
      user_id: context.userId,
      club_id: context.viewer.club.id,
      notification_key: item.id,
      title: item.title,
      description: item.description,
      tone: item.tone,
      href: item.href,
      category: item.category,
      is_read: false,
    })),
    {
      onConflict: 'user_id,notification_key',
      ignoreDuplicates: false,
    }
  )

  if (error) {
    return { ok: false, message: 'Nu am putut sincroniza inbox-ul de notificări.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/clubs')
  revalidatePath('/reports')
  return { ok: true, message: 'Inbox-ul de notificări a fost sincronizat.' }
}

export async function markNotificationInboxItemAsRead(notificationId: string) {
  const context = await getCurrentUserContext()

  if (context.source === 'demo') {
    return { ok: false, message: 'Conectează Supabase pentru a salva statusul notificărilor.' }
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('notification_inbox')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', context.userId)

  if (error) {
    return { ok: false, message: 'Nu am putut marca notificarea ca citită.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/clubs')
  return { ok: true, message: 'Notificarea a fost marcată ca citită.' }
}
