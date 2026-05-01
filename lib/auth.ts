import { currentClub, currentUser } from '@/lib/demo-data'
import { isSupabaseConfigured } from '@/lib/env'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Club, UserRole } from '@/lib/types'

export interface AppViewer {
  club: Club
  user: {
    id?: string
    fullName: string
    role: UserRole
    email?: string
    assignedTeamId?: string | null
  }
  source: 'supabase' | 'demo'
}

function buildViewerWithDemoClub(input: {
  userId?: string
  fullName: string
  role: UserRole
  email?: string
  clubId?: string
  source: 'supabase' | 'demo'
  assignedTeamId?: string | null
}): AppViewer {
  return {
    club: {
      ...currentClub,
      id: input.clubId ?? currentClub.id,
    },
    user: {
      id: input.userId,
      fullName: input.fullName,
      role: input.role,
      email: input.email,
      assignedTeamId: input.assignedTeamId ?? null,
    },
    source: input.source,
  }
}

export async function getAppViewer(): Promise<AppViewer> {
  if (!isSupabaseConfigured()) {
    return buildViewerWithDemoClub({
      userId: currentUser.id,
      fullName: currentUser.fullName,
      role: currentUser.role,
      source: 'demo',
    })
  }

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return buildViewerWithDemoClub({
      userId: currentUser.id,
      fullName: currentUser.fullName,
      role: currentUser.role,
      source: 'demo',
    })
  }

  const admin = createSupabaseAdminClient()
  const [adminProfileResult, adminMembershipResult] = await Promise.all([
    admin
      .from('profiles')
      .select('full_name, email, club_id')
      .eq('id', user.id)
      .maybeSingle(),
    admin
      .from('club_memberships')
      .select('role, club_id, assigned_team_id')
      .eq('user_id', user.id)
      .limit(1),
  ])

  const [memberProfileResult, memberMembershipResult] =
    !adminProfileResult.data && !adminMembershipResult.data?.length
      ? await Promise.all([
          supabase
            .from('profiles')
            .select('full_name, email, club_id')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('club_memberships')
            .select('role, club_id, assigned_team_id')
            .eq('user_id', user.id)
            .limit(1),
        ])
      : [{ data: null }, { data: null }]

  const profile = adminProfileResult.data ?? memberProfileResult.data ?? null
  const memberships = adminMembershipResult.data?.length
    ? adminMembershipResult.data
    : memberMembershipResult.data?.length
      ? memberMembershipResult.data
      : []

  const activeClubId = profile?.club_id ?? memberships?.[0]?.club_id ?? null
  const hasRealMembership = Boolean(activeClubId && (profile || memberships.length))

  const clubResult = activeClubId
    ? await admin
        .from('clubs')
        .select(
          'id, name, cui, city, county, logo_url, email, phone, address, website, social_media, subscription_status, theme_key'
        )
        .eq('id', activeClubId)
        .maybeSingle()
    : { data: null, error: null }

  const memberClubResult =
    !clubResult.data && activeClubId
      ? await supabase
          .from('clubs')
          .select(
            'id, name, cui, city, county, logo_url, email, phone, address, website, social_media, subscription_status, theme_key'
          )
          .eq('id', activeClubId)
          .maybeSingle()
      : { data: null, error: null }

  const club = clubResult.data ?? memberClubResult.data ?? null

  const fallbackRole = (memberships?.[0]?.role as UserRole | undefined) ?? 'player'
  const fallbackAssignedTeamId = memberships?.[0]?.assigned_team_id ?? null
  const fallbackFullName = profile?.full_name ?? user.email ?? currentUser.fullName
  const fallbackEmail = profile?.email ?? user.email

  if (!club && hasRealMembership) {
    return buildViewerWithDemoClub({
      userId: user.id,
      fullName: fallbackFullName,
      role: fallbackRole,
      email: fallbackEmail,
      clubId: activeClubId ?? currentClub.id,
      source: 'supabase',
      assignedTeamId: fallbackAssignedTeamId,
    })
  }

  if (!hasRealMembership) {
    return buildViewerWithDemoClub({
      userId: user.id,
      fullName: fallbackFullName,
      role: fallbackRole,
      email: fallbackEmail,
      clubId: activeClubId ?? currentClub.id,
      source: 'demo',
      assignedTeamId: fallbackAssignedTeamId,
    })
  }

  if (!club) {
    return buildViewerWithDemoClub({
      userId: user.id,
      fullName: fallbackFullName,
      role: fallbackRole,
      email: fallbackEmail,
      clubId: activeClubId ?? currentClub.id,
      source: 'supabase',
      assignedTeamId: fallbackAssignedTeamId,
    })
  }

  return {
    club: {
      id: club.id,
      name: club.name,
      cui: club.cui,
      city: club.city,
      county: club.county,
      logoUrl: club.logo_url ?? '',
      email: club.email,
      phone: club.phone ?? '',
      address: club.address ?? '',
      website: club.website ?? '',
      socialMedia: Array.isArray(club.social_media) ? club.social_media : [],
      subscriptionStatus: club.subscription_status,
      themeKey: club.theme_key ?? undefined,
    },
    user: {
      id: user.id,
      fullName: profile?.full_name ?? user.email ?? currentUser.fullName,
      role: (memberships?.[0]?.role as UserRole | undefined) ?? 'player',
      email: profile?.email ?? user.email,
      assignedTeamId: memberships?.[0]?.assigned_team_id ?? null,
    },
    source: 'supabase',
  }
}
