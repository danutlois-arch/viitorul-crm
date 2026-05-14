import { useEffect, useMemo, useState } from 'react'
import { DailyCard } from './components/DailyCard'
import { Onboarding } from './components/Onboarding'
import { Paywall } from './components/Paywall'
import { Progress } from './components/Progress'
import {
  PROFILE_OPTIONS,
  profileContent,
  type DailyEntry,
  type ProfileKey,
} from './profileContent'

type NotificationState = NotificationPermission | 'unsupported' | 'unknown'

type AppState = {
  profile: ProfileKey
  startedAt: string
  completedDays: string[]
  reminderPromptDismissed: boolean
}

const STORAGE_KEY = 'mentality-daily-state'
const MILLISECONDS_PER_DAY = 86_400_000

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function toDateKey(date: Date) {
  return startOfLocalDay(date).toISOString().slice(0, 10)
}

function getDayNumber(startedAt: string, now = new Date()) {
  const start = startOfLocalDay(new Date(startedAt))
  const today = startOfLocalDay(now)
  const diff = today.getTime() - start.getTime()

  return Math.floor(diff / MILLISECONDS_PER_DAY) + 1
}

function getCurrentEntry(state: AppState): DailyEntry | null {
  const dayNumber = getDayNumber(state.startedAt)

  if (dayNumber < 1 || dayNumber > 30) {
    return null
  }

  return profileContent[state.profile][dayNumber - 1] ?? null
}

function getStreak(completedDays: string[], startedAt: string) {
  const completedSet = new Set(completedDays)
  const today = startOfLocalDay(new Date())
  const start = startOfLocalDay(new Date(startedAt))
  let streak = 0

  for (let cursor = today; cursor >= start; cursor = new Date(cursor.getTime() - MILLISECONDS_PER_DAY)) {
    const key = toDateKey(cursor)

    if (!completedSet.has(key)) {
      break
    }

    streak += 1
  }

  return streak
}

function loadStoredState(): AppState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AppState
  } catch {
    return null
  }
}

function App() {
  const [state, setState] = useState<AppState | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [activeScreen, setActiveScreen] = useState<'daily' | 'progress'>('daily')
  const [notificationState, setNotificationState] = useState<NotificationState>('unknown')

  useEffect(() => {
    setState(loadStoredState())
    setHydrated(true)

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationState(window.Notification.permission)
    } else {
      setNotificationState('unsupported')
    }
  }, [])

  useEffect(() => {
    if (!hydrated || !state) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [hydrated, state])

  const metrics = useMemo(() => {
    if (!state) {
      return null
    }

    const dayNumber = getDayNumber(state.startedAt)
    const completedToday = state.completedDays.includes(toDateKey(new Date()))

    return {
      dayNumber,
      currentDay: Math.min(Math.max(dayNumber, 1), 30),
      completedToday,
      streak: getStreak(state.completedDays, state.startedAt),
      totalCompleted: state.completedDays.length,
      currentEntry: getCurrentEntry(state),
    }
  }, [state])

  const handleSelectProfile = (profile: ProfileKey) => {
    const todayKey = toDateKey(new Date())

    setState({
      profile,
      startedAt: todayKey,
      completedDays: [],
      reminderPromptDismissed: false,
    })
    setActiveScreen('daily')
  }

  const handleExecuted = () => {
    if (!state) {
      return
    }

    const todayKey = toDateKey(new Date())

    if (state.completedDays.includes(todayKey)) {
      return
    }

    setState({
      ...state,
      completedDays: [...state.completedDays, todayKey],
    })
  }

  const handleDismissReminder = () => {
    if (!state) {
      return
    }

    setState({
      ...state,
      reminderPromptDismissed: true,
    })
  }

  const handleEnableNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationState('unsupported')
      return
    }

    const permission = await window.Notification.requestPermission()
    setNotificationState(permission)

    if (state) {
      setState({
        ...state,
        reminderPromptDismissed: permission !== 'default',
      })
    }
  }

  const handleReset = () => {
    window.localStorage.removeItem(STORAGE_KEY)
    setState(null)
    setActiveScreen('daily')
  }

  if (!hydrated) {
    return <div className="min-h-screen bg-[#050816]" />
  }

  if (!state) {
    return <Onboarding profiles={PROFILE_OPTIONS} onSelectProfile={handleSelectProfile} />
  }

  if (!metrics) {
    return null
  }

  const { currentEntry, currentDay, dayNumber, completedToday, streak, totalCompleted } = metrics
  const showPaywall = dayNumber > 30
  const profileLabel = PROFILE_OPTIONS.find((item) => item.key === state.profile)?.label ?? state.profile
  const showReminderPrompt =
    !state.reminderPromptDismissed && notificationState !== 'granted' && notificationState !== 'unsupported'

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(65,214,135,0.14),_transparent_24%),linear-gradient(180deg,_#08101b_0%,_#050816_55%,_#03050d_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-6">
        <header className="mb-6">
          <div className="mb-4 flex items-center justify-between text-sm text-white/60">
            <span>Mentality Daily</span>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 transition hover:border-white/20 hover:text-white"
            >
              Reset
            </button>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.28em] text-[#6ee7a8]">Selected profile</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{profileLabel}</h1>
                <p className="mt-2 max-w-[18rem] text-sm leading-6 text-white/65">
                  One focused execution prompt per day. No clutter, no planning spiral.
                </p>
              </div>
              <div className="rounded-2xl border border-[#6ee7a8]/25 bg-[#6ee7a8]/10 px-3 py-2 text-right">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#9cf2c2]">Day</p>
                <p className="text-2xl font-semibold text-white">{currentDay}</p>
              </div>
            </div>
          </div>
        </header>

        <nav className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setActiveScreen('daily')}
            className={`rounded-[18px] px-4 py-3 text-sm font-medium transition ${
              activeScreen === 'daily' ? 'bg-[#6ee7a8] text-[#041109]' : 'text-white/65 hover:text-white'
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('progress')}
            className={`rounded-[18px] px-4 py-3 text-sm font-medium transition ${
              activeScreen === 'progress' ? 'bg-[#6ee7a8] text-[#041109]' : 'text-white/65 hover:text-white'
            }`}
          >
            Progress
          </button>
        </nav>

        {showPaywall ? (
          <Paywall profileLabel={profileLabel} totalCompleted={totalCompleted} streak={streak} />
        ) : activeScreen === 'daily' && currentEntry ? (
          <DailyCard
            dayNumber={currentDay}
            entry={currentEntry}
            completedToday={completedToday}
            onExecuted={handleExecuted}
            showReminderPrompt={showReminderPrompt}
            onEnableNotifications={handleEnableNotifications}
            onDismissReminder={handleDismissReminder}
            notificationState={notificationState}
          />
        ) : (
          <Progress currentDay={currentDay} streak={streak} totalCompleted={totalCompleted} />
        )}
      </div>
    </main>
  )
}

export default App
