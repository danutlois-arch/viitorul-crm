import { getDashboardData } from '@/lib/dashboard'
import { getPaymentsForCurrentClub } from '@/lib/payments'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSuspensionDashboardForCurrentClub } from '@/lib/suspensions'
import { formatCurrency } from '@/lib/utils'
import type { NotificationPreferenceSettings } from '@/lib/types'

type NotificationTone = 'danger' | 'warning' | 'info' | 'success'

export interface NotificationEntry {
  id: string
  title: string
  description: string
  tone: NotificationTone
  href: string
  cta: string
  category: 'payments' | 'contributions' | 'matches' | 'suspensions' | 'attendance' | 'general'
}

interface NotificationContext {
  outstandingPayments: number
  debtors: number
  pendingContributions: number
  upcomingMatch:
    | {
        opponent: string
        competition: string
        date: string
      }
    | undefined
  activeSuspensions: number
  remainingSuspensionRounds: number
  averageAttendance: number
}

function startOfToday() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

function differenceInDays(targetDate: string) {
  const today = startOfToday()
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export async function getNotificationsForCurrentClub(
  settings: NotificationPreferenceSettings = {
    emailEnabled: false,
    paymentReminders: true,
    matchReminders: true,
    suspensionReminders: true,
    attendanceReminders: true,
  }
) {
  const dashboard = await getDashboardData()
  const paymentData = await getPaymentsForCurrentClub()
  const suspensions = await getSuspensionDashboardForCurrentClub()

  return buildNotificationsFromContext(
    {
      outstandingPayments: paymentData.summary.totalOutstanding,
      debtors: paymentData.summary.debtors,
      pendingContributions: paymentData.summary.pendingContributions,
      upcomingMatch: dashboard.upcomingMatches[0]
        ? {
            opponent: dashboard.upcomingMatches[0].opponent,
            competition: dashboard.upcomingMatches[0].competition,
            date: dashboard.upcomingMatches[0].date,
          }
        : undefined,
      activeSuspensions: suspensions.summary.activeCount,
      remainingSuspensionRounds: suspensions.summary.totalRemainingRounds,
      averageAttendance: dashboard.summary.averageAttendance,
    },
    settings
  )
}

function buildNotificationsFromContext(
  context: NotificationContext,
  settings: NotificationPreferenceSettings
) {
  const notifications: NotificationEntry[] = []

  if (context.outstandingPayments > 0) {
    notifications.push({
      id: 'payments-outstanding',
      title: 'Există taxe restante în club',
      description: `${context.debtors} jucători au sold deschis, iar totalul restant este ${formatCurrency(context.outstandingPayments)}.`,
      tone: 'danger',
      href: '/payments?status=restant',
      cta: 'Vezi taxele restante',
      category: 'payments',
    })
  }

  if (settings.paymentReminders && context.pendingContributions > 0) {
    notifications.push({
      id: 'contributions-pending',
      title: 'Contribuții externe în așteptare',
      description: `${context.pendingContributions} donații sau sponsorizări online așteaptă confirmare sau follow-up.`,
      tone: 'warning',
      href: '/payments?view=contributions',
      cta: 'Verifică contribuțiile',
      category: 'contributions',
    })
  }

  const nextMatch = context.upcomingMatch
  if (nextMatch) {
    const daysUntilMatch = differenceInDays(nextMatch.date)
    if (settings.matchReminders && daysUntilMatch <= 7) {
      notifications.push({
        id: 'next-match',
        title: daysUntilMatch <= 1 ? 'Meci foarte apropiat' : 'Urmează un meci important',
        description: `${nextMatch.opponent} · ${nextMatch.competition} · ${new Date(nextMatch.date).toLocaleDateString('ro-RO')}.`,
        tone: daysUntilMatch <= 1 ? 'danger' : 'info',
        href: '/matches',
        cta: 'Deschide calendarul',
        category: 'matches',
      })
    }
  }

  if (settings.suspensionReminders && context.activeSuspensions > 0) {
    notifications.push({
      id: 'active-suspensions',
      title: 'Jucători indisponibili din suspendări',
      description: `${context.activeSuspensions} suspendări active și ${context.remainingSuspensionRounds} etape rămase de executat.`,
      tone: 'warning',
      href: '/suspensions',
      cta: 'Vezi registrul disciplinar',
      category: 'suspensions',
    })
  }

  if (settings.attendanceReminders && context.averageAttendance < 75) {
    notifications.push({
      id: 'attendance-drop',
      title: 'Prezența medie este sub pragul dorit',
      description: `Prezența actuală este ${context.averageAttendance}%. Merită verificată participarea pe echipe și grupe.`,
      tone: 'warning',
      href: '/attendance',
      cta: 'Analizează prezența',
      category: 'attendance',
    })
  }

  if (!notifications.length) {
    notifications.push({
      id: 'all-clear',
      title: 'Situația clubului este stabilă',
      description: 'Nu există alerte critice în acest moment. Poți continua monitorizarea normală din dashboard.',
      tone: 'success',
      href: '/dashboard',
      cta: 'Rămâi în dashboard',
      category: 'general',
    })
  }

  return {
    items: notifications,
    criticalCount: notifications.filter((item) => item.tone === 'danger').length,
    totalCount: notifications.filter((item) => item.tone !== 'success').length,
  }
}

export async function getNotificationsForClubWithAdmin(input: {
  clubId: string
  settings: NotificationPreferenceSettings
}) {
  const supabase = createSupabaseAdminClient()

  const [
    { data: paymentRows },
    { data: contributionRows },
    { data: matchRows },
    { data: suspensionRows },
    { data: attendanceRows },
  ] = await Promise.all([
    supabase
      .from('payments')
      .select('due_amount, paid_amount, status')
      .eq('club_id', input.clubId),
    supabase
      .from('funding_contributions')
      .select('status')
      .eq('club_id', input.clubId),
    supabase
      .from('matches')
      .select('opponent, match_date, status, competitions(label)')
      .eq('club_id', input.clubId)
      .eq('status', 'programat')
      .order('match_date', { ascending: true })
      .limit(1),
    supabase
      .from('suspensions')
      .select('remaining_rounds, status')
      .eq('club_id', input.clubId),
    supabase
      .from('attendance_sessions')
      .select('id, attendance_records(status)')
      .eq('club_id', input.clubId),
  ])

  const payments = (paymentRows ?? []) as { due_amount: number | null; paid_amount: number | null; status: string }[]
  const contributions = (contributionRows ?? []) as { status: string }[]
  const matches = (matchRows ?? []) as {
    opponent: string
    match_date: string
    competitions?: { label: string }[] | null
  }[]
  const suspensions = (suspensionRows ?? []) as { remaining_rounds: number | null; status: string }[]
  const attendance = (attendanceRows ?? []) as {
    id: string
    attendance_records?: { status: string }[]
  }[]

  const attendanceRates = attendance.map((session) => {
    const records = session.attendance_records ?? []
    if (!records.length) {
      return 0
    }
    const present = records.filter((record) => record.status === 'prezent').length
    return Math.round((present / records.length) * 100)
  })

  const context: NotificationContext = {
    outstandingPayments: payments.reduce(
      (total, item) => total + Math.max((item.due_amount ?? 0) - (item.paid_amount ?? 0), 0),
      0
    ),
    debtors: payments.filter((item) => item.status === 'partial' || item.status === 'restant').length,
    pendingContributions: contributions.filter((item) => item.status === 'pending' || item.status === 'draft').length,
    upcomingMatch: matches[0]
      ? {
          opponent: matches[0].opponent,
          competition: matches[0].competitions?.[0]?.label ?? 'Competiție',
          date: matches[0].match_date,
        }
      : undefined,
    activeSuspensions: suspensions.filter((item) => item.status === 'activa').length,
    remainingSuspensionRounds: suspensions.reduce((sum, item) => sum + (item.remaining_rounds ?? 0), 0),
    averageAttendance: attendanceRates.length
      ? Math.round(attendanceRates.reduce((sum, item) => sum + item, 0) / attendanceRates.length)
      : 0,
  }

  return buildNotificationsFromContext(context, input.settings)
}
