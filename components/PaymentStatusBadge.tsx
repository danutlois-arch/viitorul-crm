import type { PaymentStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusMap: Record<PaymentStatus, string> = {
  platit: 'bg-emerald-100 text-emerald-700',
  partial: 'bg-amber-100 text-amber-700',
  restant: 'bg-rose-100 text-rose-700',
  scutit: 'bg-slate-200 text-slate-700',
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', statusMap[status])}>
      {status}
    </span>
  )
}
