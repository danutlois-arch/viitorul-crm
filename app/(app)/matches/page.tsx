import Link from 'next/link'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { DataTable } from '@/components/DataTable'
import { FilterToolbar } from '@/components/FilterToolbar'
import { ListControls } from '@/components/ListControls'
import { MatchForm } from '@/components/MatchForm'
import { deleteMatchAction } from '@/app/(app)/matches/actions'
import { getAppViewer } from '@/lib/auth'
import { canManageResource } from '@/lib/permissions'
import {
  getMatchByIdForCurrentClub,
  getMatchCompetitions,
  getMatchesForCurrentClub,
} from '@/lib/matches'
import { getTeamsForCurrentClubLive } from '@/lib/teams'
import { parsePositiveInt } from '@/lib/url-state'

export default async function MatchesPage({
  searchParams,
}: {
  searchParams?: {
    edit?: string
    q?: string
    teamId?: string
    competition?: string
    status?: string
    sort?: string
    dir?: string
    page?: string
    pageSize?: string
  }
}) {
  const viewer = await getAppViewer()
  const canManageMatches = canManageResource(viewer.user.role, 'matches')
  const [teams, matches, competitions, existingMatch] = await Promise.all([
    getTeamsForCurrentClubLive(),
    getMatchesForCurrentClub(),
    Promise.resolve(getMatchCompetitions()),
    canManageMatches && searchParams?.edit
      ? getMatchByIdForCurrentClub(searchParams.edit)
      : Promise.resolve(null),
  ])
  const query = searchParams?.q?.trim().toLowerCase() ?? ''
  const selectedTeamId = searchParams?.teamId?.trim() ?? ''
  const selectedCompetition = searchParams?.competition?.trim() ?? ''
  const selectedStatus = searchParams?.status?.trim() ?? ''
  const sort = searchParams?.sort?.trim() ?? 'date'
  const dir = searchParams?.dir === 'asc' ? 'asc' : 'desc'
  const pageSize = parsePositiveInt(searchParams?.pageSize, 10)
  const page = parsePositiveInt(searchParams?.page, 1)
  const filteredMatches = matches.filter((match) => {
    const teamName =
      teams.find((team) => team.id === match.teamId)?.name.toLowerCase() ?? ''
    const matchesQuery =
      !query ||
      match.opponent.toLowerCase().includes(query) ||
      match.location.toLowerCase().includes(query) ||
      match.round.toLowerCase().includes(query) ||
      teamName.includes(query)
    const matchesTeam = !selectedTeamId || match.teamId === selectedTeamId
    const matchesCompetition =
      !selectedCompetition || match.competition === selectedCompetition
    const matchesStatus = !selectedStatus || match.status === selectedStatus

    return matchesQuery && matchesTeam && matchesCompetition && matchesStatus
  })
  const sortedMatches = [...filteredMatches].sort((left, right) => {
    const direction = dir === 'asc' ? 1 : -1

    if (sort === 'date') {
      const leftValue = `${left.date}T${left.hour}`
      const rightValue = `${right.date}T${right.hour}`
      return leftValue.localeCompare(rightValue) * direction
    }

    const leftValue =
      sort === 'team'
        ? teams.find((team) => team.id === left.teamId)?.name ?? ''
        : sort === 'competition'
          ? left.competition
          : sort === 'status'
            ? left.status
            : left.opponent
    const rightValue =
      sort === 'team'
        ? teams.find((team) => team.id === right.teamId)?.name ?? ''
        : sort === 'competition'
          ? right.competition
          : sort === 'status'
            ? right.status
            : right.opponent

    return String(leftValue).localeCompare(String(rightValue), 'ro') * direction
  })
  const totalMatches = sortedMatches.length
  const start = (page - 1) * pageSize
  const paginatedMatches = sortedMatches.slice(start, start + pageSize)

  return (
    <div className="space-y-5">
      {canManageMatches ? (
        <MatchForm
          teams={teams}
          competitions={competitions}
          source={viewer.source}
          existingMatch={existingMatch}
        />
      ) : (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Acces limitat</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950">Calendar meciuri</h1>
          <p className="mt-2 text-sm text-slate-500">
            Rolul tău poate consulta calendarul și rezultatele, dar nu poate modifica meciurile.
          </p>
        </section>
      )}
      <FilterToolbar
        action="/matches"
        preserveKeys={existingMatch ? ['edit'] : []}
        values={{
          edit: searchParams?.edit,
          q: searchParams?.q,
          teamId: searchParams?.teamId,
          competition: searchParams?.competition,
          status: searchParams?.status,
        }}
        resultLabel={`${filteredMatches.length} meciuri afișate`}
        fields={[
          {
            name: 'q',
            label: 'Caută',
            placeholder: 'Adversar, locație, etapă sau echipă',
          },
          {
            name: 'teamId',
            label: 'Echipă',
            type: 'select',
            options: teams.map((team) => ({ value: team.id, label: team.name })),
          },
          {
            name: 'competition',
            label: 'Competiție',
            type: 'select',
            options: competitions.map((item) => ({ value: item, label: item })),
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'programat', label: 'programat' },
              { value: 'jucat', label: 'jucat' },
              { value: 'amanat', label: 'amânat' },
              { value: 'anulat', label: 'anulat' },
            ],
          },
        ]}
      />
      <ListControls
        action="/matches"
        values={{
          edit: searchParams?.edit,
          q: searchParams?.q,
          teamId: searchParams?.teamId,
          competition: searchParams?.competition,
          status: searchParams?.status,
          sort: searchParams?.sort,
          dir: searchParams?.dir,
          page: searchParams?.page,
          pageSize: searchParams?.pageSize,
        }}
        sortOptions={[
          { value: 'date', label: 'Dată și oră' },
          { value: 'opponent', label: 'Adversar' },
          { value: 'team', label: 'Echipă' },
          { value: 'competition', label: 'Competiție' },
          { value: 'status', label: 'Status' },
        ]}
        currentSort={sort}
        currentDirection={dir}
        currentPage={page}
        currentPageSize={pageSize}
        totalItems={totalMatches}
      />
      <DataTable
        title={existingMatch ? 'Meciuri oficiale și amicale cu editare' : 'Meciuri oficiale și amicale'}
        description={
          viewer.source === 'supabase'
            ? 'Date live din Supabase pentru calendarul competițional al clubului'
            : 'Date demo pentru calendarul competițional'
        }
        columns={[
          {
            key: 'teamId',
            header: 'Echipă',
            render: (row) => teams.find((team) => team.id === row.teamId)?.name ?? '-',
          },
          { key: 'competition', header: 'Competiție' },
          { key: 'opponent', header: 'Adversar' },
          { key: 'date', header: 'Data' },
          { key: 'venueType', header: 'Loc' },
          { key: 'status', header: 'Status' },
          ...(canManageMatches
            ? [
                {
                  key: 'actions',
                  header: 'Acțiuni',
                  render: (row: { id: string }) => (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/matches?edit=${row.id}`}
                        className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
                      >
                        Editează
                      </Link>
                      <form action={deleteMatchAction}>
                        <input type="hidden" name="matchId" value={String(row.id)} />
                        <ConfirmSubmitButton
                          label="Șterge"
                          pendingLabel="Se șterge..."
                          confirmMessage="Sigur vrei să ștergi acest meci? Dacă există statistici sau lot asociat, ștergerea poate fi blocată."
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        />
                      </form>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        rows={paginatedMatches}
      />
    </div>
  )
}
