import Image from 'next/image'
import Link from 'next/link'
import { DataTable } from '@/components/DataTable'
import { NotificationCenter } from '@/components/NotificationCenter'
import { OnboardingWizard } from '@/components/OnboardingWizard'
import { StatCard } from '@/components/StatCard'
import { getRecentActivityForCurrentClub } from '@/lib/activity-log'
import { getAppViewer } from '@/lib/auth'
import { getThemeByKey, getDefaultThemeKeyForClub } from '@/lib/club-branding'
import { getDashboardData } from '@/lib/dashboard'
import { getNotificationsForCurrentClub } from '@/lib/notifications'
import { getClubOnboardingProgress } from '@/lib/onboarding'
import { canManageResource } from '@/lib/permissions'
import { formatCurrency } from '@/lib/utils'

export default async function DashboardPage() {
  const viewer = await getAppViewer()
  const canManagePlayers = canManageResource(viewer.user.role, 'players')
  const canManageTeams = canManageResource(viewer.user.role, 'teams')
  const canManageMatches = canManageResource(viewer.user.role, 'matches')
  const canManageAttendance = canManageResource(viewer.user.role, 'attendance')
  const canManagePayments = canManageResource(viewer.user.role, 'payments')
  const theme = getThemeByKey(viewer.club.themeKey ?? getDefaultThemeKeyForClub(viewer.club.name))
  const logoPath = viewer.club.logoUrl || theme.logoPath
  const [dashboard, onboarding, recentActivity, notifications] = await Promise.all([
    getDashboardData(),
    getClubOnboardingProgress(),
    getRecentActivityForCurrentClub(5),
    getNotificationsForCurrentClub(),
  ])

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="relative overflow-hidden rounded-[2rem] bg-pitch p-6 text-white shadow-card">
          <div className="absolute inset-y-0 right-0 hidden w-56 bg-gradient-to-l from-white/10 to-transparent lg:block" />
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-200">
                Dashboard principal
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold lg:text-5xl">
                Control complet pentru seniori, juniori, taxe și competiții FRF.
              </h1>
              <p className="mt-4 max-w-3xl text-sm text-white/72 lg:text-base">
                Interfața este pregătită pentru roluri pe club, filtrare automată pe `club_id`,
                RLS și extindere către mai multe academii din aceeași platformă.
              </p>
            </div>
            {logoPath ? (
              <div className="relative h-28 w-28 self-start overflow-hidden rounded-3xl bg-white/95 p-3 shadow-2xl">
                <Image src={logoPath} alt={viewer.club.name} fill className="object-contain p-2" unoptimized />
              </div>
            ) : null}
          </div>
        </div>

        <StatCard
          title="Top marcator club"
          value={`${dashboard.topScorer.firstName} ${dashboard.topScorer.lastName}`}
          description={`${dashboard.topScorer.goals} goluri în sezonul curent`}
          accent="green"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Jucători total" value={String(dashboard.summary.totalPlayers)} description="Toți jucătorii activi ai clubului" />
        <StatCard title="Echipe active" value={String(dashboard.summary.totalTeams)} description="Seniori, juniori și grupe academie" />
        <StatCard title="Taxe restante" value={formatCurrency(dashboard.summary.outstandingPayments)} description="Sold neîncasat până la zi" />
        <StatCard title="Meciuri următoare" value={String(dashboard.summary.nextMatches)} description="Programate în calendar" />
        <StatCard title="Suspendați" value={String(dashboard.summary.suspendedPlayers)} description="Jucători indisponibili" />
        <StatCard title="Prezență medie" value={`${dashboard.summary.averageAttendance}%`} description="Pe toate sesiunile recente" />
      </section>

      <OnboardingWizard steps={onboarding.steps} percent={onboarding.percent} />

      <NotificationCenter
        title="Alerte și remindere"
        description="Taxe, meciuri, suspendări și alte situații care cer atenție în perioada imediată."
        items={notifications.items}
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <DataTable
          title="Următoarele meciuri"
          description="Calendarul imediat pentru club"
          columns={[
            { key: 'opponent', header: 'Adversar' },
            { key: 'competition', header: 'Competiție' },
            { key: 'date', header: 'Data' },
            { key: 'venueType', header: 'Loc' },
            { key: 'status', header: 'Status' },
          ]}
          rows={dashboard.upcomingMatches}
        />

        <DataTable
          title="Top jucători"
          description="Scurtă privire asupra lotului"
          columns={[
            { key: 'name', header: 'Jucător' },
            { key: 'team', header: 'Echipă' },
            { key: 'goals', header: 'Goluri' },
          ]}
          rows={dashboard.topPlayers}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <DataTable
          title="Echipe"
          columns={[
            { key: 'name', header: 'Echipă' },
            { key: 'category', header: 'Categorie' },
            { key: 'competition', header: 'Competiție' },
          ]}
          rows={dashboard.teams}
        />
        <DataTable
          title="Jucători cu atenție"
          description="Accidentați, suspendați sau indisponibili"
          columns={[
            { key: 'lastName', header: 'Jucător', render: (row) => `${row.firstName} ${row.lastName}` },
            { key: 'status', header: 'Status' },
            { key: 'coachNotes', header: 'Observații' },
          ]}
          rows={dashboard.attentionPlayers}
        />
        <div className="rounded-[2rem] border border-brand-100 bg-white p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Acțiuni rapide</p>
          <div className="mt-4 grid gap-3">
            {[
              { href: '/players', label: 'Adaugă jucător', enabled: canManagePlayers },
              { href: '/teams', label: 'Adaugă echipă', enabled: canManageTeams },
              { href: '/matches', label: 'Adaugă meci', enabled: canManageMatches },
              { href: '/attendance', label: 'Marchează prezența', enabled: canManageAttendance },
              { href: '/payments', label: 'Înregistrează o plată', enabled: canManagePayments },
            ]
              .filter((item) => item.enabled)
              .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:bg-brand-50"
              >
                {item.label}
              </Link>
              ))}
          </div>

          <div className="mt-5 rounded-3xl bg-brand-50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-brand-700">Contribuție principală</p>
            <h3 className="mt-3 text-lg font-semibold text-slate-950">
              {dashboard.topContribution.contributorName}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {dashboard.topContribution.type} · {formatCurrency(dashboard.topContribution.amount)}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Contribuții externe confirmate: {formatCurrency(dashboard.summary.onlineContributions)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_0.75fr_0.9fr]">
        <DataTable
          title="Ultimele rezultate"
          description="Meciuri deja jucate"
          columns={[
            { key: 'opponent', header: 'Adversar' },
            { key: 'competition', header: 'Competiție' },
            { key: 'date', header: 'Data' },
            {
              key: 'score',
              header: 'Scor',
              render: (row) =>
                row.teamScore !== null && row.opponentScore !== null
                  ? `${row.teamScore} - ${row.opponentScore}`
                  : '-',
            },
          ]}
          rows={dashboard.recentResults}
        />

        <div className="rounded-[2rem] border border-brand-100 bg-white p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Activitate recentă</p>
          <div className="mt-4 space-y-3">
            {recentActivity.length ? (
              recentActivity.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{entry.actor_name ?? 'Utilizator club'}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {entry.area}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {entry.details ?? entry.entity_label ?? 'Acțiune înregistrată în club.'}
                  </p>
                  <p className="mt-3 text-xs text-slate-400">
                    {new Date(entry.created_at).toLocaleString('ro-RO')}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Activitatea recentă va apărea aici după primele acțiuni ale staff-ului.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-brand-100 bg-white p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Recomandări operative</p>
          <div className="mt-4 grid gap-3">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-950">Verifică lotul indisponibil</h3>
              <p className="mt-2 text-sm text-slate-500">
                Sunt {dashboard.summary.suspendedPlayers} jucători suspendați și
                {` ${dashboard.attentionPlayers.length}`} cu status sensibil în lot.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-950">Urmărește lichiditatea clubului</h3>
              <p className="mt-2 text-sm text-slate-500">
                Soldul restant este {formatCurrency(dashboard.summary.outstandingPayments)}, iar
                contribuțiile externe confirmate sunt {formatCurrency(dashboard.summary.onlineContributions)}.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-950">Optimizează participarea</h3>
              <p className="mt-2 text-sm text-slate-500">
                Prezența medie actuală este {dashboard.summary.averageAttendance}% pe sesiunile
                monitorizate în platformă.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  )
}
