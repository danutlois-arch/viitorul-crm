import { revalidatePath } from 'next/cache'
import { logClubActivity } from '@/lib/activity-log'
import { getAppViewer } from '@/lib/auth'
import { players as demoPlayers, teams as demoTeams } from '@/lib/demo-data'
import { isSupabaseConfigured } from '@/lib/env'
import { ensureViewerCanManage } from '@/lib/permissions'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Player, PlayerStatus, Team } from '@/lib/types'
import { calculateAge } from '@/lib/utils'

interface SupabaseTeamRow {
  id: string
  club_id: string
  name: string
  season: string
  head_coach: string | null
  assistant_coach: string | null
  team_manager: string | null
  team_categories: { label: Team['category'] }[] | null
  competitions: { label: Team['competition'] }[] | null
}

interface SupabasePlayerRow {
  id: string
  club_id: string
  team_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  position: string
  preferred_foot: Player['preferredFoot']
  height_cm: number | null
  weight_kg: number | null
  player_phone: string | null
  player_email: string | null
  guardian_name: string | null
  guardian_phone: string | null
  guardian_email: string | null
  federation_registration_number: string | null
  status: PlayerStatus
  medical_notes: string | null
  coach_notes: string | null
  profile_image_url: string | null
  player_statistics:
    | {
        goals: number | null
        assists: number | null
        minutes_played: number | null
      }[]
    | null
}

function mapTeamRow(row: SupabaseTeamRow): Team {
  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    category: row.team_categories?.[0]?.label ?? 'U19',
    competition: row.competitions?.[0]?.label ?? 'AJF',
    season: row.season,
    headCoach: row.head_coach ?? '',
    assistantCoach: row.assistant_coach ?? '',
    teamManager: row.team_manager ?? '',
  }
}

function mapPlayerRow(row: SupabasePlayerRow): Player {
  const totals = (row.player_statistics ?? []).reduce(
    (accumulator, entry) => ({
      goals: accumulator.goals + (entry.goals ?? 0),
      assists: accumulator.assists + (entry.assists ?? 0),
      minutesPlayed: accumulator.minutesPlayed + (entry.minutes_played ?? 0),
    }),
    { goals: 0, assists: 0, minutesPlayed: 0 }
  )

  return {
    id: row.id,
    clubId: row.club_id,
    teamId: row.team_id,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    position: row.position,
    preferredFoot: row.preferred_foot,
    height: row.height_cm ?? 0,
    weight: row.weight_kg ?? 0,
    phone: row.player_phone ?? '',
    email: row.player_email ?? '',
    guardianName: row.guardian_name ?? '',
    guardianPhone: row.guardian_phone ?? '',
    guardianEmail: row.guardian_email ?? '',
    registrationNumber: row.federation_registration_number ?? '',
    status: row.status,
    medicalNotes: row.medical_notes ?? '',
    coachNotes: row.coach_notes ?? '',
    profileImageUrl: row.profile_image_url ?? '',
    goals: totals.goals,
    assists: totals.assists,
    minutesPlayed: totals.minutesPlayed,
  }
}

export async function getTeamsForCurrentClub() {
  const viewer = await getAppViewer()

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return demoTeams
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('teams')
    .select(
      `
        id,
        club_id,
        name,
        season,
        head_coach,
        assistant_coach,
        team_manager,
        team_categories(label),
        competitions(label)
      `
    )
    .eq('club_id', viewer.club.id)
    .order('name')

  if (error || !data) {
    return demoTeams
  }

  return (data as SupabaseTeamRow[]).map(mapTeamRow)
}

export async function getPlayersForCurrentClub() {
  const viewer = await getAppViewer()
  const teams = await getTeamsForCurrentClub()

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      players: demoPlayers,
      rows: demoPlayers.map((player) => {
        const team = teams.find((entry) => entry.id === player.teamId)
        return {
          id: player.id,
          teamId: player.teamId,
          name: `${player.firstName} ${player.lastName}`,
          team: team?.name ?? '-',
          age: calculateAge(player.dateOfBirth),
          position: player.position,
          status: player.status,
          goals: player.goals,
        }
      }),
    }
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('players')
    .select(
      `
        id,
        club_id,
        team_id,
        first_name,
        last_name,
        date_of_birth,
        position,
        preferred_foot,
        height_cm,
        weight_kg,
        player_phone,
        player_email,
        guardian_name,
        guardian_phone,
        guardian_email,
        federation_registration_number,
        status,
        medical_notes,
        coach_notes,
        profile_image_url,
        player_statistics(goals, assists, minutes_played)
      `
    )
    .eq('club_id', viewer.club.id)
    .order('last_name')
    .order('first_name')

  if (error || !data) {
    return {
      players: demoPlayers,
      rows: demoPlayers.map((player) => {
        const team = teams.find((entry) => entry.id === player.teamId)
        return {
          id: player.id,
          teamId: player.teamId,
          name: `${player.firstName} ${player.lastName}`,
          team: team?.name ?? '-',
          age: calculateAge(player.dateOfBirth),
          position: player.position,
          status: player.status,
          goals: player.goals,
        }
      }),
    }
  }

  const mappedPlayers = (data as SupabasePlayerRow[]).map(mapPlayerRow)

  return {
    players: mappedPlayers,
    rows: mappedPlayers.map((player) => {
      const team = teams.find((entry) => entry.id === player.teamId)
      return {
        id: player.id,
        teamId: player.teamId,
        name: `${player.firstName} ${player.lastName}`,
        team: team?.name ?? '-',
        age: calculateAge(player.dateOfBirth),
        position: player.position,
        status: player.status,
        goals: player.goals,
      }
    }),
  }
}

export async function getPlayerByIdForCurrentClub(playerId: string) {
  const playerData = await getPlayersForCurrentClub()
  return playerData.players.find((player) => player.id === playerId) ?? null
}

export async function createPlayerForCurrentClub(input: {
  teamId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  position: string
  guardianName: string
  profileImageUrl?: string
}) {
  const permission = await ensureViewerCanManage('players')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a salva jucători reali în baza de date.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('players').insert({
    club_id: viewer.club.id,
    team_id: input.teamId,
    first_name: input.firstName,
    last_name: input.lastName,
    date_of_birth: input.dateOfBirth,
    position: input.position,
    guardian_name: input.guardianName || null,
    profile_image_url: input.profileImageUrl || null,
    status: 'activ',
  })

  if (error) {
    return {
      ok: false,
      message: `Nu am putut salva jucătorul: ${error.message}`,
    }
  }

  revalidatePath('/players')
  await logClubActivity({
    area: 'players',
    action: 'create',
    entityLabel: `${input.firstName} ${input.lastName}`,
    details: 'Jucător nou adăugat în lot.',
  })

  return {
    ok: true,
    message: 'Jucătorul a fost adăugat cu succes.',
  }
}

export async function updatePlayerForCurrentClub(input: {
  playerId: string
  teamId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  position: string
  guardianName: string
  profileImageUrl?: string
}) {
  const permission = await ensureViewerCanManage('players')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a actualiza jucători reali în baza de date.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('players')
    .update({
      team_id: input.teamId,
      first_name: input.firstName,
      last_name: input.lastName,
      date_of_birth: input.dateOfBirth,
      position: input.position,
      guardian_name: input.guardianName || null,
      profile_image_url: input.profileImageUrl || null,
    })
    .eq('id', input.playerId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message: `Nu am putut actualiza jucătorul: ${error.message}`,
    }
  }

  revalidatePath('/players')
  await logClubActivity({
    area: 'players',
    action: 'update',
    entityLabel: `${input.firstName} ${input.lastName}`,
    details: 'Fișa jucătorului a fost actualizată.',
  })

  return {
    ok: true,
    message: 'Jucătorul a fost actualizat cu succes.',
  }
}

export async function deletePlayerForCurrentClub(playerId: string) {
  const permission = await ensureViewerCanManage('players')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a șterge jucători reali din baza de date.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', playerId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message: `Nu am putut șterge jucătorul: ${error.message}`,
    }
  }

  revalidatePath('/players')
  await logClubActivity({
    area: 'players',
    action: 'delete',
    entityLabel: playerId,
    details: 'Jucător eliminat din club.',
  })

  return {
    ok: true,
    message: 'Jucătorul a fost șters cu succes.',
  }
}
