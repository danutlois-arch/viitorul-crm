import { revalidatePath } from 'next/cache'
import { logClubActivity } from '@/lib/activity-log'
import { getAppViewer } from '@/lib/auth'
import { competitions as competitionCatalog } from '@/lib/catalogs'
import { matches as demoMatches } from '@/lib/demo-data'
import { isSupabaseConfigured } from '@/lib/env'
import { ensureViewerCanManage } from '@/lib/permissions'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getTeamsForCurrentClubLive } from '@/lib/teams'
import type { CompetitionName, Match, MatchStatus } from '@/lib/types'

interface SupabaseMatchRow {
  id: string
  team_id: string
  round_label: string | null
  opponent: string
  venue_type: Match['venueType']
  match_date: string
  match_hour: string
  location: string | null
  team_score: number | null
  opponent_score: number | null
  status: MatchStatus
  notes: string | null
  competitions: { label: CompetitionName } | { label: CompetitionName }[] | null
}

function getCompetitionLabel(
  value: { label: CompetitionName } | { label: CompetitionName }[] | null | undefined
) {
  if (!value) {
    return null
  }

  return Array.isArray(value) ? value[0]?.label ?? null : value.label
}

function mapMatchRow(row: SupabaseMatchRow): Match {
  return {
    id: row.id,
    teamId: row.team_id,
    competition: getCompetitionLabel(row.competitions) ?? 'Amical',
    round: row.round_label ?? '',
    opponent: row.opponent,
    venueType: row.venue_type,
    date: row.match_date,
    hour: row.match_hour.slice(0, 5),
    location: row.location ?? '',
    teamScore: row.team_score,
    opponentScore: row.opponent_score,
    status: row.status,
    notes: row.notes ?? '',
  }
}

export async function getMatchesForCurrentClub() {
  const viewer = await getAppViewer()

  if (!isSupabaseConfigured()) {
    return demoMatches
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('matches')
    .select(
      `
        id,
        team_id,
        round_label,
        opponent,
        venue_type,
        match_date,
        match_hour,
        location,
        team_score,
        opponent_score,
        status,
        notes,
        competitions(label)
      `
    )
    .eq('club_id', viewer.club.id)
    .order('match_date', { ascending: false })

  if (error || !data) {
    return []
  }

  return (data as SupabaseMatchRow[]).map(mapMatchRow)
}

export async function createMatchForCurrentClub(input: {
  teamId: string
  competition: CompetitionName
  round: string
  opponent: string
  venueType: Match['venueType']
  date: string
  hour: string
  location: string
  notes: string
}) {
  const permission = await ensureViewerCanManage('matches')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: 'Conectează Supabase și autentifică-te pentru a salva meciuri reale.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const { data: competitionRow, error: competitionError } = await supabase
    .from('competitions')
    .upsert({ label: input.competition }, { onConflict: 'label' })
    .select('id')
    .single()

  if (competitionError || !competitionRow?.id) {
    return {
      ok: false,
      message: 'Competiția selectată nu există în catalogul Supabase.',
    }
  }

  const { error } = await supabase.from('matches').insert({
    club_id: viewer.club.id,
    team_id: input.teamId,
    competition_id: competitionRow.id,
    round_label: input.round || null,
    opponent: input.opponent,
    venue_type: input.venueType,
    match_date: input.date,
    match_hour: input.hour,
    location: input.location,
    status: 'programat',
    notes: input.notes || null,
  })

  if (error) {
    return {
      ok: false,
      message: `Nu am putut salva meciul: ${error.message}`,
    }
  }

  revalidatePath('/matches')
  await logClubActivity({
    area: 'matches',
    action: 'create',
    entityLabel: input.opponent,
    details: `Meci nou programat pe ${input.date}.`,
  })

  return { ok: true, message: 'Meciul a fost adăugat cu succes.' }
}

export function getMatchCompetitions() {
  return competitionCatalog
}

export async function getMatchByIdForCurrentClub(matchId: string) {
  const matches = await getMatchesForCurrentClub()
  return matches.find((match) => match.id === matchId) ?? null
}

export async function updateMatchForCurrentClub(input: {
  matchId: string
  teamId: string
  competition: CompetitionName
  round: string
  opponent: string
  venueType: Match['venueType']
  date: string
  hour: string
  location: string
  notes: string
}) {
  const permission = await ensureViewerCanManage('matches')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: 'Conectează Supabase și autentifică-te pentru a actualiza meciuri reale.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const { data: competitionRow, error: competitionError } = await supabase
    .from('competitions')
    .upsert({ label: input.competition }, { onConflict: 'label' })
    .select('id')
    .single()

  if (competitionError || !competitionRow?.id) {
    return {
      ok: false,
      message: 'Competiția selectată nu există în catalogul Supabase.',
    }
  }

  const { error } = await supabase
    .from('matches')
    .update({
      team_id: input.teamId,
      competition_id: competitionRow.id,
      round_label: input.round || null,
      opponent: input.opponent,
      venue_type: input.venueType,
      match_date: input.date,
      match_hour: input.hour,
      location: input.location,
      notes: input.notes || null,
    })
    .eq('id', input.matchId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message: `Nu am putut actualiza meciul: ${error.message}`,
    }
  }

  revalidatePath('/matches')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  await logClubActivity({
    area: 'matches',
    action: 'update',
    entityLabel: input.opponent,
    details: 'Detaliile meciului au fost actualizate.',
  })

  return { ok: true, message: 'Meciul a fost actualizat cu succes.' }
}

export async function deleteMatchForCurrentClub(matchId: string) {
  const permission = await ensureViewerCanManage('matches')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: 'Conectează Supabase și autentifică-te pentru a șterge meciuri reale.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('matches')
    .delete()
    .eq('id', matchId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message: `Nu am putut șterge meciul: ${error.message}`,
    }
  }

  revalidatePath('/matches')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  await logClubActivity({
    area: 'matches',
    action: 'delete',
    entityLabel: matchId,
    details: 'Meci șters din calendar.',
  })

  return { ok: true, message: 'Meciul a fost șters cu succes.' }
}
