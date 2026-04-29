import { cache } from 'react'
import { currentClub, currentUser } from '@/lib/demo-data'
import { isSupabaseConfigured } from '@/lib/env'
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

const roleFallback: UserRole[] = [
  'club_admin',
  'sporting_director',
  'coach',
  'team_manager',
  'parent',
  'player',
  'super_admin',
]

export const getAppViewer = cache(async (): Promise<AppViewer> => {
  if (!isSupabaseConfigured()) {
    return {
      club: currentClub,
      user: currentUser,
      source: 'demo',
    }
  }

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      club: currentClub,
      user: currentUser,
      source: 'demo',
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, club_id')
    .eq('id', user.id)
    .maybeSingle()

  const { data: memberships } = await supabase
    .from('club_memberships')
    .select('role, club_id')
    .eq('user_id', user.id)
    .limit(1)

  const activeClubId = profile?.club_id ?? memberships?.[0]?.club_id

  const { data: club } = activeClubId
    ? await supabase
        .from('clubs')
        .select(
          'id, name, cui, city, county, logo_url, email, phone, address, website, social_media, subscription_status, theme_key'
        )
        .eq('id', activeClubId)
        .maybeSingle()
    : { data: null }

  if (!club) {
    return {
      club: currentClub,
      user: {
        id: user.id,
        fullName: profile?.full_name ?? user.email ?? currentUser.fullName,
        role: memberships?.[0]?.role ?? currentUser.role,
        email: user.email,
      },
      source: 'demo',
    }
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
      role: (memberships?.[0]?.role as UserRole | undefined) ?? roleFallback[0],
      email: profile?.email ?? user.email,
    },
    source: 'supabase',
  }
})
