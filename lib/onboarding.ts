import { getAttendanceForCurrentClub } from '@/lib/attendance'
import { getAppViewer } from '@/lib/auth'
import { getMatchesForCurrentClub } from '@/lib/matches'
import { getPaymentsForCurrentClub } from '@/lib/payments'
import { getPlayersForCurrentClub } from '@/lib/players'
import { getTeamsForCurrentClubLive } from '@/lib/teams'

export async function getClubOnboardingProgress() {
  const viewer = await getAppViewer()
  const [teams, players, matches, attendance, payments] = await Promise.all([
    getTeamsForCurrentClubLive(),
    getPlayersForCurrentClub(),
    getMatchesForCurrentClub(),
    getAttendanceForCurrentClub(),
    getPaymentsForCurrentClub(),
  ])

  const steps = [
    {
      id: 'club-profile',
      title: 'Profil club completat',
      description: 'Date administrative, branding și contact.',
      done: Boolean(
        viewer.club.name &&
          viewer.club.city &&
          viewer.club.county &&
          viewer.club.email &&
          (viewer.club.logoUrl || viewer.club.themeKey)
      ),
    },
    {
      id: 'teams',
      title: 'Echipe create',
      description: 'Seniori, juniori sau grupe academie.',
      done: teams.length > 0,
    },
    {
      id: 'players',
      title: 'Lot încărcat',
      description: 'Jucători asociați echipelor.',
      done: players.players.length > 0,
    },
    {
      id: 'matches',
      title: 'Calendar meciuri',
      description: 'Cel puțin un meci programat sau jucat.',
      done: matches.length > 0,
    },
    {
      id: 'attendance',
      title: 'Prezență urmărită',
      description: 'Cel puțin o sesiune de prezență creată.',
      done: attendance.length > 0,
    },
    {
      id: 'payments',
      title: 'Financiar pornit',
      description: 'Cel puțin o plată sau contribuție înregistrată.',
      done: payments.rows.length > 0 || payments.contributionRows.length > 0,
    },
  ]

  const completed = steps.filter((step) => step.done).length
  const percent = Math.round((completed / steps.length) * 100)

  return {
    steps,
    completed,
    total: steps.length,
    percent,
  }
}
