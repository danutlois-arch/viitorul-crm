import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { DataTable } from '@/components/DataTable'
import { StatCard } from '@/components/StatCard'
import { SuspensionForm } from '@/components/SuspensionForm'
import { deleteSuspensionAction } from '@/app/(app)/suspensions/actions'
import { getAppViewer } from '@/lib/auth'
import { isCoachLockedToCenter } from '@/lib/coach'
import { canManageResource } from '@/lib/permissions'
import {
  getSuspensionByIdForCurrentClub,
  getSuspensionDashboardForCurrentClub,
} from '@/lib/suspensions'

export default async function SuspensionsPage({
  searchParams,
}: {
  searchParams?: { edit?: string }
}) {
  const viewer = await getAppViewer()
  if (isCoachLockedToCenter(viewer)) {
    redirect('/coach')
  }
  const canManageSuspensions = canManageResource(viewer.user.role, 'suspensions')
  const [suspensions, existingSuspension] = await Promise.all([
    getSuspensionDashboardForCurrentClub(),
    canManageSuspensions && searchParams?.edit
      ? getSuspensionByIdForCurrentClub(searchParams.edit)
      : Promise.resolve(null),
  ])

  return (
    <div className="space-y-5">
      {canManageSuspensions ? (
        <SuspensionForm
          players={suspensions.players.map((player) => ({
            id: player.id,
            name: `${player.firstName} ${player.lastName}`,
          }))}
          matches={suspensions.matches.map((match) => ({
            id: match.id,
            label: `${match.date} · ${match.opponent}`,
          }))}
          source={viewer.source}
          existingSuspension={existingSuspension}
        />
      ) : (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Acces limitat</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950">Suspendări</h1>
          <p className="mt-2 text-sm text-slate-500">
            Rolul tău poate consulta registrul disciplinar, dar nu poate modifica suspendările.
          </p>
        </section>
      )}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Suspendări active"
          value={String(suspensions.summary.activeCount)}
          description="Jucători indisponibili disciplinar"
        />
        <StatCard
          title="Etape rămase"
          value={String(suspensions.summary.totalRemainingRounds)}
          description="Total etape de executat"
        />
        <StatCard
          title="Cazuri roșu direct"
          value={String(suspensions.summary.redCardCases)}
          description="Suspendări din cartonaș roșu"
        />
      </section>

      <DataTable
        title={existingSuspension ? 'Jucători suspendați cu editare' : 'Jucători suspendați'}
        description="Dashboard pentru indisponibilități disciplinare"
        columns={[
          { key: 'playerName', header: 'Jucător' },
          { key: 'matchOpponent', header: 'Meci' },
          { key: 'reason', header: 'Motiv' },
          { key: 'rounds', header: 'Etape total' },
          { key: 'remainingRounds', header: 'Etape rămase' },
          { key: 'status', header: 'Status' },
          ...(canManageSuspensions
            ? [
                {
                  key: 'actions',
                  header: 'Acțiuni',
                  render: (row: { id: string }) => (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/suspensions?edit=${row.id}`}
                        className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
                      >
                        Editează
                      </Link>
                      <form action={deleteSuspensionAction}>
                        <input type="hidden" name="suspensionId" value={String(row.id)} />
                        <ConfirmSubmitButton
                          label="Șterge"
                          pendingLabel="Se șterge..."
                          confirmMessage="Sigur vrei să ștergi această suspendare?"
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        />
                      </form>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        rows={suspensions.rows}
      />
    </div>
  )
}
