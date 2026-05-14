import type { DailyEntry } from '../profileContent'

type NotificationState = NotificationPermission | 'unsupported' | 'unknown'

type DailyCardProps = {
  dayNumber: number
  entry: DailyEntry
  completedToday: boolean
  onExecuted: () => void
  showReminderPrompt: boolean
  onEnableNotifications: () => void
  onDismissReminder: () => void
  notificationState: NotificationState
}

export function DailyCard({
  dayNumber,
  entry,
  completedToday,
  onExecuted,
  showReminderPrompt,
  onEnableNotifications,
  onDismissReminder,
  notificationState,
}: DailyCardProps) {
  return (
    <section className="space-y-4">
      {showReminderPrompt ? (
        <div className="rounded-[24px] border border-[#6ee7a8]/20 bg-[#0c1b16] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Stay on cue</p>
              <p className="mt-1 text-sm leading-6 text-white/62">
                Enable reminders now. Push delivery can be added later without changing the flow.
              </p>
            </div>
            <button
              type="button"
              onClick={onDismissReminder}
              className="text-xs text-white/45 transition hover:text-white/70"
            >
              Dismiss
            </button>
          </div>
          <button
            type="button"
            onClick={onEnableNotifications}
            className="mt-4 w-full rounded-2xl bg-[#6ee7a8] px-4 py-3 text-sm font-semibold text-[#041109] transition hover:bg-[#87efb8]"
          >
            Allow notifications
          </button>
        </div>
      ) : notificationState === 'denied' ? (
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/62">
          Notifications are blocked right now. You can enable them later from browser settings.
        </div>
      ) : null}

      <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.28em] text-[#7df0b4]">Day {dayNumber}</p>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">
            5-20 min
          </span>
        </div>

        <div className="mt-6 rounded-[26px] border border-white/8 bg-[#0a1120] p-5">
          <p className="text-sm uppercase tracking-[0.26em] text-white/40">Message</p>
          <p className="mt-3 text-2xl font-semibold leading-tight text-white">{entry.message}</p>
        </div>

        <div className="mt-4 rounded-[26px] border border-[#6ee7a8]/12 bg-[#09140f] p-5">
          <p className="text-sm uppercase tracking-[0.26em] text-[#91efbe]">Task</p>
          <p className="mt-3 text-base leading-7 text-white/88">{entry.task}</p>
        </div>

        <button
          type="button"
          onClick={onExecuted}
          disabled={completedToday}
          className={`mt-6 w-full rounded-[22px] px-4 py-4 text-base font-semibold transition ${
            completedToday
              ? 'cursor-not-allowed border border-[#6ee7a8]/10 bg-[#132118] text-[#9cf2c2]'
              : 'bg-[#6ee7a8] text-[#041109] hover:bg-[#88efb8]'
          }`}
        >
          {completedToday ? 'Executed today' : 'I executed'}
        </button>
      </div>
    </section>
  )
}
