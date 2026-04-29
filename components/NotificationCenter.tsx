import Link from 'next/link'
import type { NotificationEntry } from '@/lib/notifications'

const toneClasses = {
  danger: 'border-rose-200 bg-rose-50 text-rose-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
} as const

const badgeClasses = {
  danger: 'bg-rose-100 text-rose-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-sky-100 text-sky-700',
  success: 'bg-emerald-100 text-emerald-700',
} as const

const toneLabels = {
  danger: 'Critic',
  warning: 'Atenție',
  info: 'Info',
  success: 'OK',
} as const

export function NotificationCenter({
  title = 'Notificări',
  description = 'Alerte și remindere pentru club',
  items,
}: {
  title?: string
  description?: string
  items: NotificationEntry[]
}) {
  return (
    <section className="rounded-[2rem] border border-brand-100 bg-white p-5 shadow-card">
      <p className="text-xs uppercase tracking-[0.24em] text-brand-600">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article key={item.id} className={`rounded-2xl border p-4 ${toneClasses[item.tone]}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm opacity-85">{item.description}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${badgeClasses[item.tone]}`}>
                {toneLabels[item.tone]}
              </span>
            </div>
            <Link
              href={item.href}
              className="mt-4 inline-flex rounded-xl border border-current/15 bg-white/70 px-3 py-2 text-xs font-semibold transition hover:bg-white"
            >
              {item.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
