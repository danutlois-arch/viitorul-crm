'use server'

import { redirect } from 'next/navigation'
import { getActionRedirectUrl } from '@/lib/flash'
import { membershipRoles } from '@/lib/membership-catalog'
import {
  createMembershipForCurrentClub,
  deleteMembershipForCurrentClub,
  updateMembershipForCurrentClub,
} from '@/lib/memberships'
import type { UserRole } from '@/lib/types'

export interface MembershipFormState {
  error?: string
  success?: string
}

export async function createMembershipAction(
  _prevState: MembershipFormState,
  formData: FormData
): Promise<MembershipFormState> {
  const membershipId = String(formData.get('membershipId') ?? '').trim()
  const mode = String(formData.get('mode') ?? 'create').trim()
  const email = String(formData.get('email') ?? '').trim()
  const role = String(formData.get('role') ?? '').trim() as UserRole
  const assignedTeamId = String(formData.get('assignedTeamId') ?? '').trim() || null

  if (!membershipRoles.includes(role)) {
    return { error: 'Rolul selectat nu este valid pentru membership.' }
  }

  if (role === 'coach' && !assignedTeamId) {
    return { error: 'Alege grupa/echipa pe care o va gestiona antrenorul.' }
  }

  const result =
    mode === 'edit' && membershipId
      ? await updateMembershipForCurrentClub({
          membershipId,
          role,
          assignedTeamId,
        })
      : await createMembershipForCurrentClub({
          email,
          role,
          assignedTeamId,
        })

  return result.ok ? { success: result.message } : { error: result.message }
}

export async function deleteMembershipAction(formData: FormData) {
  const membershipId = String(formData.get('membershipId') ?? '').trim()

  if (!membershipId) {
    return
  }

  const result = await deleteMembershipForCurrentClub(membershipId)
  redirect(
    getActionRedirectUrl({
      fallbackPath: '/clubs',
      message: result.message,
      tone: result.ok ? 'success' : 'error',
      clearKeys: ['editMembership'],
    })
  )
}
