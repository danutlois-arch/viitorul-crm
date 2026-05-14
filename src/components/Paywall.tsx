type PaywallProps = {
  profileLabel: string
  totalCompleted: number
  streak: number
}

export function Paywall({ profileLabel, totalCompleted, streak }: PaywallProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
      <p className="text-xs uppercase tracking-[0.28em] text-[#7df0b4]">Trial complete</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
        Your first 30 days are finished.
      </h2>
      <p className="mt-4 text-sm leading-6 text-white/66">
        {profileLabel} track completed with {totalCompleted} executed days and a best current streak of{' '}
        {streak}. This is where the MVP paywall sits before payments are added.
      </p>

      <div className="mt-6 rounded-[26px] border border-[#6ee7a8]/15 bg-[#09140f] p-5">
        <p className="text-sm font-medium text-white">Upgrade placeholder</p>
        <p className="mt-2 text-sm leading-6 text-white/62">
          Continue with the next 30-day block, custom reminders, and richer progress history.
        </p>
      </div>

      <button
        type="button"
        className="mt-6 w-full rounded-[22px] bg-[#6ee7a8] px-4 py-4 text-base font-semibold text-[#041109] transition hover:bg-[#88efb8]"
      >
        Unlock full access
      </button>
    </section>
  )
}
