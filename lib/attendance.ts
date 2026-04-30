import { revalidatePath } from 'next/cache'
import { logClubActivity } from '@/lib/activity-log'
import { getAppViewer } from '@/lib/auth'
import { attendanceSessions as demoAttendance } from '@/lib/demo-data'
import { isSupabaseConfigured } from '@/lib/env'
import { ensureViewerCanManage } from '@/lib/permissions'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { AttendanceSession } from '@/lib/types'

interface SupabaseAttendanceRow {
  id: string
  team_id: string
  session_date: string
  session_hour: string
  location: string | null
  session_type: AttendanceSession['type']
}

function mapAttendanceRow(row: SupabaseAttendanceRow): AttendanceSession {
  return {
    id: row.id,
    teamId: row.team_id,
    date: row.session_date,
    hour: row.session_hour.slice(0, 5),
    location: row.location ?? '',
    type: row.session_type,
    attendanceRate: 0,
  }
}

export async function getAttendanceForCurrentClub() {
  const viewer = await getAppViewer()

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return demoAttendance
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select(
      `
        id,
        team_id,
        session_date,
        session_hour,
        location,
        session_type,
        attendance_records(status)
      `
    )
    .eq('club_id', viewer.club.id)
    .order('session_date', { ascending: false })

  if (error || !data) {
    return demoAttendance
  }

  return data.map((row) => {
    const mapped = mapAttendanceRow(row as unknown as SupabaseAttendanceRow)
    const records = (
      row as {
        attendance_records?: { status: string }[]
      }
    ).attendance_records
    const total = records?.length ?? 0
    const present = records?.filter((entry) => entry.status === 'prezent').length ?? 0
    return {
      ...mapped,
      attendanceRate: total ? Math.round((present / total) * 100) : 0,
    }
  })
}

export async function getAttendanceSessionByIdForCurrentClub(sessionId: string) {
  const sessions = await getAttendanceForCurrentClub()
  return sessions.find((session) => session.id === sessionId) ?? null
}

export async function createAttendanceSessionForCurrentClub(input: {
  teamId: string
  type: AttendanceSession['type']
  date: string
  hour: string
  location: string
}) {
  const permission = await ensureViewerCanManage('attendance')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a salva sesiuni reale de prezență.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('attendance_sessions').insert({
    club_id: viewer.club.id,
    team_id: input.teamId,
    session_date: input.date,
    session_hour: input.hour,
    location: input.location,
    session_type: input.type,
  })

  if (error) {
    return {
      ok: false,
      message: `Nu am putut salva sesiunea de prezență: ${error.message}`,
    }
  }

  revalidatePath('/attendance')
  await logClubActivity({
    area: 'attendance',
    action: 'create',
    entityLabel: `${input.date} ${input.hour}`,
    details: 'Sesiune nouă de prezență creată.',
  })

  return { ok: true, message: 'Sesiunea de prezență a fost creată cu succes.' }
}

export async function updateAttendanceSessionForCurrentClub(input: {
  sessionId: string
  teamId: string
  type: AttendanceSession['type']
  date: string
  hour: string
  location: string
}) {
  const permission = await ensureViewerCanManage('attendance')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a actualiza sesiuni reale de prezență.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('attendance_sessions')
    .update({
      team_id: input.teamId,
      session_date: input.date,
      session_hour: input.hour,
      location: input.location,
      session_type: input.type,
    })
    .eq('id', input.sessionId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message: `Nu am putut actualiza sesiunea de prezență: ${error.message}`,
    }
  }

  revalidatePath('/attendance')
  await logClubActivity({
    area: 'attendance',
    action: 'update',
    entityLabel: input.sessionId,
    details: 'Sesiunea de prezență a fost actualizată.',
  })
  return { ok: true, message: 'Sesiunea de prezență a fost actualizată cu succes.' }
}

export async function deleteAttendanceSessionForCurrentClub(sessionId: string) {
  const permission = await ensureViewerCanManage('attendance')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a șterge sesiuni reale de prezență.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('attendance_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message: `Nu am putut șterge sesiunea de prezență: ${error.message}`,
    }
  }

  revalidatePath('/attendance')
  await logClubActivity({
    area: 'attendance',
    action: 'delete',
    entityLabel: sessionId,
    details: 'Sesiune de prezență ștearsă.',
  })
  return { ok: true, message: 'Sesiunea de prezență a fost ștearsă cu succes.' }
}
