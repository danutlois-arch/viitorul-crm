import Link from 'next/link'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { ContributionStatusBadge } from '@/components/ContributionStatusBadge'
import { DataTable } from '@/components/DataTable'
import { ContributionForm } from '@/components/ContributionForm'
import { FilterToolbar } from '@/components/FilterToolbar'
import { ListControls } from '@/components/ListControls'
import { PaymentForm } from '@/components/PaymentForm'
import { PaymentStatusBadge } from '@/components/PaymentStatusBadge'
import { SegmentedTabs } from '@/components/SegmentedTabs'
import { StatCard } from '@/components/StatCard'
import { deletePaymentAction } from '@/app/(app)/payments/actions'
import { getAppViewer } from '@/lib/auth'
import { canManageResource } from '@/lib/permissions'
import {
  getContributionBySessionOrId,
  getPaymentByIdForCurrentClub,
  getPaymentsForCurrentClub,
} from '@/lib/payments'
import { parsePositiveInt } from '@/lib/url-state'
import { formatCurrency } from '@/lib/utils'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams?: {
    contribution?: string
    session_id?: string
    contribution_id?: string
    editPayment?: string
    q?: string
    playerId?: string
    status?: string
    month?: string
    sort?: string
    dir?: string
    page?: string
    pageSize?: string
    view?: string
  }
}) {
  const viewer = await getAppViewer()
  const canManagePayments = canManageResource(viewer.user.role, 'payments')
  const canManageContributions = canManageResource(viewer.user.role, 'contributions')
  const [paymentData, contributionContext, existingPayment] = await Promise.all([
    getPaymentsForCurrentClub(),
    getContributionBySessionOrId({
      sessionId: searchParams?.session_id,
      contributionId: searchParams?.contribution_id,
    }),
    canManagePayments && searchParams?.editPayment
      ? getPaymentByIdForCurrentClub(searchParams.editPayment)
      : Promise.resolve(null),
  ])
  const query = searchParams?.q?.trim().toLowerCase() ?? ''
  const selectedPlayerId = searchParams?.playerId?.trim() ?? ''
  const selectedStatus = searchParams?.status?.trim() ?? ''
  const selectedMonth = searchParams?.month?.trim() ?? ''
  const sort = searchParams?.sort?.trim() ?? 'year'
  const dir = searchParams?.dir === 'asc' ? 'asc' : 'desc'
  const pageSize = parsePositiveInt(searchParams?.pageSize, 10)
  const page = parsePositiveInt(searchParams?.page, 1)
  const currentView = searchParams?.view === 'contributions' ? 'contributions' : 'fees'
  const filteredPaymentRows = paymentData.rows.filter((payment) => {
    const matchesQuery =
      !query ||
      payment.playerName.toLowerCase().includes(query) ||
      payment.notes.toLowerCase().includes(query)
    const matchesPlayer = !selectedPlayerId || payment.playerId === selectedPlayerId
    const matchesStatus = !selectedStatus || payment.status === selectedStatus
    const matchesMonth = !selectedMonth || payment.month === selectedMonth

    return matchesQuery && matchesPlayer && matchesStatus && matchesMonth
  })
  const sortedPaymentRows = [...filteredPaymentRows].sort((left, right) => {
    const direction = dir === 'asc' ? 1 : -1
    if (sort === 'dueAmount' || sort === 'paidAmount' || sort === 'year') {
      return ((left[sort] as number) - (right[sort] as number)) * direction
    }
    const leftValue =
      sort === 'status'
        ? left.status
        : sort === 'month'
          ? left.month
          : sort === 'method'
            ? left.method
            : left.playerName
    const rightValue =
      sort === 'status'
        ? right.status
        : sort === 'month'
          ? right.month
          : sort === 'method'
            ? right.method
            : right.playerName

    return String(leftValue).localeCompare(String(rightValue), 'ro') * direction
  })
  const totalPayments = sortedPaymentRows.length
  const start = (page - 1) * pageSize
  const paginatedPaymentRows = sortedPaymentRows.slice(start, start + pageSize)

  return (
    <div className="space-y-5">
      {searchParams?.contribution === 'success' ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800 shadow-card">
          <p className="font-semibold">Plata Stripe a fost finalizată.</p>
          <p className="mt-1">
            {contributionContext
              ? `${contributionContext.contributorName} · ${formatCurrency(
                  contributionContext.amount
                )} · status CRM: ${contributionContext.status}.`
              : 'Contribuția va apărea ca plătită după confirmarea webhook-ului.'}
          </p>
        </section>
      ) : null}

      {searchParams?.contribution === 'cancelled' ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-card">
          <p className="font-semibold">Plata Stripe a fost anulată înainte de finalizare.</p>
          <p className="mt-1">
            {contributionContext
              ? `${contributionContext.contributorName} · ${formatCurrency(
                  contributionContext.amount
                )} · poți retrimite contribuția oricând.`
              : 'Poți retrimite contribuția oricând.'}
          </p>
        </section>
      ) : null}

      {canManagePayments ? (
        <PaymentForm
          players={paymentData.players}
          source={viewer.source}
          existingPayment={existingPayment}
        />
      ) : (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Acces limitat</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950">Taxe și contribuții</h1>
          <p className="mt-2 text-sm text-slate-500">
            Rolul tău poate consulta situația financiară, dar nu poate înregistra sau modifica plăți.
          </p>
        </section>
      )}
      <SegmentedTabs
        action="/payments"
        paramName="view"
        currentValue={currentView}
        values={{
          contribution: searchParams?.contribution,
          session_id: searchParams?.session_id,
          contribution_id: searchParams?.contribution_id,
          editPayment: searchParams?.editPayment,
          q: searchParams?.q,
          playerId: searchParams?.playerId,
          status: searchParams?.status,
          month: searchParams?.month,
          sort: searchParams?.sort,
          dir: searchParams?.dir,
          page: searchParams?.page,
          pageSize: searchParams?.pageSize,
          view: searchParams?.view,
        }}
        segments={[
          { value: 'fees', label: 'Taxe jucători' },
          { value: 'contributions', label: 'Donații și sponsorizări' },
        ]}
      />
      {currentView === 'fees' ? (
        <>
      <FilterToolbar
        action="/payments"
        preserveKeys={existingPayment ? ['editPayment'] : []}
        values={{
          editPayment: searchParams?.editPayment,
          q: searchParams?.q,
          playerId: searchParams?.playerId,
          status: searchParams?.status,
          month: searchParams?.month,
        }}
        resultLabel={`${filteredPaymentRows.length} plăți afișate`}
        fields={[
          {
            name: 'q',
            label: 'Caută',
            placeholder: 'Jucător sau observații financiare',
          },
          {
            name: 'playerId',
            label: 'Jucător',
            type: 'select',
            options: paymentData.players.map((player) => ({
              value: player.id,
              label: `${player.firstName} ${player.lastName}`,
            })),
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'platit', label: 'plătit' },
              { value: 'partial', label: 'parțial' },
              { value: 'restant', label: 'restant' },
              { value: 'scutit', label: 'scutit' },
            ],
          },
          {
            name: 'month',
            label: 'Lună',
            type: 'select',
            options: Array.from(new Set(paymentData.rows.map((payment) => payment.month))).map(
              (month) => ({ value: month, label: month })
            ),
          },
        ]}
      />
      <ListControls
        action="/payments"
        values={{
          editPayment: searchParams?.editPayment,
          q: searchParams?.q,
          playerId: searchParams?.playerId,
          status: searchParams?.status,
          month: searchParams?.month,
          sort: searchParams?.sort,
          dir: searchParams?.dir,
          page: searchParams?.page,
          pageSize: searchParams?.pageSize,
          view: searchParams?.view,
        }}
        sortOptions={[
          { value: 'year', label: 'An' },
          { value: 'playerName', label: 'Jucător' },
          { value: 'month', label: 'Lună' },
          { value: 'status', label: 'Status' },
          { value: 'dueAmount', label: 'Sumă datorată' },
          { value: 'paidAmount', label: 'Sumă plătită' },
          { value: 'method', label: 'Metodă plată' },
        ]}
        currentSort={sort}
        currentDirection={dir}
        currentPage={page}
        currentPageSize={pageSize}
        totalItems={totalPayments}
      />
        </>
      ) : null}
      {currentView === 'contributions' && canManageContributions ? (
        <ContributionForm source={viewer.source} />
      ) : null}

      <section className="grid gap-4 md:grid-cols-5">
        <StatCard
          title="Total încasat"
          value={formatCurrency(paymentData.summary.totalCollected)}
          description="Toate încasările vizibile pentru club"
        />
        <StatCard
          title="Total restant"
          value={formatCurrency(paymentData.summary.totalOutstanding)}
          description="Sume neachitate"
        />
        <StatCard
          title="Restanțieri"
          value={String(paymentData.summary.debtors)}
          description="Jucători cu sold deschis"
        />
        <StatCard
          title="Donații și sponsorizări"
          value={formatCurrency(paymentData.summary.onlineContributionTotal)}
          description="Contribuții externe confirmate"
        />
        <StatCard
          title="Contribuții în așteptare"
          value={String(paymentData.summary.pendingContributions)}
          description="Linkuri online sau sponsorizări neconfirmate"
        />
      </section>

      {currentView === 'fees' ? (
      <DataTable
        title={existingPayment ? 'Situație taxe cu editare' : 'Situație taxe'}
        description={
          viewer.source === 'supabase'
            ? 'Date live din Supabase, pregătite pentru export și integrare contabilă'
            : 'Date demo pentru export Excel și integrare contabilă'
        }
        columns={[
          { key: 'playerName', header: 'Jucător' },
          { key: 'month', header: 'Lună' },
          { key: 'year', header: 'An' },
          { key: 'dueAmount', header: 'Datorat', render: (row) => formatCurrency(row.dueAmount) },
          { key: 'paidAmount', header: 'Plătit', render: (row) => formatCurrency(row.paidAmount) },
          { key: 'status', header: 'Status', render: (row) => <PaymentStatusBadge status={row.status} /> },
          { key: 'method', header: 'Metodă' },
          ...(canManagePayments
            ? [
                {
                  key: 'actions',
                  header: 'Acțiuni',
                  render: (row: { id: string }) => (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/payments?editPayment=${row.id}`}
                        className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
                      >
                        Editează
                      </Link>
                      <form action={deletePaymentAction}>
                        <input type="hidden" name="paymentId" value={String(row.id)} />
                        <ConfirmSubmitButton
                          label="Șterge"
                          pendingLabel="Se șterge..."
                          confirmMessage="Sigur vrei să ștergi această plată? Soldurile și rapoartele financiare se vor recalcula imediat."
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        />
                      </form>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        rows={paginatedPaymentRows}
      />
      ) : null}

      {currentView === 'contributions' ? (
      <DataTable
        title="Donații și sponsorizări"
        description="Contribuții externe pentru club, inclusiv online"
        columns={[
          { key: 'contributorName', header: 'Contribuabil' },
          { key: 'sponsorCompany', header: 'Companie' },
          { key: 'type', header: 'Tip' },
          {
            key: 'amount',
            header: 'Sumă',
            render: (row) => formatCurrency(row.amount),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => <ContributionStatusBadge status={row.status} />,
          },
          { key: 'provider', header: 'Provider' },
          { key: 'source', header: 'Sursă' },
          {
            key: 'checkoutUrl',
            header: 'Link plată',
            render: (row) =>
              row.checkoutUrl && row.checkoutUrl !== '-' ? (
                <a
                  href={row.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-700 underline underline-offset-4"
                >
                  Deschide
                </a>
              ) : (
                '-'
              ),
          },
        ]}
        rows={paymentData.contributionRows}
      />
      ) : null}
    </div>
  )
}
