import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { AttendanceForm } from '@/components/AttendanceForm'
import { DataTable } from '@/components/DataTable'
import { FilterToolbar } from '@/components/FilterToolbar'
import { ListControls } from '@/components/ListControls'
import { deleteAttendanceAction } from '@/app/(app)/attendance/actions'
import {
  getAttendanceForCurrentClub,
  getAttendanceSessionByIdForCurrentClub,
} from '@/lib/attendance'
import { getAppViewer } from '@/lib/auth'
import { isCoachLockedToCenter } from '@/lib/coach'
import { canManageResource } from '@/lib/permissions'
import { getTeamsForCurrentClubLive } from '@/lib/teams'
import { parsePositiveInt } from '@/lib/url-state'

export default async function AttendancePage({
  searchParams,
}: {
  searchParams?: {
    q?: string
    teamId?: string
    type?: string
    sort?: string
    dir?: string
    page?: string
    pageSize?: string
    edit?: string
  }
}) {
  const viewer = await getAppViewer()
  if (isCoachLockedToCenter(viewer)) {
    redirect('/coach')
  }
  const canManageAttendance = canManageResource(viewer.user.role, 'attendance')
  const [teams, attendanceSessions, existingAttendance] = await Promise.all([
    getTeamsForCurrentClubLive(),
    getAttendanceForCurrentClub(),
    canManageAttendance && searchParams?.edit
      ? getAttendanceSessionByIdForCurrentClub(searchParams.edit)
      : Promise.resolve(null),
  ])
  const query = searchParams?.q?.trim().toLowerCase() ?? ''
  const selectedTeamId = searchParams?.teamId?.trim() ?? ''
  const selectedType = searchParams?.type?.trim() ?? ''
  const sort = searchParams?.sort?.trim() ?? 'date'
  const dir = searchParams?.dir === 'asc' ? 'asc' : 'desc'
  const pageSize = parsePositiveInt(searchParams?.pageSize, 10)
  const page = parsePositiveInt(searchParams?.page, 1)
  const rows = attendanceSessions.map((session) => ({
    ...session,
    teamName: teams.find((team) => team.id === session.teamId)?.name ?? '-',
  }))
  const filteredAttendance = rows.filter((session) => {
    const matchesQuery =
      !query ||
      session.teamName.toLowerCase().includes(query) ||
      session.location.toLowerCase().includes(query) ||
      session.type.toLowerCase().includes(query)
    const matchesTeam = !selectedTeamId || session.teamId === selectedTeamId
    const matchesType = !selectedType || session.type === selectedType

    return matchesQuery && matchesTeam && matchesType
  })
  const sortedAttendance = [...filteredAttendance].sort((left, right) => {
    const direction = dir === 'asc' ? 1 : -1
    if (sort === 'attendanceRate') {
      return (left.attendanceRate - right.attendanceRate) * direction
    }

    const leftValue =
      sort === 'team'
        ? left.teamName
        : sort === 'type'
          ? left.type
          : sort === 'location'
            ? left.location
            : `${left.date}T${left.hour}`
    const rightValue =
      sort === 'team'
        ? right.teamName
        : sort === 'type'
          ? right.type
          : sort === 'location'
            ? right.location
            : `${right.date}T${right.hour}`

    return String(leftValue).localeCompare(String(rightValue), 'ro') * direction
  })
  const totalAttendance = sortedAttendance.length
  const start = (page - 1) * pageSize
  const paginatedAttendance = sortedAttendance.slice(start, start + pageSize)
  const typeOptions = Array.from(new Set(rows.map((session) => session.type))).map((type) => ({
    value: type,
    label: type.replaceAll('_', ' '),
  }))

  return (
    <div className="space-y-5">
      {canManageAttendance ? (
        <AttendanceForm
          teams={teams}
          source={viewer.source}
          existingAttendance={existingAttendance}
        />
      ) : (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Acces limitat</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950">Prezență</h1>
          <p className="mt-2 text-sm text-slate-500">
            Rolul tău poate consulta prezența, dar nu poate crea sau edita sesiuni.
          </p>
        </section>
      )}
      <FilterToolbar
        action="/attendance"
        values={{
          q: searchParams?.q,
          teamId: searchParams?.teamId,
          type: searchParams?.type,
        }}
        resultLabel={`${filteredAttendance.length} sesiuni afișate`}
        fields={[
          {
            name: 'q',
            label: 'Caută',
            placeholder: 'Echipă, locație sau tip sesiune',
          },
          {
            name: 'teamId',
            label: 'Echipă',
            type: 'select',
            options: teams.map((team) => ({ value: team.id, label: team.name })),
          },
          {
            name: 'type',
            label: 'Tip sesiune',
            type: 'select',
            options: typeOptions,
          },
        ]}
      />
      <ListControls
        action="/attendance"
        values={{
          q: searchParams?.q,
          teamId: searchParams?.teamId,
          type: searchParams?.type,
          sort: searchParams?.sort,
          dir: searchParams?.dir,
          page: searchParams?.page,
          pageSize: searchParams?.pageSize,
        }}
        sortOptions={[
          { value: 'date', label: 'Dată și oră' },
          { value: 'team', label: 'Echipă' },
          { value: 'type', label: 'Tip sesiune' },
          { value: 'location', label: 'Locație' },
          { value: 'attendanceRate', label: 'Prezență' },
        ]}
        currentSort={sort}
        currentDirection={dir}
        currentPage={page}
        currentPageSize={pageSize}
        totalItems={totalAttendance}
      />
      <DataTable
        title="Prezență antrenamente"
        description={
          viewer.source === 'supabase'
            ? 'Date live din Supabase pentru sesiunile de pregătire'
            : 'Date demo pentru sesiunile de pregătire'
        }
        columns={[
          {
            key: 'teamId',
            header: 'Echipă',
            render: (row) => row.teamName,
          },
          { key: 'type', header: 'Tip' },
          { key: 'date', header: 'Data' },
          { key: 'hour', header: 'Ora' },
          { key: 'location', header: 'Locație' },
          { key: 'attendanceRate', header: 'Prezență', render: (row) => `${row.attendanceRate}%` },
          ...(canManageAttendance
            ? [
                {
                  key: 'actions',
                  header: 'Acțiuni',
                  render: (row: { id: string }) => (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/attendance?edit=${row.id}`}
                        className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
                      >
                        Editează
                      </Link>
                      <form action={deleteAttendanceAction}>
                        <input type="hidden" name="sessionId" value={String(row.id)} />
                        <ConfirmSubmitButton
                          label="Șterge"
                          pendingLabel="Se șterge..."
                          confirmMessage="Sigur vrei să ștergi această sesiune de prezență?"
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        />
                      </form>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        rows={paginatedAttendance}
      />
    </div>
  )
}
