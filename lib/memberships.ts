import { revalidatePath } from 'next/cache'
import { logClubActivity } from '@/lib/activity-log'
import { getAppViewer } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/env'
import { membershipRoles } from '@/lib/membership-catalog'
import { ensureViewerCanManage } from '@/lib/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types'

interface MembershipRow {
  id: string
  user_id: string
  role: UserRole
  profiles:
    | {
        full_name: string
        email: string
      }[]
    | null
}

function getProfileFromMembership(row: MembershipRow) {
  return Array.isArray(row.profiles) ? row.profiles[0] : null
}

export async function getMembershipsForCurrentClub() {
  const viewer = await getAppViewer()

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      rows: [
        {
          id: 'demo-membership-1',
          userId: 'demo-user-1',
          fullName: viewer.user.fullName,
          email: viewer.user.email ?? 'admin@demo.ro',
          role: viewer.user.role,
        },
      ],
    }
  }

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('club_memberships')
    .select(
      `
        id,
        user_id,
        role,
        profiles(full_name, email)
      `
    )
    .eq('club_id', viewer.club.id)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return { rows: [] }
  }

  return {
    rows: (data as MembershipRow[]).map((row) => ({
      id: row.id,
      userId: row.user_id,
      fullName: getProfileFromMembership(row)?.full_name ?? '-',
      email: getProfileFromMembership(row)?.email ?? '-',
      role: row.role,
    })),
  }
}

export async function getMembershipByIdForCurrentClub(membershipId: string) {
  const memberships = await getMembershipsForCurrentClub()
  return memberships.rows.find((row) => row.id === membershipId) ?? null
}

export async function createMembershipForCurrentClub(input: {
  email: string
  role: UserRole
}) {
  const permission = await ensureViewerCanManage('memberships')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te cu rol de admin pentru a gestiona membership-urile.',
    }
  }

  const supabase = createSupabaseServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', input.email)
    .maybeSingle()

  if (!profile?.id) {
    return {
      ok: false,
      message:
        'Nu există încă un profil cu acest email. Utilizatorul trebuie să aibă cont creat în platformă.',
    }
  }

  const { error } = await supabase.from('club_memberships').insert({
    club_id: viewer.club.id,
    user_id: profile.id,
    role: input.role,
  })

  if (error) {
    return {
      ok: false,
      message:
        'Nu am putut adăuga membership-ul. Verifică dacă rolul există deja pentru acest utilizator.',
    }
  }

  revalidatePath('/clubs')
  await logClubActivity({
    area: 'memberships',
    action: 'create',
    entityLabel: input.email,
    details: `Utilizator adăugat în club cu rolul ${input.role}.`,
  })
  return { ok: true, message: 'Membership-ul a fost adăugat cu succes.' }
}

export async function updateMembershipForCurrentClub(input: {
  membershipId: string
  role: UserRole
}) {
  const permission = await ensureViewerCanManage('memberships')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te cu rol de admin pentru a actualiza membership-urile.',
    }
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('club_memberships')
    .update({ role: input.role })
    .eq('id', input.membershipId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message:
        'Nu am putut actualiza membership-ul. Verifică rolul curent și politicile RLS.',
    }
  }

  revalidatePath('/clubs')
  await logClubActivity({
    area: 'memberships',
    action: 'update',
    entityLabel: input.membershipId,
    details: `Rolul utilizatorului a fost schimbat în ${input.role}.`,
  })
  return { ok: true, message: 'Rolul utilizatorului a fost actualizat cu succes.' }
}

export async function deleteMembershipForCurrentClub(membershipId: string) {
  const permission = await ensureViewerCanManage('memberships')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te cu rol de admin pentru a șterge membership-uri.',
    }
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('club_memberships')
    .delete()
    .eq('id', membershipId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message:
        'Nu am putut șterge membership-ul. Verifică rolul curent și politicile RLS.',
    }
  }

  revalidatePath('/clubs')
  await logClubActivity({
    area: 'memberships',
    action: 'delete',
    entityLabel: membershipId,
    details: 'Membership eliminat din club.',
  })
  return { ok: true, message: 'Membership-ul a fost șters cu succes.' }
}
