import { sendReminderDigestEmailAction } from '@/app/(app)/notifications/email-actions'
import { runReminderNowAction } from '@/app/(app)/notifications/schedule-actions'

export function EmailReminderPanel({
  email,
  emailEnabled,
  providerReady,
}: {
  email?: string
  emailEnabled: boolean
  providerReady: boolean
}) {
  return (
    <section className="rounded-[2rem] border border-brand-100 bg-white p-5 shadow-card">
      <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Email reminders</p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950">Trimite reminder acum</h2>
      <p className="mt-2 text-sm text-slate-500">
        Trimite manual un rezumat cu alertele curente către utilizatorul conectat. Bun pentru testare și pentru follow-up rapid.
      </p>

      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-900">Destinatar:</span>{' '}
            {email || 'nu există email în profil'}
          </p>
          <p className="mt-2">
            <span className="font-semibold text-slate-900">Preferință email:</span>{' '}
            {emailEnabled ? 'activă' : 'dezactivată'}
          </p>
          <p className="mt-2">
            <span className="font-semibold text-slate-900">Provider configurat:</span>{' '}
            {providerReady ? 'da' : 'nu'}
          </p>
        </div>
      </div>

      <form action={sendReminderDigestEmailAction} className="mt-5">
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Trimite reminder pe email
          </button>
        </div>
      </form>

      <form action={runReminderNowAction} className="mt-3">
        <button
          type="submit"
          className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
        >
          Rulează reminder-ul programat acum
        </button>
      </form>
    </section>
  )
}
