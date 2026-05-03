import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CoachMatchStatCard } from '@/components/CoachMatchStatCard'
import { CoachTrainingRecordCard } from '@/components/CoachTrainingRecordCard'
import { CoachTrainingSessionForm } from '@/components/CoachTrainingSessionForm'
import { DataTable } from '@/components/DataTable'
import { SegmentedTabs } from '@/components/SegmentedTabs'
import { StatCard } from '@/components/StatCard'
import {
  getCoachCenterData,
  getCoachMatchdayData,
  getCoachTrainingData,
} from '@/lib/coach'

export default async function CoachPage({
  searchParams,
}: {
  searchParams?: { matchId?: string; trainingId?: string; view?: string }
}) {
  const center = await getCoachCenterData()

  if (center.viewer.source !== 'supabase') {
    redirect('/dashboard')
  }

  if (center.viewer.user.role !== 'coach') {
    redirect('/dashboard')
  }

  if (!center.assignedTeam) {
    return (
      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-card">
        <p className="text-xs uppercase tracking-[0.22em] text-amber-700">Coach Center</p>
        <h1 className="mt-3 text-3xl font-semibold">Atribuire grupă necesară</h1>
        <p className="mt-3 max-w-2xl text-sm">
          Contul de antrenor este conectat, dar nu are încă o grupă alocată. Din modulul Cluburi,
          un administrator poate asocia antrenorul la grupa pe care o gestionează.
        </p>
      </section>
    )
  }

  const selectedMatchId = searchParams?.matchId ?? center.nextMatch?.id ?? ''
  const selectedTrainingId = searchParams?.trainingId ?? center.nextTraining?.id ?? ''
  const currentView = searchParams?.view === 'training' ? 'training' : 'matches'
  const matchday = selectedMatchId
    ? await getCoachMatchdayData(selectedMatchId)
    : { ...center, selectedMatch: null, statRows: [] }
  const training = selectedTrainingId
    ? await getCoachTrainingData(selectedTrainingId)
    : { ...center, selectedTraining: null, trainingRows: [] }

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.26em] text-brand-600">Coach Center</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">{center.assignedTeam.name}</h1>
            <p className="mt-2 text-sm text-slate-500">
              Spațiu dedicat antrenorului pentru grupa lui: lot, meciuri, evenimente de joc și
              note rapide de evaluare.
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {center.assignedTeam.category} · {center.assignedTeam.competition} ·{' '}
            {center.assignedTeam.season}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Jucători în grupă"
          value={String(center.players.length)}
          description="Lotul activ gestionat de antrenor"
        />
        <StatCard
          title="Meciuri în calendar"
          value={String(center.matches.length)}
          description="Doar pentru grupa atribuită"
        />
        <StatCard
          title="Următorul meci"
          value={center.nextMatch?.opponent ?? '-'}
          description={
            center.nextMatch ? `${center.nextMatch.date} · ${center.nextMatch.hour}` : 'Nu există încă'
          }
        />
        <StatCard
          title="Următorul antrenament"
          value={center.nextTraining?.location ?? '-'}
          description={
            center.nextTraining ? `${center.nextTraining.date} · ${center.nextTraining.hour}` : 'Nu există încă'
          }
        />
      </section>

      <DataTable
        title="Lotul grupei"
        description="Jucătorii pe care îi gestionează acest antrenor"
        columns={[
          { key: 'name', header: 'Jucător' },
          { key: 'position', header: 'Poziție' },
          { key: 'status', header: 'Status' },
          { key: 'goals', header: 'Goluri' },
          { key: 'assists', header: 'Assisturi' },
          { key: 'minutesPlayed', header: 'Minute' },
        ]}
        rows={center.players.map((player) => ({
          id: player.id,
          name: `${player.firstName} ${player.lastName}`,
          position: player.position,
          status: player.status,
          goals: player.goals,
          assists: player.assists,
          minutesPlayed: player.minutesPlayed,
        }))}
      />

      <SegmentedTabs
        action="/coach"
        paramName="view"
        currentValue={currentView}
        values={{
          matchId: searchParams?.matchId,
          trainingId: searchParams?.trainingId,
          view: searchParams?.view,
        }}
        segments={[
          { value: 'matches', label: 'Zona meciuri' },
          { value: 'training', label: 'Zona antrenamente' },
        ]}
      />

      {currentView === 'matches' ? (
        <>
          <DataTable
            title="Meciurile grupei"
            description="Calendarul meciurilor pe care antrenorul le poate gestiona"
            columns={[
              { key: 'date', header: 'Data' },
              { key: 'competition', header: 'Competiție' },
              { key: 'opponent', header: 'Adversar' },
              { key: 'status', header: 'Status' },
              {
                key: 'actions',
                header: 'Matchday',
                render: (row) => (
                  <Link
                    href={`/coach?view=matches&matchId=${row.id}`}
                    className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
                  >
                    Deschide meciul
                  </Link>
                ),
              },
            ]}
            rows={center.matches}
          />

          {matchday.selectedMatch ? (
        <section className="space-y-4 rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-brand-600">Matchday Panel</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                {matchday.selectedMatch.opponent}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {matchday.selectedMatch.date} · {matchday.selectedMatch.hour} ·{' '}
                {matchday.selectedMatch.competition} · {matchday.selectedMatch.location}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Notează titulari, minute, schimbări, cartonașe și note de joc direct din telefon.
            </div>
          </div>

          <div className="grid gap-4">
            {matchday.statRows.map((player) => (
              <CoachMatchStatCard
                key={player.playerId}
                matchId={matchday.selectedMatch!.id}
                player={player}
              />
            ))}
          </div>
        </section>
          ) : null}
        </>
      ) : (
        <>
          <CoachTrainingSessionForm />

          <DataTable
            title="Sesiunile grupei"
            description="Antrenamentele și sesiunile pe care antrenorul le poate nota"
            columns={[
              { key: 'date', header: 'Data' },
              { key: 'hour', header: 'Ora' },
              { key: 'type', header: 'Tip' },
              { key: 'location', header: 'Locație' },
              { key: 'attendanceRate', header: 'Prezență %' },
              {
                key: 'actions',
                header: 'Training',
                render: (row) => (
                  <Link
                    href={`/coach?view=training&trainingId=${row.id}`}
                    className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
                  >
                    Deschide sesiunea
                  </Link>
                ),
              },
            ]}
            rows={center.attendanceSessions}
          />

          {training.selectedTraining ? (
        <section className="space-y-4 rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-brand-600">Training Panel</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                {training.selectedTraining.type}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {training.selectedTraining.date} · {training.selectedTraining.hour} ·{' '}
                {training.selectedTraining.location}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Prezență, notă și observații rapide pentru fiecare jucător din grupa antrenorului.
            </div>
          </div>

          <div className="grid gap-4">
            {training.trainingRows.map((player) => (
              <CoachTrainingRecordCard
                key={player.playerId}
                sessionId={training.selectedTraining!.id}
                player={player}
              />
            ))}
          </div>
        </section>
          ) : null}
        </>
      )}
    </div>
  )
}
