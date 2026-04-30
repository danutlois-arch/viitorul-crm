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
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('full_name, email, club_id')
    .eq('id', user.id)
    .maybeSingle()

  const { data: memberships, error: membershipsError } = await admin
    .from('club_memberships')
    .select('role, club_id')
    .eq('user_id', user.id)
    .limit(1)

  const activeClubId = profile?.club_id ?? memberships?.[0]?.club_id
  const hasRealMembership = Boolean(profile || memberships?.length)

  const { data: club, error: clubError } = activeClubId
    ? await admin
        .from('clubs')
        .select(
          'id, name, cui, city, county, logo_url, email, phone, address, website, social_media, subscription_status, theme_key'
        )
        .eq('id', activeClubId)
        .maybeSingle()
    : { data: null, error: null }

  const fallbackRole = (memberships?.[0]?.role as UserRole | undefined) ?? 'player'
  const fallbackFullName = profile?.full_name ?? user.email ?? currentUser.fullName
  const fallbackEmail = profile?.email ?? user.email
  const hasRuntimeErrors = Boolean(profileError || membershipsError || clubError)

  if (!club || !hasRealMembership || hasRuntimeErrors) {
    return buildViewerWithDemoClub({
      userId: user.id,
      fullName: fallbackFullName,
      role: fallbackRole,
      email: fallbackEmail,
      clubId: activeClubId ?? currentClub.id,
      source: 'demo',
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
    },
    source: 'supabase',
  }
}
