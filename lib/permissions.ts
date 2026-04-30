import { getAppViewer } from '@/lib/auth'
import type { UserRole } from '@/lib/types'

export type PermissionResource =
  | 'club_settings'
  | 'memberships'
  | 'teams'
  | 'players'
  | 'payments'
  | 'contributions'
  | 'attendance'
  | 'matches'
  | 'statistics'
  | 'suspensions'

export type PermissionAction = 'read' | 'manage'

const manageMatrix: Record<PermissionResource, UserRole[]> = {
  club_settings: ['super_admin', 'club_admin'],
  memberships: ['super_admin', 'club_admin'],
  teams: ['super_admin', 'club_admin', 'sporting_director', 'team_manager'],
  players: ['super_admin', 'club_admin', 'sporting_director', 'coach', 'team_manager'],
  payments: ['super_admin', 'club_admin', 'team_manager'],
  contributions: ['super_admin', 'club_admin', 'team_manager'],
  attendance: ['super_admin', 'club_admin', 'coach', 'team_manager'],
  matches: ['super_admin', 'club_admin', 'sporting_director', 'coach', 'team_manager'],
  statistics: ['super_admin', 'club_admin', 'sporting_director', 'coach', 'team_manager'],
  suspensions: ['super_admin', 'club_admin', 'sporting_director', 'coach', 'team_manager'],
}

const resourceLabels: Record<PermissionResource, string> = {
  club_settings: 'setările clubului',
  memberships: 'rolurile și utilizatorii clubului',
  teams: 'echipele clubului',
  players: 'jucătorii clubului',
  payments: 'plățile jucătorilor',
  contributions: 'donațiile și sponsorizările',
  attendance: 'prezența',
  matches: 'meciurile',
  statistics: 'statisticile sportive',
  suspensions: 'suspendările',
}

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  club_admin: 'Admin Club',
  sporting_director: 'Director Sportiv',
  coach: 'Antrenor',
  team_manager: 'Team Manager',
  parent: 'Părinte',
  player: 'Jucător',
}

export function canManageResource(role: UserRole, resource: PermissionResource) {
  return manageMatrix[resource].includes(role)
}

export async function ensureViewerCanManage(resource: PermissionResource) {
  const viewer = await getAppViewer()

  if (viewer.source !== 'supabase' || !viewer.user.id) {
    return {
      ok: false as const,
      viewer,
      message:
        'Contul autentificat nu are încă acces operațional complet în club. Verifică profilul, membership-ul și conexiunea live la Supabase.',
    }
  }

  if (canManageResource(viewer.user.role, resource)) {
    return { ok: true as const, viewer }
  }

  return {
    ok: false as const,
    viewer,
    message: `${roleLabels[viewer.user.role]} are acces doar de citire pentru ${resourceLabels[resource]}.`,
  }
}

export function getRoleCapabilityRows(role: UserRole) {
  return Object.entries(resourceLabels).map(([resource, label]) => ({
    resource,
    label,
    canManage: canManageResource(role, resource as PermissionResource),
  }))
}
