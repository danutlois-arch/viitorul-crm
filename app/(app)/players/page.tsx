import Link from 'next/link'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { DataTable } from '@/components/DataTable'
import { FilterToolbar } from '@/components/FilterToolbar'
import { ListControls } from '@/components/ListControls'
import { PlayerForm } from '@/components/PlayerForm'
import { deletePlayerAction } from '@/app/(app)/players/actions'
import { getAppViewer } from '@/lib/auth'
import { canManageResource } from '@/lib/permissions'
import {
  getPlayerByIdForCurrentClub,
  getPlayersForCurrentClub,
  getTeamsForCurrentClub,
} from '@/lib/players'
import { parsePositiveInt } from '@/lib/url-state'

export default async function PlayersPage({
  searchParams,
}: {
  searchParams?: {
    edit?: string
    q?: string
    teamId?: string
    status?: string
    position?: string
    sort?: string
    dir?: string
    page?: string
    pageSize?: string
  }
}) {
  const viewer = await getAppViewer()
  const canManagePlayers = canManageResource(viewer.user.role, 'players')
  const [teams, playerData, existingPlayer] = await Promise.all([
    getTeamsForCurrentClub(),
    getPlayersForCurrentClub(),
    canManagePlayers && searchParams?.edit
      ? getPlayerByIdForCurrentClub(searchParams.edit)
      : Promise.resolve(null),
  ])
  const query = searchParams?.q?.trim().toLowerCase() ?? ''
  const selectedTeamId = searchParams?.teamId?.trim() ?? ''
  const selectedStatus = searchParams?.status?.trim() ?? ''
  const selectedPosition = searchParams?.position?.trim() ?? ''
  const sort = searchParams?.sort?.trim() ?? 'name'
  const dir = searchParams?.dir === 'desc' ? 'desc' : 'asc'
  const pageSize = parsePositiveInt(searchParams?.pageSize, 10)
  const page = parsePositiveInt(searchParams?.page, 1)
  const filteredPlayers = playerData.rows.filter((player) => {
    const matchesQuery =
      !query ||
      player.name.toLowerCase().includes(query) ||
      player.team.toLowerCase().includes(query) ||
      player.position.toLowerCase().includes(query)
    const matchesTeam = !selectedTeamId || player.teamId === selectedTeamId
    const matchesStatus = !selectedStatus || player.status === selectedStatus
    const matchesPosition = !selectedPosition || player.position === selectedPosition

    return matchesQuery && matchesTeam && matchesStatus && matchesPosition
  })
  const sortedPlayers = [...filteredPlayers].sort((left, right) => {
    const direction = dir === 'asc' ? 1 : -1
    if (sort === 'age' || sort === 'goals') {
      return ((left[sort] as number) - (right[sort] as number)) * direction
    }
    const leftValue =
      sort === 'team'
        ? left.team
        : sort === 'position'
          ? left.position
          : sort === 'status'
            ? left.status
            : left.name
    const rightValue =
      sort === 'team'
        ? right.team
        : sort === 'position'
          ? right.position
          : sort === 'status'
            ? right.status
            : right.name

    return String(leftValue).localeCompare(String(rightValue), 'ro') * direction
  })
  const totalPlayers = sortedPlayers.length
  const start = (page - 1) * pageSize
  const paginatedPlayers = sortedPlayers.slice(start, start + pageSize)
  const positionOptions = Array.from(new Set(playerData.rows.map((player) => player.position))).map(
    (position) => ({ value: position, label: position })
  )

  return (
    <div className="space-y-5">
      {canManagePlayers ? (
        <PlayerForm teams={teams} source={viewer.source} existingPlayer={existingPlayer} />
      ) : (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Acces limitat</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950">Lot jucători</h1>
          <p className="mt-2 text-sm text-slate-500">
            Rolul tău poate consulta lotul, dar nu poate adăuga, edita sau șterge jucători.
          </p>
        </section>
      )}
      <FilterToolbar
        action="/players"
        preserveKeys={existingPlayer ? ['edit'] : []}
        values={{
          edit: searchParams?.edit,
          q: searchParams?.q,
          teamId: searchParams?.teamId,
          status: searchParams?.status,
          position: searchParams?.position,
        }}
        resultLabel={`${filteredPlayers.length} jucători afișați`}
        fields={[
          {
            name: 'q',
            label: 'Caută',
            placeholder: 'Nume, echipă sau poziție',
          },
          {
            name: 'teamId',
            label: 'Echipă',
            type: 'select',
            options: teams.map((team) => ({ value: team.id, label: team.name })),
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'activ', label: 'activ' },
              { value: 'accidentat', label: 'accidentat' },
              { value: 'suspendat', label: 'suspendat' },
              { value: 'transferat', label: 'transferat' },
              { value: 'retras', label: 'retras' },
            ],
          },
          {
            name: 'position',
            label: 'Poziție',
            type: 'select',
            options: positionOptions,
          },
        ]}
      />
      <ListControls
        action="/players"
        values={{
          edit: searchParams?.edit,
          q: searchParams?.q,
          teamId: searchParams?.teamId,
          status: searchParams?.status,
          position: searchParams?.position,
          sort: searchParams?.sort,
          dir: searchParams?.dir,
          page: searchParams?.page,
          pageSize: searchParams?.pageSize,
        }}
        sortOptions={[
          { value: 'name', label: 'Nume' },
          { value: 'team', label: 'Echipă' },
          { value: 'age', label: 'Vârstă' },
          { value: 'position', label: 'Poziție' },
          { value: 'status', label: 'Status' },
          { value: 'goals', label: 'Goluri' },
        ]}
        currentSort={sort}
        currentDirection={dir}
        currentPage={page}
        currentPageSize={pageSize}
        totalItems={totalPlayers}
      />
      <DataTable
        title={existingPlayer ? 'Lot jucători și editare' : 'Lot jucători'}
        description={
          viewer.source === 'supabase'
            ? 'Date live din Supabase, filtrate automat pentru clubul autentificat'
            : 'Date demo pentru seniori, juniori și academie'
        }
        columns={[
          { key: 'name', header: 'Nume' },
          { key: 'team', header: 'Echipă' },
          { key: 'age', header: 'Vârstă' },
          { key: 'position', header: 'Poziție' },
          { key: 'status', header: 'Status' },
          { key: 'goals', header: 'Goluri' },
          ...(canManagePlayers
            ? [
                {
                  key: 'actions',
                  header: 'Acțiuni',
                  render: (row: { id: string }) => (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/players?edit=${row.id}`}
                        className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
                      >
                        Editează
                      </Link>
                      <form action={deletePlayerAction}>
                        <input type="hidden" name="playerId" value={String(row.id)} />
                        <ConfirmSubmitButton
                          label="Șterge"
                          pendingLabel="Se șterge..."
                          confirmMessage="Sigur vrei să ștergi acest jucător? Acțiunea poate afecta plăți, statistici și suspendări asociate."
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        />
                      </form>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        rows={paginatedPlayers}
      />
    </div>
  )
}
