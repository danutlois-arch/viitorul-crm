import Link from 'next/link'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { DataTable } from '@/components/DataTable'
import { FilterToolbar } from '@/components/FilterToolbar'
import { ListControls } from '@/components/ListControls'
import { TeamForm } from '@/components/TeamForm'
import { deleteTeamAction } from '@/app/(app)/teams/actions'
import { getAppViewer } from '@/lib/auth'
import { canManageResource } from '@/lib/permissions'
import {
  getTeamByIdForCurrentClub,
  getTeamCatalogs,
  getTeamsForCurrentClubLive,
} from '@/lib/teams'
import { parsePositiveInt } from '@/lib/url-state'

export default async function TeamsPage({
  searchParams,
}: {
  searchParams?: {
    edit?: string
    q?: string
    category?: string
    competition?: string
    sort?: string
    dir?: string
    page?: string
    pageSize?: string
  }
}) {
  const viewer = await getAppViewer()
  const canManageTeams = canManageResource(viewer.user.role, 'teams')
  const [catalogs, teams, existingTeam] = await Promise.all([
    getTeamCatalogs(),
    getTeamsForCurrentClubLive(),
    canManageTeams && searchParams?.edit
      ? getTeamByIdForCurrentClub(searchParams.edit)
      : Promise.resolve(null),
  ])
  const query = searchParams?.q?.trim().toLowerCase() ?? ''
  const selectedCategory = searchParams?.category?.trim() ?? ''
  const selectedCompetition = searchParams?.competition?.trim() ?? ''
  const sort = searchParams?.sort?.trim() ?? 'name'
  const dir = searchParams?.dir === 'desc' ? 'desc' : 'asc'
  const pageSize = parsePositiveInt(searchParams?.pageSize, 10)
  const page = parsePositiveInt(searchParams?.page, 1)
  const filteredTeams = teams.filter((team) => {
    const matchesQuery =
      !query ||
      team.name.toLowerCase().includes(query) ||
      team.headCoach.toLowerCase().includes(query) ||
      team.teamManager.toLowerCase().includes(query)
    const matchesCategory = !selectedCategory || team.category === selectedCategory
    const matchesCompetition =
      !selectedCompetition || team.competition === selectedCompetition

    return matchesQuery && matchesCategory && matchesCompetition
  })
  const sortedTeams = [...filteredTeams].sort((left, right) => {
    const direction = dir === 'asc' ? 1 : -1
    const leftValue =
      sort === 'category'
        ? left.category
        : sort === 'competition'
          ? left.competition
          : sort === 'season'
            ? left.season
            : sort === 'headCoach'
              ? left.headCoach
              : left.name
    const rightValue =
      sort === 'category'
        ? right.category
        : sort === 'competition'
          ? right.competition
          : sort === 'season'
            ? right.season
            : sort === 'headCoach'
              ? right.headCoach
              : right.name

    return String(leftValue).localeCompare(String(rightValue), 'ro') * direction
  })
  const totalTeams = sortedTeams.length
  const start = (page - 1) * pageSize
  const paginatedTeams = sortedTeams.slice(start, start + pageSize)

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-dashed border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="text-xs uppercase tracking-[0.22em] text-amber-700">Diagnostic Teams</p>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          <p>
            <span className="font-semibold">source:</span> {viewer.source}
          </p>
          <p>
            <span className="font-semibold">role:</span> {viewer.user.role}
          </p>
          <p>
            <span className="font-semibold">clubId:</span> {viewer.club.id}
          </p>
          <p>
            <span className="font-semibold">email:</span> {viewer.user.email ?? '-'}
          </p>
        </div>
      </section>
      {canManageTeams ? (
        <TeamForm
          categories={catalogs.categories}
          competitions={catalogs.competitions}
          source={viewer.source}
          existingTeam={existingTeam}
        />
      ) : (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Acces limitat</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950">Echipe și grupe</h1>
          <p className="mt-2 text-sm text-slate-500">
            Rolul tău poate consulta echipele clubului, dar nu poate modifica structura lor.
          </p>
        </section>
      )}
      <FilterToolbar
        action="/teams"
        preserveKeys={existingTeam ? ['edit'] : []}
        values={{
          edit: searchParams?.edit,
          q: searchParams?.q,
          category: searchParams?.category,
          competition: searchParams?.competition,
        }}
        resultLabel={`${filteredTeams.length} echipe afișate`}
        fields={[
          {
            name: 'q',
            label: 'Caută',
            placeholder: 'Nume echipă, antrenor sau team manager',
          },
          {
            name: 'category',
            label: 'Categorie',
            type: 'select',
            options: catalogs.categories.map((item) => ({ value: item, label: item })),
          },
          {
            name: 'competition',
            label: 'Competiție',
            type: 'select',
            options: catalogs.competitions.map((item) => ({ value: item, label: item })),
          },
        ]}
      />
      <ListControls
        action="/teams"
        values={{
          edit: searchParams?.edit,
          q: searchParams?.q,
          category: searchParams?.category,
          competition: searchParams?.competition,
          sort: searchParams?.sort,
          dir: searchParams?.dir,
          page: searchParams?.page,
          pageSize: searchParams?.pageSize,
        }}
        sortOptions={[
          { value: 'name', label: 'Nume echipă' },
          { value: 'category', label: 'Categorie' },
          { value: 'competition', label: 'Competiție' },
          { value: 'season', label: 'Sezon' },
          { value: 'headCoach', label: 'Antrenor principal' },
        ]}
        currentSort={sort}
        currentDirection={dir}
        currentPage={page}
        currentPageSize={pageSize}
        totalItems={totalTeams}
      />
      <DataTable
        title={existingTeam ? 'Echipe și grupe cu editare' : 'Echipe și grupe'}
        description={
          viewer.source === 'supabase'
            ? 'Date live din Supabase pentru clubul autentificat'
            : 'Categorii FRF, juniori și academie din demo data'
        }
        columns={[
          { key: 'name', header: 'Nume echipă' },
          { key: 'category', header: 'Categorie' },
          { key: 'competition', header: 'Competiție' },
          { key: 'season', header: 'Sezon' },
          { key: 'headCoach', header: 'Antrenor principal' },
          ...(canManageTeams
            ? [
                {
                  key: 'actions',
                  header: 'Acțiuni',
                  render: (row: { id: string }) => (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/teams?edit=${row.id}`}
                        className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
                      >
                        Editează
                      </Link>
                      <form action={deleteTeamAction}>
                        <input type="hidden" name="teamId" value={String(row.id)} />
                        <ConfirmSubmitButton
                          label="Șterge"
                          pendingLabel="Se șterge..."
                          confirmMessage="Sigur vrei să ștergi această echipă? Dacă există jucători sau meciuri asociate, acțiunea poate eșua."
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        />
                      </form>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        rows={paginatedTeams}
      />
    </div>
  )
}
