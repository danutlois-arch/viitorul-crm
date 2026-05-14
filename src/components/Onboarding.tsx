import type { ProfileOption } from '../profileContent'

type OnboardingProps = {
  profiles: ProfileOption[]
  onSelectProfile: (profile: ProfileOption['key']) => void
}

export function Onboarding({ profiles, onSelectProfile }: OnboardingProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(110,231,168,0.16),_transparent_28%),linear-gradient(180deg,_#08101b_0%,_#050816_60%,_#03050d_100%)] px-5 py-6 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-between">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.32em] text-[#7df0b4]">Mentality Daily</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
            Execute one sharp task every day.
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/68">
            Choose your current season of life. We&apos;ll give you 30 days of direct, realistic
            action you can finish on your phone.
          </p>

          <div className="mt-8 grid gap-3">
            {profiles.map((profile) => (
              <button
                key={profile.key}
                type="button"
                onClick={() => onSelectProfile(profile.key)}
                className="rounded-[24px] border border-white/10 bg-[#0d1524] px-5 py-4 text-left transition hover:border-[#6ee7a8]/40 hover:bg-[#101a2b]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-medium text-white">{profile.label}</p>
                    <p className="mt-1 text-sm text-white/55">{profile.description}</p>
                  </div>
                  <span className="rounded-full border border-[#6ee7a8]/20 bg-[#6ee7a8]/10 px-3 py-1 text-xs text-[#9cf2c2]">
                    Start
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <p className="px-2 pb-2 pt-6 text-center text-xs leading-5 text-white/45">
          30-day free trial. Local-only MVP. No account, no distractions, no busywork.
        </p>
      </div>
    </main>
  )
}
