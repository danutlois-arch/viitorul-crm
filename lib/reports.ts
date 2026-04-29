import { getAttendanceForCurrentClub } from '@/lib/attendance'
import { getDashboardData } from '@/lib/dashboard'
import { getMatchesForCurrentClub } from '@/lib/matches'
import { getPaymentsForCurrentClub } from '@/lib/payments'
import { getPlayersForCurrentClub } from '@/lib/players'
import { getNotificationsForCurrentClub } from '@/lib/notifications'
import { getStatisticsForCurrentClub } from '@/lib/statistics'
import { getSuspensionDashboardForCurrentClub } from '@/lib/suspensions'
import { getTeamsForCurrentClubLive } from '@/lib/teams'

export async function getReportsData() {
  const [
    dashboard,
    statistics,
    paymentData,
    attendance,
    teams,
    playerData,
    matches,
    suspensions,
    notifications,
  ] = await Promise.all([
    getDashboardData(),
    getStatisticsForCurrentClub(),
    getPaymentsForCurrentClub(),
    getAttendanceForCurrentClub(),
    getTeamsForCurrentClubLive(),
    getPlayersForCurrentClub(),
    getMatchesForCurrentClub(),
    getSuspensionDashboardForCurrentClub(),
    getNotificationsForCurrentClub(),
  ])

  const players = playerData.players

  const summaryCards = [
    {
      title: 'Raport jucători',
      value: String(players.length),
      description: 'loturi active și fișe individuale',
    },
    {
      title: 'Raport financiar',
      value: String(paymentData.summary.debtors),
      description: 'jucători cu sold restant sau parțial',
    },
    {
      title: 'Raport prezență',
      value: `${dashboard.summary.averageAttendance}%`,
      description: 'prezență medie pe sesiunile urmărite',
    },
    {
      title: 'Raport statistici',
      value: String(statistics.totals.totalGoals),
      description: 'goluri totale înregistrate în sezon',
    },
  ]

  const reportCatalog = [
    {
      id: 'report-players',
      title: 'Raport jucător',
      subtitle: 'Fișă individuală, status, contact și lot.',
      metric: `${players.length} jucători`,
    },
    {
      id: 'report-team',
      title: 'Raport echipă',
      subtitle: 'Structură club, categorii și competiții.',
      metric: `${teams.length} echipe`,
    },
    {
      id: 'report-attendance',
      title: 'Raport prezență',
      subtitle: 'Sesiuni, procent mediu și consistență.',
      metric: `${attendance.length} sesiuni`,
    },
    {
      id: 'report-payments',
      title: 'Raport taxe',
      subtitle: 'Încasări, restanțe și contribuții externe.',
      metric: `${paymentData.rows.length} plăți`,
    },
    {
      id: 'report-season',
      title: 'Raport statistici sezon',
      subtitle: 'Goluri, assisturi, minute și disciplină.',
      metric: `${statistics.rows.length} jucători analizați`,
    },
  ]

  const playerExportRows = players.map((player) => ({
    name: `${player.firstName} ${player.lastName}`,
    team:
      teams.find((team) => team.id === player.teamId)?.name ?? '-',
    position: player.position,
    status: player.status,
    goals: player.goals,
    assists: player.assists,
    minutesPlayed: player.minutesPlayed,
  }))

  const attendanceExportRows = attendance.map((session) => ({
    team: teams.find((team) => team.id === session.teamId)?.name ?? '-',
    date: session.date,
    hour: session.hour,
    location: session.location,
    type: session.type,
    attendanceRate: `${session.attendanceRate}%`,
  }))

  const paymentExportRows = paymentData.rows.map((row) => ({
    player: row.playerName,
    month: row.month,
    year: row.year,
    dueAmount: row.dueAmount,
    paidAmount: row.paidAmount,
    status: row.status,
    method: row.method,
  }))

  const contributionExportRows = paymentData.contributionRows.map((row) => ({
    contributor: row.contributorName,
    company: row.sponsorCompany,
    type: row.type,
    amount: row.amount,
    status: row.status,
    provider: row.provider,
    source: row.source,
  }))

  const seasonSummaryRows = [
    { indicator: 'Jucători activi', value: players.length },
    { indicator: 'Echipe active', value: teams.length },
    { indicator: 'Goluri înregistrate', value: statistics.totals.totalGoals },
    { indicator: 'Assisturi înregistrate', value: statistics.totals.totalAssists },
    { indicator: 'Minute jucate', value: statistics.totals.totalMinutes },
    { indicator: 'Prezență medie', value: `${dashboard.summary.averageAttendance}%` },
    { indicator: 'Restanțieri', value: paymentData.summary.debtors },
    { indicator: 'Total restant', value: paymentData.summary.totalOutstanding },
  ]

  const topScorers = statistics.rows.slice(0, 5)
  const topAssists = [...statistics.rows]
    .sort((left, right) => right.assists - left.assists)
    .slice(0, 5)

  return {
    summaryCards,
    reportCatalog,
    playerExportRows,
    attendanceExportRows,
    paymentExportRows,
    contributionExportRows,
    seasonSummaryRows,
    topScorers,
    topAssists,
    recentMatches: matches.slice(0, 5),
    suspensions: suspensions.rows.slice(0, 5),
    notifications: notifications.items,
  }
}
