import { revalidatePath } from 'next/cache'
import { logClubActivity } from '@/lib/activity-log'
import { getAppViewer } from '@/lib/auth'
import { matches as demoMatches, players as demoPlayers, suspensions as demoSuspensions } from '@/lib/demo-data'
import { isSupabaseConfigured } from '@/lib/env'
import { getMatchesForCurrentClub } from '@/lib/matches'
import { ensureViewerCanManage } from '@/lib/permissions'
import { getPlayersForCurrentClub } from '@/lib/players'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Suspension } from '@/lib/types'

interface SupabaseSuspensionRow {
  id: string
  player_id: string
  match_id: string | null
  reason: Suspension['reason']
  suspension_rounds: number
  remaining_rounds: number
  start_date: string
  status: Suspension['status']
}

function mapSuspensionRow(row: SupabaseSuspensionRow): Suspension {
  return {
    id: row.id,
    playerId: row.player_id,
    matchId: row.match_id ?? '',
    reason: row.reason,
    rounds: row.suspension_rounds,
    remainingRounds: row.remaining_rounds,
    startDate: row.start_date,
    status: row.status,
  }
}

export async function getSuspensionsForCurrentClub() {
  const viewer = await getAppViewer()

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return demoSuspensions
  }

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('suspensions')
    .select(
      `
        id,
        player_id,
        match_id,
        reason,
        suspension_rounds,
        remaining_rounds,
        start_date,
        status
      `
    )
    .eq('club_id', viewer.club.id)
    .order('start_date', { ascending: false })

  if (error || !data) {
    return demoSuspensions
  }

  return (data as SupabaseSuspensionRow[]).map(mapSuspensionRow)
}

export async function getSuspensionDashboardForCurrentClub() {
  const [suspensions, playerData, matches] = await Promise.all([
    getSuspensionsForCurrentClub(),
    getPlayersForCurrentClub(),
    getMatchesForCurrentClub(),
  ])

  const players = playerData.players.length ? playerData.players : demoPlayers
  const activeMatches = matches.length ? matches : demoMatches

  const rows = suspensions.map((suspension) => {
    const player = players.find((item) => item.id === suspension.playerId)
    const match = activeMatches.find((item) => item.id === suspension.matchId)

    return {
      id: suspension.id,
      playerName: player ? `${player.firstName} ${player.lastName}` : '-',
      matchOpponent: match?.opponent ?? '-',
      reason: suspension.reason,
      rounds: suspension.rounds,
      remainingRounds: suspension.remainingRounds,
      startDate: suspension.startDate,
      status: suspension.status,
    }
  })

  return {
    rows,
    suspensions,
    players,
    matches: activeMatches,
    summary: {
      activeCount: rows.filter((row) => row.status === 'activa').length,
      totalRemainingRounds: rows.reduce((sum, row) => sum + row.remainingRounds, 0),
      redCardCases: rows.filter((row) => row.reason === 'cartonas_rosu').length,
    },
  }
}

export async function getSuspensionByIdForCurrentClub(suspensionId: string) {
  const dashboard = await getSuspensionDashboardForCurrentClub()
  return dashboard.suspensions.find((entry) => entry.id === suspensionId) ?? null
}

export async function createSuspensionForCurrentClub(input: {
  playerId: string
  matchId: string
  reason: Suspension['reason']
  rounds: number
  remainingRounds: number
  startDate: string
  status: Suspension['status']
}) {
  const permission = await ensureViewerCanManage('suspensions')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a salva suspendări reale.',
    }
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('suspensions').insert({
    club_id: viewer.club.id,
    player_id: input.playerId,
    match_id: input.matchId || null,
    reason: input.reason,
    suspension_rounds: input.rounds,
    remaining_rounds: input.remainingRounds,
    start_date: input.startDate,
    status: input.status,
  })

  if (error) {
    return {
      ok: false,
      message: 'Nu am putut salva suspendarea. Verifică rolul curent și politicile RLS.',
    }
  }

  revalidatePath('/suspensions')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  await logClubActivity({
    area: 'suspensions',
    action: 'create',
    entityLabel: input.playerId,
    details: 'Suspendare nouă adăugată în evidență.',
  })

  return { ok: true, message: 'Suspendarea a fost salvată cu succes.' }
}

export async function updateSuspensionForCurrentClub(input: {
  suspensionId: string
  playerId: string
  matchId: string
  reason: Suspension['reason']
  rounds: number
  remainingRounds: number
  startDate: string
  status: Suspension['status']
}) {
  const permission = await ensureViewerCanManage('suspensions')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a actualiza suspendări reale.',
    }
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('suspensions')
    .update({
      player_id: input.playerId,
      match_id: input.matchId || null,
      reason: input.reason,
      suspension_rounds: input.rounds,
      remaining_rounds: input.remainingRounds,
      start_date: input.startDate,
      status: input.status,
    })
    .eq('id', input.suspensionId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message:
        'Nu am putut actualiza suspendarea. Verifică rolul curent și politicile RLS.',
    }
  }

  revalidatePath('/suspensions')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  await logClubActivity({
    area: 'suspensions',
    action: 'update',
    entityLabel: input.playerId,
    details: 'Suspendarea a fost actualizată.',
  })

  return { ok: true, message: 'Suspendarea a fost actualizată cu succes.' }
}

export async function deleteSuspensionForCurrentClub(suspensionId: string) {
  const permission = await ensureViewerCanManage('suspensions')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a șterge suspendări reale.',
    }
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('suspensions')
    .delete()
    .eq('id', suspensionId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message:
        'Nu am putut șterge suspendarea. Verifică rolul curent și politicile RLS.',
    }
  }

  revalidatePath('/suspensions')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  await logClubActivity({
    area: 'suspensions',
    action: 'delete',
    entityLabel: suspensionId,
    details: 'Suspendarea a fost ștearsă.',
  })

  return { ok: true, message: 'Suspendarea a fost ștearsă cu succes.' }
}
