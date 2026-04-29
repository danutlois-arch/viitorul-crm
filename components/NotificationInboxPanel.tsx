import Link from 'next/link'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { markNotificationAsReadAction, syncNotificationInboxAction } from '@/app/(app)/notifications/actions'
import type { NotificationInboxItem } from '@/lib/types'

const toneClasses = {
  danger: 'border-rose-200 bg-rose-50',
  warning: 'border-amber-200 bg-amber-50',
  info: 'border-sky-200 bg-sky-50',
  success: 'border-emerald-200 bg-emerald-50',
} as const

export function NotificationInboxPanel({
  items,
}: {
  items: NotificationInboxItem[]
}) {
  return (
    <section className="rounded-[2rem] border border-brand-100 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Inbox utilizator</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Notificări persistente</h2>
        </div>
        <form action={syncNotificationInboxAction}>
          <button
            type="submit"
            className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
          >
            Sincronizează inbox-ul
          </button>
        </form>
      </div>

      <div className="mt-5 space-y-3">
        {items.length ? (
          items.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border p-4 ${toneClasses[item.tone]} ${item.isRead ? 'opacity-70' : ''}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    {item.isRead ? (
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Citită
                      </span>
                    ) : (
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                        Nouă
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleString('ro-RO')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={item.href}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50"
                  >
                    Deschide
                  </Link>
                  {!item.isRead ? (
                    <form action={markNotificationAsReadAction}>
                      <input type="hidden" name="notificationId" value={item.id} />
                      <ConfirmSubmitButton
                        label="Marchează citită"
                        pendingLabel="Se actualizează..."
                        confirmMessage="Marchezi această notificare ca citită?"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50"
                      />
                    </form>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
            Inbox-ul persistent este gol momentan. Poți sincroniza alertele curente din club.
          </div>
        )}
      </div>
    </section>
  )
}
