import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { DataTable } from '@/components/DataTable'
import { StatisticForm } from '@/components/StatisticForm'
import { StatCard } from '@/components/StatCard'
import { deleteStatisticAction } from '@/app/(app)/statistics/actions'
import { getAppViewer } from '@/lib/auth'
import { isCoachLockedToCenter } from '@/lib/coach'
import { canManageResource } from '@/lib/permissions'
import {
  getStatisticEntryByIdForCurrentClub,
  getStatisticsForCurrentClub,
} from '@/lib/statistics'

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams?: { edit?: string }
}) {
  const viewer = await getAppViewer()
  if (isCoachLockedToCenter(viewer)) {
    redirect('/coach')
  }
  const canManageStatistics = canManageResource(viewer.user.role, 'statistics')
  const [statistics, existingStatistic] = await Promise.all([
    getStatisticsForCurrentClub(),
    canManageStatistics && searchParams?.edit
      ? getStatisticEntryByIdForCurrentClub(searchParams.edit)
      : Promise.resolve(null),
  ])

  return (
    <div className="space-y-5">
      {canManageStatistics ? (
        <StatisticForm
          players={statistics.players.map((player) => ({
            id: player.id,
            name: `${player.firstName} ${player.lastName}`,
          }))}
          matches={statistics.matches.map((match) => ({
            id: match.id,
            label: `${match.date} · ${match.opponent}`,
          }))}
          source={viewer.source}
          existingStatistic={existingStatistic}
        />
      ) : (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Acces limitat</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950">Statistici sportive</h1>
          <p className="mt-2 text-sm text-slate-500">
            Rolul tău poate consulta statisticile, dar nu poate adăuga, edita sau șterge înregistrări de meci.
          </p>
        </section>
      )}
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Top marcator"
          value={statistics.totals.topScorer?.name ?? '-'}
          description={`${statistics.totals.topScorer?.goals ?? 0} goluri`}
        />
        <StatCard
          title="Goluri totale"
          value={String(statistics.totals.totalGoals)}
          description="Pentru toți jucătorii monitorizați"
        />
        <StatCard
          title="Assisturi totale"
          value={String(statistics.totals.totalAssists)}
          description="Creativitate în sezonul curent"
        />
        <StatCard
          title="Minute jucate"
          value={String(statistics.totals.totalMinutes)}
          description="Volum cumulat de joc"
        />
      </section>

      <DataTable
        title={existingStatistic ? 'Înregistrări statistice cu editare' : 'Înregistrări statistice'}
        description="Fișe individuale de meci pentru jucători"
        columns={[
          { key: 'playerName', header: 'Jucător' },
          { key: 'opponent', header: 'Meci' },
          { key: 'goals', header: 'Goluri' },
          { key: 'assists', header: 'Assisturi' },
          { key: 'minutesPlayed', header: 'Minute' },
          { key: 'coachRating', header: 'Rating' },
          ...(canManageStatistics
            ? [
                {
                  key: 'actions',
                  header: 'Acțiuni',
                  render: (row: { id: string }) => (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/statistics?edit=${row.id}`}
                        className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
                      >
                        Editează
                      </Link>
                      <form action={deleteStatisticAction}>
                        <input type="hidden" name="statisticId" value={String(row.id)} />
                        <ConfirmSubmitButton
                          label="Șterge"
                          pendingLabel="Se șterge..."
                          confirmMessage="Sigur vrei să ștergi această statistică de meci?"
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        />
                      </form>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        rows={statistics.entries}
      />

      <DataTable
        title="Statistici sezon"
        description="Top marcatori, assisturi, minute jucate și disciplină"
        columns={[
          { key: 'name', header: 'Jucător' },
          { key: 'goals', header: 'Goluri' },
          { key: 'assists', header: 'Assisturi' },
          { key: 'minutesPlayed', header: 'Minute' },
          { key: 'yellowCards', header: 'Cartonașe' },
          { key: 'status', header: 'Status' },
        ]}
        rows={statistics.rows}
      />
    </div>
  )
}
