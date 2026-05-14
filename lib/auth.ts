import { currentClub, currentUser } from '@/lib/demo-data'
import { isSupabaseAdminConfigured, isSupabaseAuthConfigured } from '@/lib/env'
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

export class ViewerResolutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ViewerResolutionError'
  }
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
  if (!isSupabaseAuthConfigured()) {
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
      userId: undefined,
      fullName: currentUser.fullName,
      role: currentUser.role,
      source: 'demo',
    })
  }

  if (!isSupabaseAdminConfigured()) {
    console.error('Supabase admin backend is not ready for authenticated viewer resolution.')
    throw new ViewerResolutionError(
      'Autentificarea este activă, dar backend-ul administrativ Supabase nu este configurat complet. Verifică service role-ul și setup-ul server-side.'
    )
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

  if (adminProfileResult.error) {
    console.error('Failed to load authenticated profile with admin client', adminProfileResult.error)
    throw new ViewerResolutionError(
      'Nu am putut încărca profilul utilizatorului din Supabase. Verifică grants-urile și permisiunile backend.'
    )
  }

  if (adminMembershipResult.error) {
    console.error(
      'Failed to load authenticated memberships with admin client',
      adminMembershipResult.error
    )
    throw new ViewerResolutionError(
      'Nu am putut încărca membership-ul utilizatorului din Supabase. Verifică grants-urile și permisiunile backend.'
    )
  }

  const profile = adminProfileResult.data ?? null
  const memberships = adminMembershipResult.data?.length ? adminMembershipResult.data : []

  const activeClubId = profile?.club_id ?? memberships?.[0]?.club_id ?? null
  const hasRealMembership = Boolean(activeClubId && (profile || memberships.length))

  const fallbackRole = (memberships?.[0]?.role as UserRole | undefined) ?? 'player'
  const fallbackAssignedTeamId = memberships?.[0]?.assigned_team_id ?? null
  const fallbackFullName = profile?.full_name ?? user.email ?? currentUser.fullName
  const fallbackEmail = profile?.email ?? user.email

  if (!hasRealMembership) {
    throw new ViewerResolutionError(
      'Contul autentificat nu este asociat corect la niciun club. Creează profilul și membership-ul înainte de testarea internă.'
    )
  }

  const clubResult = await admin
    .from('clubs')
    .select(
      'id, name, cui, city, county, logo_url, email, phone, address, website, social_media, subscription_status, theme_key'
    )
    .eq('id', activeClubId)
    .maybeSingle()

  if (clubResult.error) {
    console.error('Failed to load active club with admin client', clubResult.error)
    throw new ViewerResolutionError(
      'Membership-ul există, dar clubul live nu a putut fi încărcat din Supabase. Aplicația a oprit accesul pentru a evita o stare demo/live mixtă.'
    )
  }

  const club = clubResult.data

  if (!club) {
    throw new ViewerResolutionError(
      'Membership-ul există, dar clubul live lipsește sau nu este accesibil. Verifică datele din tabela clubs înainte de test.'
    )
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
