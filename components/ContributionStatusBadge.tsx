import type { ContributionStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusMap: Record<ContributionStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

export function ContributionStatusBadge({
  status,
}: {
  status: ContributionStatus
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        statusMap[status]
      )}
    >
      {status}
    </span>
  )
}
