import { getAppViewer } from '@/lib/auth'
import { currentUser } from '@/lib/demo-data'
import { isEmailConfigured, sendTransactionalEmail } from '@/lib/email'
import { isSupabaseConfigured } from '@/lib/env'
import { getNotificationsForClubWithAdmin, getNotificationsForCurrentClub } from '@/lib/notifications'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUserNotificationSettings, type NotificationSettingsWithUserContext } from '@/lib/user-notifications'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildReminderEmailHtml(input: {
  clubName: string
  fullName: string
  items: Awaited<ReturnType<typeof getNotificationsForCurrentClub>>['items']
}) {
  const rows = input.items
    .map(
      (item) => `
        <tr>
          <td style="padding:16px;border-bottom:1px solid #e2e8f0;">
            <div style="font-size:14px;font-weight:700;color:#0f172a;">${escapeHtml(item.title)}</div>
            <div style="margin-top:6px;font-size:14px;line-height:1.5;color:#475569;">${escapeHtml(item.description)}</div>
            <div style="margin-top:10px;font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(item.category)}</div>
          </td>
        </tr>
      `
    )
    .join('')

  return `
    <div style="background:#f8fafc;padding:32px;font-family:Arial,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #dbeafe;">
        <tr>
          <td>
            <div style="font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.18em;">CRM Club</div>
            <h1 style="margin:12px 0 0;font-size:30px;line-height:1.2;">Rezumat alerte pentru ${escapeHtml(input.clubName)}</h1>
            <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#475569;">
              Salut, ${escapeHtml(input.fullName)}. Mai jos ai alertele importante generate de platformă pentru perioada imediată.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-top:24px;">
            <table role="presentation" width="100%" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
              ${rows}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-top:24px;">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
              Email generat din aplicația FC Viitorul Onești CRM. Pentru acțiuni detaliate, revino în dashboard.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `
}

function buildReminderEmailText(input: {
  clubName: string
  fullName: string
  items: Awaited<ReturnType<typeof getNotificationsForCurrentClub>>['items']
}) {
  return [
    `Rezumat alerte pentru ${input.clubName}`,
    `Salut, ${input.fullName}.`,
    '',
    ...input.items.map((item) => `- ${item.title}: ${item.description}`),
    '',
    'Deschide dashboard-ul pentru detalii și acțiuni.',
  ].join('\n')
}

async function logEmailDispatch(input: {
  clubId?: string
  userId?: string | null
  email: string
  subject: string
  status: 'sent' | 'failed'
  provider: string
  providerMessageId?: string
  errorMessage?: string
}) {
  if (!isSupabaseConfigured()) {
    return
  }

  const supabase =
    input.clubId && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createSupabaseAdminClient()
      : createSupabaseServerClient()

  const viewer = !input.clubId ? await getAppViewer() : null
  const clubId = input.clubId ?? viewer?.club.id
  const userId = input.userId ?? viewer?.user.id ?? null

  if (!clubId) {
    return
  }

  await supabase.from('email_dispatches').insert({
    club_id: clubId,
    user_id: userId,
    recipient_email: input.email,
    subject: input.subject,
    provider: input.provider,
    provider_message_id: input.providerMessageId ?? null,
    status: input.status,
    error_message: input.errorMessage ?? null,
  })
}

export async function getRecentEmailDispatchesForCurrentClub(limit = 8) {
  const viewer = await getAppViewer()

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return [
      {
        id: 'demo-email-1',
        recipientEmail: viewer.user.email ?? 'demo@club.ro',
        subject: `Alerte CRM ${viewer.club.name}`,
        provider: 'resend',
        status: 'sent',
        errorMessage: '',
        createdAt: new Date().toISOString(),
        actorName: currentUser.fullName,
      },
    ]
  }

  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('email_dispatches')
    .select(
      'id, recipient_email, subject, provider, status, error_message, created_at, profiles(full_name)'
    )
    .eq('club_id', viewer.club.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (
    (data as
      | {
          id: string
          recipient_email: string
          subject: string
          provider: string
          status: 'sent' | 'failed'
          error_message: string | null
          created_at: string
          profiles?: { full_name: string }[] | null
        }[]
      | null) ?? []
  ).map((row) => ({
    id: row.id,
    recipientEmail: row.recipient_email,
    subject: row.subject,
    provider: row.provider,
    status: row.status,
    errorMessage: row.error_message ?? '',
    createdAt: row.created_at,
    actorName: Array.isArray(row.profiles) ? row.profiles[0]?.full_name ?? '-' : '-',
  }))
}

export async function sendReminderDigestToRecipient(input: {
  clubId: string
  userId: string
  email: string
  fullName: string
  clubName: string
  settings: NotificationSettingsWithUserContext
}) {
  if (!input.settings.emailEnabled) {
    return {
      ok: false,
      message: 'Preferința de email este dezactivată pentru acest utilizator.',
    }
  }

  if (!isEmailConfigured()) {
    return {
      ok: false,
      message: 'Configurează RESEND_API_KEY și EMAIL_FROM pentru reminder-ele pe email.',
    }
  }

  const notifications = await getNotificationsForClubWithAdmin({
    clubId: input.clubId,
    settings: input.settings,
  })
  const subject = `Alerte CRM ${input.clubName}`

  const result = await sendTransactionalEmail({
    to: input.email,
    subject,
    html: buildReminderEmailHtml({
      clubName: input.clubName,
      fullName: input.fullName,
      items: notifications.items,
    }),
    text: buildReminderEmailText({
      clubName: input.clubName,
      fullName: input.fullName,
      items: notifications.items,
    }),
  })

  if (!result.ok) {
    await logEmailDispatch({
      clubId: input.clubId,
      userId: input.userId,
      email: input.email,
      subject,
      provider: 'resend',
      status: 'failed',
      errorMessage: result.message,
    })
    return { ok: false, message: result.message }
  }

  await logEmailDispatch({
    clubId: input.clubId,
    userId: input.userId,
    email: input.email,
    subject,
    provider: 'resend',
    status: 'sent',
    providerMessageId: result.messageId,
  })

  return {
    ok: true,
    message: `Reminder-ul a fost trimis către ${input.email}.`,
  }
}

export async function sendCurrentUserReminderDigest() {
  const viewer = await getAppViewer()
  const settings = await getCurrentUserNotificationSettings()

  if (!viewer.user.email) {
    return { ok: false, message: 'Utilizatorul curent nu are email disponibil în profil.' }
  }

  if (!settings.emailEnabled) {
    return {
      ok: false,
      message: 'Activează mai întâi opțiunea de email din preferințele personale.',
    }
  }

  return sendReminderDigestToRecipient({
    clubId: viewer.club.id,
    userId: viewer.user.id ?? '',
    email: viewer.user.email,
    fullName: viewer.user.fullName,
    clubName: viewer.club.name,
    settings,
  })
}
