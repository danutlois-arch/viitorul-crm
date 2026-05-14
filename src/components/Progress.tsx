type ProgressProps = {
  currentDay: number
  streak: number
  totalCompleted: number
}

const statCards = [
  { key: 'day', label: 'Current day' },
  { key: 'streak', label: 'Streak' },
  { key: 'total', label: 'Completed' },
] as const

export function Progress({ currentDay, streak, totalCompleted }: ProgressProps) {
  const progressPercent = Math.round((currentDay / 30) * 100)
  const values = {
    day: `${currentDay}/30`,
    streak: `${streak}`,
    total: `${totalCompleted}`,
  }

  return (
    <section className="space-y-4">
      <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.28em] text-[#7df0b4]">Progress</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
          The goal is consistency, not motivation spikes.
        </h2>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-[#6ee7a8] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-white/55">{progressPercent}% through the free 30-day track.</p>
      </div>

      <div className="grid gap-3">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="rounded-[26px] border border-white/10 bg-[#0a1120] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
          >
            <p className="text-sm text-white/55">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{values[card.key]}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
