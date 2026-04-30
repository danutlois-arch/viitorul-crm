import { revalidatePath } from 'next/cache'
import { logClubActivity } from '@/lib/activity-log'
import { getAppViewer } from '@/lib/auth'
import { competitions as demoCompetitions, teamCategories as demoCategories } from '@/lib/catalogs'
import { teams as demoTeams } from '@/lib/demo-data'
import { isSupabaseConfigured } from '@/lib/env'
import { ensureViewerCanManage } from '@/lib/permissions'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { CompetitionName, Team, TeamCategory } from '@/lib/types'

interface SupabaseLookupRow {
  id: string
  label: string
}

interface SupabaseTeamRow {
  id: string
  club_id: string
  name: string
  season: string
  head_coach: string | null
  assistant_coach: string | null
  team_manager: string | null
  team_categories: { label: TeamCategory }[] | null
  competitions: { label: CompetitionName }[] | null
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

async function ensureLookupId(input: {
  table: 'team_categories' | 'competitions'
  label: string
}) {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from(input.table)
    .upsert({ label: input.label }, { onConflict: 'label' })
    .select('id')
    .single()

  if (error || !data?.id) {
    return null
  }

  return data.id as string
}

export async function getTeamCatalogs() {
  if (!isSupabaseConfigured()) {
    return {
      categories: demoCategories,
      competitions: demoCompetitions,
    }
  }

  const supabase = createSupabaseAdminClient()
  const [{ data: categoryRows, error: categoryError }, { data: competitionRows, error: competitionError }] =
    await Promise.all([
      supabase.from('team_categories').select('id, label').order('label'),
      supabase.from('competitions').select('id, label').order('label'),
    ])

  return {
    categories:
      !categoryError && categoryRows?.length
        ? (categoryRows as SupabaseLookupRow[]).map((row) => row.label as TeamCategory)
        : demoCategories,
    competitions:
      !competitionError && competitionRows?.length
        ? (competitionRows as SupabaseLookupRow[]).map((row) => row.label as CompetitionName)
        : demoCompetitions,
  }
}

export async function getTeamsForCurrentClubLive() {
  const viewer = await getAppViewer()

  if (!isSupabaseConfigured()) {
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
    return []
  }

  return (data as SupabaseTeamRow[]).map(mapTeamRow)
}

export async function createTeamForCurrentClub(input: {
  name: string
  category: TeamCategory
  competition: CompetitionName
  season: string
  headCoach: string
  assistantCoach: string
  teamManager: string
}) {
  const permission = await ensureViewerCanManage('teams')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a salva echipe reale în baza de date.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const [categoryId, competitionId] = await Promise.all([
    ensureLookupId({ table: 'team_categories', label: input.category }),
    ensureLookupId({ table: 'competitions', label: input.competition }),
  ])

  if (!categoryId || !competitionId) {
    return {
      ok: false,
      message: 'Nu am putut pregăti categoria sau competiția selectată în catalogul Supabase.',
    }
  }

  const { error } = await supabase.from('teams').insert({
    club_id: viewer.club.id,
    name: input.name,
    category_id: categoryId,
    competition_id: competitionId,
    season: input.season,
    head_coach: input.headCoach || null,
    assistant_coach: input.assistantCoach || null,
    team_manager: input.teamManager || null,
  })

  if (error) {
    return {
      ok: false,
      message: `Nu am putut salva echipa: ${error.message}`,
    }
  }

  revalidatePath('/teams')
  revalidatePath('/players')
  await logClubActivity({
    area: 'teams',
    action: 'create',
    entityLabel: input.name,
    details: `Echipă nouă creată pentru categoria ${input.category}.`,
  })

  return {
    ok: true,
    message: 'Echipa a fost salvată cu succes.',
  }
}

export async function getTeamByIdForCurrentClub(teamId: string) {
  const teams = await getTeamsForCurrentClubLive()
  return teams.find((team) => team.id === teamId) ?? null
}

export async function updateTeamForCurrentClub(input: {
  teamId: string
  name: string
  category: TeamCategory
  competition: CompetitionName
  season: string
  headCoach: string
  assistantCoach: string
  teamManager: string
}) {
  const permission = await ensureViewerCanManage('teams')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a actualiza echipe reale în baza de date.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const [categoryId, competitionId] = await Promise.all([
    ensureLookupId({ table: 'team_categories', label: input.category }),
    ensureLookupId({ table: 'competitions', label: input.competition }),
  ])

  if (!categoryId || !competitionId) {
    return {
      ok: false,
      message: 'Nu am putut pregăti categoria sau competiția selectată în catalogul Supabase.',
    }
  }

  const { error } = await supabase
    .from('teams')
    .update({
      name: input.name,
      category_id: categoryId,
      competition_id: competitionId,
      season: input.season,
      head_coach: input.headCoach || null,
      assistant_coach: input.assistantCoach || null,
      team_manager: input.teamManager || null,
    })
    .eq('id', input.teamId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message: `Nu am putut actualiza echipa: ${error.message}`,
    }
  }

  revalidatePath('/teams')
  revalidatePath('/players')
  revalidatePath('/matches')
  revalidatePath('/attendance')
  await logClubActivity({
    area: 'teams',
    action: 'update',
    entityLabel: input.name,
    details: 'Detaliile echipei au fost actualizate.',
  })

  return {
    ok: true,
    message: 'Echipa a fost actualizată cu succes.',
  }
}

export async function deleteTeamForCurrentClub(teamId: string) {
  const permission = await ensureViewerCanManage('teams')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a șterge echipe reale din baza de date.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message: `Nu am putut șterge echipa: ${error.message}`,
    }
  }

  revalidatePath('/teams')
  revalidatePath('/players')
  revalidatePath('/matches')
  revalidatePath('/attendance')
  await logClubActivity({
    area: 'teams',
    action: 'delete',
    entityLabel: teamId,
    details: 'Echipă ștearsă din structură.',
  })

  return {
    ok: true,
    message: 'Echipa a fost ștearsă cu succes.',
  }
}
