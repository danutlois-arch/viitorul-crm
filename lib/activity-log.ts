import { revalidatePath } from 'next/cache'
import { getAppViewer } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/env'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

interface ActivityRow {
  id: string
  area: string
  action: string
  entity_label: string | null
  details: string | null
  created_at: string
  actor_name: string | null
  actor_role: string | null
}

const demoEntries: ActivityRow[] = [
  {
    id: 'demo-activity-1',
    area: 'players',
    action: 'create',
    entity_label: 'Lot U17',
    details: 'Jucător demo adăugat în platformă.',
    created_at: new Date().toISOString(),
    actor_name: 'Demo Admin',
    actor_role: 'club_admin',
  },
]

export async function logClubActivity(input: {
  area: string
  action: string
  entityLabel: string
  details?: string
}) {
  const viewer = await getAppViewer()

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return
  }

  const supabase = createSupabaseAdminClient()
  await supabase.from('activity_logs').insert({
    club_id: viewer.club.id,
    actor_user_id: null,
    actor_name: viewer.user.fullName,
    actor_role: viewer.user.role,
    area: input.area,
    action: input.action,
    entity_label: input.entityLabel,
    details: input.details ?? null,
  })

  revalidatePath('/clubs')
}

export async function getRecentActivityForCurrentClub(limit = 8) {
  const viewer = await getAppViewer()

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return demoEntries
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return []
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, area, action, entity_label, details, created_at, actor_name, actor_role')
    .eq('club_id', viewer.club.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data as ActivityRow[]
}
