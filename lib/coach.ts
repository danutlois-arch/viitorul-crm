import { revalidatePath } from 'next/cache'
import { getAppViewer } from '@/lib/auth'
import { getMatchesForCurrentClub } from '@/lib/matches'
import { ensureViewerCanManage } from '@/lib/permissions'
import { getPlayersForCurrentClub } from '@/lib/players'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getTeamsForCurrentClubLive } from '@/lib/teams'
import type { AppViewer } from '@/lib/auth'

interface CoachStatRow {
  id: string
  player_id: string
  starter: boolean
  minutes_played: number
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  coach_rating: number | null
  notes: string | null
  entered_minute: number | null
  exited_minute: number | null
}

interface CoachAttendanceRow {
  id: string
  attendance_session_id: string
  player_id: string
  status: 'prezent' | 'absent_motivat' | 'absent_nemotivat' | 'accidentat'
  notes: string | null
  coach_rating: number | null
}

export function isCoachLockedToCenter(viewer: AppViewer) {
  return viewer.source === 'supabase' && viewer.user.role === 'coach' && Boolean(viewer.user.assignedTeamId)
}

export async function getAssignedCoachTeam() {
  const viewer = await getAppViewer()
  const assignedTeamId = viewer.user.assignedTeamId

  if (viewer.source !== 'supabase' || !assignedTeamId) {
    return null
  }

  const teams = await getTeamsForCurrentClubLive()
  return teams.find((team) => team.id === assignedTeamId) ?? null
}

export async function getCoachCenterData() {
  const viewer = await getAppViewer()
  const assignedTeam = await getAssignedCoachTeam()

  if (!assignedTeam) {
    return {
      viewer,
      assignedTeam: null,
      players: [],
      matches: [],
      nextMatch: null,
    }
  }

  const [playerData, matches, attendanceSessions] = await Promise.all([
    getPlayersForCurrentClub(),
    getMatchesForCurrentClub(),
    getCoachAttendanceSessions(),
  ])

  const teamPlayers = playerData.players.filter((player) => player.teamId === assignedTeam.id)
  const teamMatches = matches
    .filter((match) => match.teamId === assignedTeam.id)
    .sort((left, right) => `${left.date}T${left.hour}`.localeCompare(`${right.date}T${right.hour}`))
  const nextMatch = teamMatches.find((match) => match.status === 'programat') ?? teamMatches[0] ?? null

  return {
    viewer,
    assignedTeam,
    players: teamPlayers,
    matches: teamMatches,
    nextMatch,
    attendanceSessions,
    nextTraining: attendanceSessions[0] ?? null,
  }
}

async function getCoachAttendanceSessions() {
  const viewer = await getAppViewer()
  const assignedTeamId = viewer.user.assignedTeamId

  if (viewer.source !== 'supabase' || !assignedTeamId) {
    return []
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select(
      `
        id,
        team_id,
        session_date,
        session_hour,
        location,
        session_type,
        attendance_records(status)
      `
    )
    .eq('club_id', viewer.club.id)
    .eq('team_id', assignedTeamId)
    .order('session_date', { ascending: false })
    .order('session_hour', { ascending: false })

  if (error || !data) {
    return []
  }

  return data.map((row) => {
    const records = (row as { attendance_records?: { status: string }[] }).attendance_records ?? []
    const present = records.filter((entry) => entry.status === 'prezent').length
    const total = records.length

    return {
      id: row.id as string,
      teamId: row.team_id as string,
      date: row.session_date as string,
      hour: String(row.session_hour).slice(0, 5),
      location: (row.location as string | null) ?? '',
      type: row.session_type as 'antrenament' | 'recuperare' | 'sedinta_video' | 'sala',
      attendanceRate: total ? Math.round((present / total) * 100) : 0,
    }
  })
}

export async function getCoachMatchdayData(matchId: string) {
  const center = await getCoachCenterData()

  if (!center.assignedTeam) {
    return {
      ...center,
      selectedMatch: null,
      statRows: [],
    }
  }

  const selectedMatch = center.matches.find((match) => match.id === matchId) ?? null

  if (!selectedMatch) {
    return {
      ...center,
      selectedMatch: null,
      statRows: [],
    }
  }

  const supabase = createSupabaseAdminClient()
  const { data } = await supabase
    .from('player_statistics')
    .select(
      `
        id,
        player_id,
        starter,
        minutes_played,
        goals,
        assists,
        yellow_cards,
        red_cards,
        coach_rating,
        notes,
        entered_minute,
        exited_minute
      `
    )
    .eq('club_id', center.viewer.club.id)
    .eq('match_id', matchId)

  const statRows = (data as CoachStatRow[] | null) ?? []
  const statMap = new Map(statRows.map((row) => [row.player_id, row]))

  return {
    ...center,
    selectedMatch,
    statRows: center.players.map((player) => {
      const stats = statMap.get(player.id)

      return {
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        position: player.position,
        starter: stats?.starter ?? false,
        minutesPlayed: stats?.minutes_played ?? 0,
        goals: stats?.goals ?? 0,
        assists: stats?.assists ?? 0,
        yellowCards: stats?.yellow_cards ?? 0,
        redCards: stats?.red_cards ?? 0,
        coachRating: stats?.coach_rating ?? 0,
        enteredMinute: stats?.entered_minute ?? 0,
        exitedMinute: stats?.exited_minute ?? 0,
        notes: stats?.notes ?? '',
      }
    }),
  }
}

export async function getCoachTrainingData(sessionId: string) {
  const center = await getCoachCenterData()

  if (!center.assignedTeam) {
    return {
      ...center,
      selectedTraining: null,
      trainingRows: [],
    }
  }

  const selectedTraining =
    center.attendanceSessions.find((session) => session.id === sessionId) ?? null

  if (!selectedTraining) {
    return {
      ...center,
      selectedTraining: null,
      trainingRows: [],
    }
  }

  const supabase = createSupabaseAdminClient()
  const { data } = await supabase
    .from('attendance_records')
    .select('id, attendance_session_id, player_id, status, notes, coach_rating')
    .eq('club_id', center.viewer.club.id)
    .eq('attendance_session_id', sessionId)

  const rows = (data as CoachAttendanceRow[] | null) ?? []
  const recordMap = new Map(rows.map((row) => [row.player_id, row]))

  return {
    ...center,
    selectedTraining,
    trainingRows: center.players.map((player) => {
      const record = recordMap.get(player.id)

      return {
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        position: player.position,
        status: record?.status ?? 'prezent',
        coachRating: record?.coach_rating ?? 0,
        notes: record?.notes ?? '',
      }
    }),
  }
}

export async function saveCoachMatchStat(input: {
  matchId: string
  playerId: string
  starter: boolean
  minutesPlayed: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  coachRating: number
  enteredMinute: number
  exitedMinute: number
  notes: string
}) {
  const permission = await ensureViewerCanManage('statistics')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  const center = await getCoachCenterData()

  if (!center.assignedTeam) {
    return { ok: false, message: 'Antrenorul nu are încă o grupă alocată din modulul Cluburi.' }
  }

  const match = center.matches.find((entry) => entry.id === input.matchId)
  const player = center.players.find((entry) => entry.id === input.playerId)

  if (!match || !player) {
    return {
      ok: false,
      message: 'Poți nota doar meciuri și jucători din grupa alocată antrenorului.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('player_statistics').upsert(
    {
      club_id: viewer.club.id,
      match_id: input.matchId,
      player_id: input.playerId,
      starter: input.starter,
      minutes_played: input.minutesPlayed,
      goals: input.goals,
      assists: input.assists,
      yellow_cards: input.yellowCards,
      red_cards: input.redCards,
      coach_rating: input.coachRating || null,
      entered_minute: input.enteredMinute || null,
      exited_minute: input.exitedMinute || null,
      notes: input.notes || null,
    },
    { onConflict: 'match_id,player_id' }
  )

  if (error) {
    return {
      ok: false,
      message: `Nu am putut salva fișa de meci a jucătorului: ${error.message}`,
    }
  }

  revalidatePath('/coach')
  revalidatePath(`/coach/matchday?matchId=${input.matchId}`)
  revalidatePath('/statistics')
  revalidatePath('/players')
  revalidatePath('/reports')

  return {
    ok: true,
    message: 'Fișa de meci a jucătorului a fost salvată.',
  }
}

export async function saveCoachTrainingRecord(input: {
  sessionId: string
  playerId: string
  status: 'prezent' | 'absent_motivat' | 'absent_nemotivat' | 'accidentat'
  coachRating: number
  notes: string
}) {
  const permission = await ensureViewerCanManage('attendance')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  const center = await getCoachCenterData()

  if (!center.assignedTeam) {
    return { ok: false, message: 'Antrenorul nu are încă o grupă alocată.' }
  }

  const session = center.attendanceSessions.find((entry) => entry.id === input.sessionId)
  const player = center.players.find((entry) => entry.id === input.playerId)

  if (!session || !player) {
    return {
      ok: false,
      message: 'Poți nota doar prezența și observațiile pentru grupa alocată antrenorului.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('attendance_records').upsert(
    {
      club_id: viewer.club.id,
      attendance_session_id: input.sessionId,
      player_id: input.playerId,
      status: input.status,
      coach_rating: input.coachRating || null,
      notes: input.notes || null,
    },
    { onConflict: 'attendance_session_id,player_id' }
  )

  if (error) {
    return {
      ok: false,
      message: `Nu am putut salva fișa de antrenament: ${error.message}`,
    }
  }

  revalidatePath('/coach')
  revalidatePath(`/coach?trainingId=${input.sessionId}`)
  revalidatePath('/attendance')

  return {
    ok: true,
    message: 'Fișa de antrenament a fost salvată.',
  }
}

export async function createCoachTrainingSession(input: {
  date: string
  hour: string
  location: string
  type: 'antrenament' | 'recuperare' | 'sedinta_video' | 'sala'
}) {
  const permission = await ensureViewerCanManage('attendance')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  const assignedTeamId = viewer.user.assignedTeamId

  if (!assignedTeamId) {
    return { ok: false, message: 'Antrenorul nu are încă o grupă alocată.' }
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('attendance_sessions').insert({
    club_id: viewer.club.id,
    team_id: assignedTeamId,
    session_date: input.date,
    session_hour: input.hour,
    location: input.location,
    session_type: input.type,
  })

  if (error) {
    return {
      ok: false,
      message: `Nu am putut crea sesiunea de antrenament: ${error.message}`,
    }
  }

  revalidatePath('/coach')
  revalidatePath('/attendance')

  return {
    ok: true,
    message: 'Sesiunea de antrenament a fost creată.',
  }
}
