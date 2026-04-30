import {
  contributions as demoContributions,
  matches as demoMatches,
  players as demoPlayers,
  teams as demoTeams,
} from '@/lib/demo-data'
import { getAttendanceForCurrentClub } from '@/lib/attendance'
import { getMatchesForCurrentClub } from '@/lib/matches'
import { getPaymentsForCurrentClub } from '@/lib/payments'
import { getPlayersForCurrentClub } from '@/lib/players'
import { getSuspensionsForCurrentClub } from '@/lib/suspensions'
import { getTeamsForCurrentClubLive } from '@/lib/teams'
import type { AttendanceSession, Contribution, Match, Player, Team } from '@/lib/types'

function sortByDateDesc<T extends { date: string }>(items: T[]) {
  return [...items].sort((left, right) => right.date.localeCompare(left.date))
}

function getUpcomingMatches(matches: Match[]) {
  return matches
    .filter((match) => match.status === 'programat')
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(0, 5)
}

function getRecentResults(matches: Match[]) {
  return matches
    .filter((match) => match.status === 'jucat')
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 5)
}

function getTopPlayers(players: Player[], teams: Team[]) {
  return [...players]
    .sort((left, right) => right.goals - left.goals || right.assists - left.assists)
    .slice(0, 5)
    .map((player) => ({
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      team: teams.find((team) => team.id === player.teamId)?.name ?? '-',
      goals: player.goals,
    }))
}

function getAttentionPlayers(players: Player[]) {
  return players
    .filter((player) => player.status !== 'activ')
    .slice(0, 5)
}

function getTopScorer(players: Player[]) {
  return [...players].sort((left, right) => right.goals - left.goals)[0] ?? demoPlayers[0]
}

function getAverageAttendance(attendanceSessions: AttendanceSession[]) {
  if (!attendanceSessions.length) {
    return 0
  }

  return Math.round(
    attendanceSessions.reduce((total, session) => total + session.attendanceRate, 0) /
      attendanceSessions.length
  )
}

function getTopContribution(contributions: Contribution[]) {
  return [...contributions].sort((left, right) => right.amount - left.amount)[0] ?? demoContributions[0]
}

export async function getDashboardData() {
  const [teams, playerData, paymentData, matches, attendanceSessions, suspensions] =
    await Promise.all([
      getTeamsForCurrentClubLive(),
      getPlayersForCurrentClub(),
      getPaymentsForCurrentClub(),
      getMatchesForCurrentClub(),
      getAttendanceForCurrentClub(),
      getSuspensionsForCurrentClub(),
    ])

  const players = playerData.players.length ? playerData.players : []
  const activeTeams = teams.length ? teams : []
  const activeMatches = matches.length ? matches : []
  const contributions = paymentData.contributions.length ? paymentData.contributions : []

  const topScorer = getTopScorer(players)
  const topContribution = getTopContribution(contributions)

  return {
    summary: {
      totalPlayers: players.length,
      totalTeams: activeTeams.length,
      outstandingPayments: paymentData.summary.totalOutstanding,
      nextMatches: getUpcomingMatches(activeMatches).length,
      suspendedPlayers: suspensions.filter((entry) => entry.status === 'activa').length,
      averageAttendance: getAverageAttendance(attendanceSessions),
      onlineContributions: paymentData.summary.onlineContributionTotal,
    },
    topScorer,
    topContribution,
    upcomingMatches: getUpcomingMatches(activeMatches),
    recentResults: getRecentResults(activeMatches),
    topPlayers: getTopPlayers(players, activeTeams),
    teams: activeTeams,
    attentionPlayers: getAttentionPlayers(players),
  }
}
