import { revalidatePath } from 'next/cache'
import { logClubActivity } from '@/lib/activity-log'
import { getAppViewer } from '@/lib/auth'
import { matches as demoMatches, players as demoPlayers } from '@/lib/demo-data'
import { isSupabaseConfigured } from '@/lib/env'
import { getMatchesForCurrentClub } from '@/lib/matches'
import { ensureViewerCanManage } from '@/lib/permissions'
import { getPlayersForCurrentClub } from '@/lib/players'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface SupabaseStatisticRow {
  id: string
  match_id: string
  player_id: string
  starter: boolean
  minutes_played: number
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  coach_rating: number | null
  notes: string | null
}

function createDemoEntries(players: Awaited<ReturnType<typeof getPlayersForCurrentClub>>['players']) {
  return players.map((player, index) => ({
    id: `demo-stat-${player.id}`,
    matchId: demoMatches[index % Math.max(demoMatches.length, 1)]?.id ?? '',
    playerId: player.id,
    playerName: `${player.firstName} ${player.lastName}`,
    opponent: demoMatches[index % Math.max(demoMatches.length, 1)]?.opponent ?? '-',
    starter: true,
    minutesPlayed: player.minutesPlayed,
    goals: player.goals,
    assists: player.assists,
    yellowCards: Math.max(0, Math.round(player.minutesPlayed / 450)),
    redCards: 0,
    coachRating: Number((6.5 + player.goals * 0.2 + player.assists * 0.15).toFixed(1)),
    notes: player.coachNotes || '',
    status: player.status,
  }))
}

export async function getStatisticsForCurrentClub() {
  const playerData = await getPlayersForCurrentClub()
  const [matches, viewer] = await Promise.all([
    getMatchesForCurrentClub(),
    getAppViewer(),
  ])
  const players = playerData.players.length ? playerData.players : demoPlayers
  const activeMatches = matches.length ? matches : demoMatches

  let entries = createDemoEntries(players)

  if (isSupabaseConfigured() && viewer.source !== 'demo') {
    const supabase = createSupabaseServerClient()
    const { data } = await supabase
      .from('player_statistics')
      .select(
        `
          id,
          match_id,
          player_id,
          starter,
          minutes_played,
          goals,
          assists,
          yellow_cards,
          red_cards,
          coach_rating,
          notes
        `
      )
      .eq('club_id', viewer.club.id)

    if (data?.length) {
      entries = (data as SupabaseStatisticRow[]).map((entry) => {
        const player = players.find((item) => item.id === entry.player_id)
        const match = activeMatches.find((item) => item.id === entry.match_id)

        return {
          id: entry.id,
          matchId: entry.match_id,
          playerId: entry.player_id,
          playerName: player ? `${player.firstName} ${player.lastName}` : '-',
          opponent: match?.opponent ?? '-',
          starter: entry.starter,
          minutesPlayed: entry.minutes_played,
          goals: entry.goals,
          assists: entry.assists,
          yellowCards: entry.yellow_cards,
          redCards: entry.red_cards,
          coachRating: entry.coach_rating ?? 0,
          notes: entry.notes ?? '',
          status: player?.status ?? 'activ',
        }
      })
    }
  }

  const rows = players
    .map((player) => ({
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      goals: player.goals,
      assists: player.assists,
      minutesPlayed: player.minutesPlayed,
      yellowCards: Math.max(0, Math.round(player.minutesPlayed / 450)),
      rating: player.goals * 2 + player.assists,
      status: player.status,
    }))
    .sort((left, right) => right.rating - left.rating || right.goals - left.goals)

  const totals = {
    topScorer: rows[0] ?? null,
    totalGoals: rows.reduce((sum, row) => sum + row.goals, 0),
    totalAssists: rows.reduce((sum, row) => sum + row.assists, 0),
    totalMinutes: rows.reduce((sum, row) => sum + row.minutesPlayed, 0),
  }

  return { rows, totals, entries, players, matches: activeMatches }
}

export async function getStatisticEntryByIdForCurrentClub(statisticId: string) {
  const statistics = await getStatisticsForCurrentClub()
  return statistics.entries.find((entry) => entry.id === statisticId) ?? null
}

export async function createStatisticEntryForCurrentClub(input: {
  matchId: string
  playerId: string
  starter: boolean
  minutesPlayed: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  coachRating: number
  notes: string
}) {
  const permission = await ensureViewerCanManage('statistics')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a salva statistici reale de meci.',
    }
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('player_statistics').insert({
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
    notes: input.notes || null,
  })

  if (error) {
    return {
      ok: false,
      message:
        'Nu am putut salva statistica. Verifică rolul curent, unicitatea pe meci-jucător și politicile RLS.',
    }
  }

  revalidatePath('/statistics')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  await logClubActivity({
    area: 'statistics',
    action: 'create',
    entityLabel: input.playerId,
    details: 'Statistică nouă de meci adăugată.',
  })

  return { ok: true, message: 'Statistica jucătorului a fost salvată cu succes.' }
}

export async function updateStatisticEntryForCurrentClub(input: {
  statisticId: string
  matchId: string
  playerId: string
  starter: boolean
  minutesPlayed: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  coachRating: number
  notes: string
}) {
  const permission = await ensureViewerCanManage('statistics')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a actualiza statistici reale de meci.',
    }
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('player_statistics')
    .update({
      match_id: input.matchId,
      player_id: input.playerId,
      starter: input.starter,
      minutes_played: input.minutesPlayed,
      goals: input.goals,
      assists: input.assists,
      yellow_cards: input.yellowCards,
      red_cards: input.redCards,
      coach_rating: input.coachRating || null,
      notes: input.notes || null,
    })
    .eq('id', input.statisticId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message:
        'Nu am putut actualiza statistica. Verifică rolul curent și politicile RLS.',
    }
  }

  revalidatePath('/statistics')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  await logClubActivity({
    area: 'statistics',
    action: 'update',
    entityLabel: input.playerId,
    details: 'Statistică de meci actualizată.',
  })

  return { ok: true, message: 'Statistica jucătorului a fost actualizată cu succes.' }
}

export async function deleteStatisticEntryForCurrentClub(statisticId: string) {
  const permission = await ensureViewerCanManage('statistics')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a șterge statistici reale de meci.',
    }
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('player_statistics')
    .delete()
    .eq('id', statisticId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message:
        'Nu am putut șterge statistica. Verifică rolul curent și politicile RLS.',
    }
  }

  revalidatePath('/statistics')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  await logClubActivity({
    area: 'statistics',
    action: 'delete',
    entityLabel: statisticId,
    details: 'Statistică de meci ștearsă.',
  })

  return { ok: true, message: 'Statistica jucătorului a fost ștearsă cu succes.' }
}
