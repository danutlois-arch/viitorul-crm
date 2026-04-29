import Link from 'next/link'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { ClubLogo } from '@/components/ClubLogo'
import { DataTable } from '@/components/DataTable'
import { ClubSettingsForm } from '@/components/ClubSettingsForm'
import { EmailReminderPanel } from '@/components/EmailReminderPanel'
import { LaunchReadinessPanel } from '@/components/LaunchReadinessPanel'
import { MembershipForm } from '@/components/MembershipForm'
import { NotificationInboxPanel } from '@/components/NotificationInboxPanel'
import { NotificationPreferencesForm } from '@/components/NotificationPreferencesForm'
import { OnboardingChecklist } from '@/components/OnboardingChecklist'
import { ReminderScheduleForm } from '@/components/ReminderScheduleForm'
import { deleteMembershipAction } from '@/app/(app)/clubs/memberships-actions'
import { getRecentActivityForCurrentClub } from '@/lib/activity-log'
import { getAppViewer } from '@/lib/auth'
import { clubThemes, getThemeByKey } from '@/lib/club-branding'
import { isEmailConfigured } from '@/lib/email'
import { getRecentEmailDispatchesForCurrentClub } from '@/lib/email-reminders'
import {
  getMembershipByIdForCurrentClub,
  getMembershipsForCurrentClub,
} from '@/lib/memberships'
import { getClubOnboardingProgress } from '@/lib/onboarding'
import { getLaunchReadiness } from '@/lib/ops-readiness'
import { canManageResource, getRoleCapabilityRows } from '@/lib/permissions'
import {
  getCurrentUserReminderSchedule,
  getRecentReminderRunsForCurrentClub,
} from '@/lib/scheduled-reminders'
import {
  getCurrentUserNotificationSettings,
  getNotificationInboxForCurrentUser,
} from '@/lib/user-notifications'

export default async function ClubsPage({
  searchParams,
}: {
  searchParams?: { editMembership?: string }
}) {
  const viewer = await getAppViewer()
  const canManageClubSettings = canManageResource(viewer.user.role, 'club_settings')
  const canManageMemberships = canManageResource(viewer.user.role, 'memberships')
  const activeTheme = getThemeByKey(viewer.club.themeKey)
  const logoPath = viewer.club.logoUrl || activeTheme.logoPath
  const capabilityRows = getRoleCapabilityRows(viewer.user.role)
  const launchReadiness = getLaunchReadiness()
  const [
    memberships,
    existingMembership,
    onboarding,
    recentActivity,
    notificationSettings,
    notificationInbox,
    emailDispatches,
    reminderSchedule,
    reminderRuns,
  ] = await Promise.all([
    getMembershipsForCurrentClub(),
    searchParams?.editMembership
      ? getMembershipByIdForCurrentClub(searchParams.editMembership)
      : Promise.resolve(null),
    getClubOnboardingProgress(),
    getRecentActivityForCurrentClub(),
    getCurrentUserNotificationSettings(),
    getNotificationInboxForCurrentUser(6),
    getRecentEmailDispatchesForCurrentClub(8),
    getCurrentUserReminderSchedule(),
    getRecentReminderRunsForCurrentClub(8),
  ])

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.26em] text-brand-600">Cluburi</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Administrare club</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          {viewer.source === 'supabase'
            ? 'Datele clubului vin din Supabase și sunt filtrate după membership și politici RLS.'
            : 'Mod demo activ. După conectarea Supabase, fiecare utilizator va vedea doar cluburile la care are acces.'}
        </p>
      </section>

      {canManageClubSettings ? (
        <ClubSettingsForm club={viewer.club} source={viewer.source} />
      ) : (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Acces limitat</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Setări club</h2>
          <p className="mt-2 text-sm text-slate-500">
            Rolul tău poate consulta datele clubului și brandingul, dar nu le poate modifica.
          </p>
        </section>
      )}

      <LaunchReadinessPanel
        percent={launchReadiness.percent}
        readyCount={launchReadiness.readyCount}
        totalCount={launchReadiness.totalCount}
        allReady={launchReadiness.allReady}
        checks={launchReadiness.checks}
        pendingChecks={launchReadiness.pendingChecks}
        publicAppUrl={launchReadiness.publicAppUrl}
      />

      <OnboardingChecklist
        percent={onboarding.percent}
        completed={onboarding.completed}
        total={onboarding.total}
        steps={onboarding.steps}
      />

      {canManageMemberships ? (
        <MembershipForm
          source={viewer.source}
          existingMembership={existingMembership}
        />
      ) : (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Acces limitat</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Roluri și utilizatori</h2>
          <p className="mt-2 text-sm text-slate-500">
            Poți vedea membrii clubului și rolurile lor, dar nu poți adăuga sau modifica membership-uri.
          </p>
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.26em] text-brand-600">Permisiuni</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Accesul rolului curent</h2>
          <p className="mt-2 text-sm text-slate-500">
            Rolul tău actual este <span className="font-semibold text-slate-800">{viewer.user.role}</span>. Mai jos vezi clar ce module sunt în mod editare și ce zone rămân read-only.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {capabilityRows.map((item) => (
              <div
                key={item.resource}
                className={`rounded-2xl border px-4 py-3 ${
                  item.canManage
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p
                  className={`mt-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                    item.canManage ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {item.canManage ? 'Editare permisă' : 'Doar vizualizare'}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.26em] text-brand-600">Audit log</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Activitate recentă</h2>
          <div className="mt-5 space-y-3">
            {recentActivity.length ? (
              recentActivity.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {entry.actor_name ?? 'Utilizator club'} · {entry.action}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {entry.details ?? entry.entity_label ?? 'Acțiune înregistrată în jurnal.'}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {entry.area}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    {new Date(entry.created_at).toLocaleString('ro-RO')}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Jurnalul de activitate se va popula automat pe măsură ce staff-ul adaugă, editează sau șterge date în club.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <NotificationPreferencesForm settings={notificationSettings} />
        <NotificationInboxPanel items={notificationInbox} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <ReminderScheduleForm schedule={reminderSchedule} />
        <EmailReminderPanel
          email={viewer.user.email}
          emailEnabled={notificationSettings.emailEnabled}
          providerReady={isEmailConfigured()}
        />
      </section>

      <DataTable
        title="Istoric email reminders"
        description="Jurnalul ultimelor emailuri trimise din CRM către utilizatori."
        columns={[
          { key: 'recipientEmail', header: 'Destinatar' },
          { key: 'subject', header: 'Subiect' },
          { key: 'provider', header: 'Provider' },
          { key: 'status', header: 'Status' },
          {
            key: 'createdAt',
            header: 'Trimis la',
            render: (row) => new Date(row.createdAt).toLocaleString('ro-RO'),
          },
          {
            key: 'errorMessage',
            header: 'Observații',
            render: (row) => row.errorMessage || '-',
          },
        ]}
        rows={emailDispatches}
      />

      <DataTable
        title="Istoric rulări programate"
        description="Execuțiile reminder-elor recurente, manuale sau programate."
        columns={[
          { key: 'userName', header: 'Utilizator' },
          { key: 'triggerType', header: 'Declanșare' },
          { key: 'status', header: 'Status' },
          { key: 'message', header: 'Mesaj' },
          {
            key: 'createdAt',
            header: 'Rulat la',
            render: (row) => new Date(row.createdAt).toLocaleString('ro-RO'),
          },
        ]}
        rows={reminderRuns}
      />

      <DataTable
        title={existingMembership ? 'Utilizatori și roluri cu editare' : 'Utilizatori și roluri'}
        description="Membership-urile definesc accesul utilizatorilor în clubul curent."
        columns={[
          { key: 'fullName', header: 'Nume' },
          { key: 'email', header: 'Email' },
          { key: 'role', header: 'Rol' },
          ...(canManageMemberships
            ? [
                {
                  key: 'actions',
                  header: 'Acțiuni',
                  render: (row: { id: string }) => (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/clubs?editMembership=${row.id}`}
                        className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
                      >
                        Editează
                      </Link>
                      <form action={deleteMembershipAction}>
                        <input type="hidden" name="membershipId" value={String(row.id)} />
                        <ConfirmSubmitButton
                          label="Șterge"
                          pendingLabel="Se șterge..."
                          confirmMessage="Sigur vrei să elimini acest utilizator din club?"
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        />
                      </form>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        rows={memberships.rows}
      />

      <DataTable
        title="Date club"
        columns={[
          { key: 'name', header: 'Nume club' },
          { key: 'cui', header: 'CUI' },
          { key: 'city', header: 'Oraș' },
          { key: 'county', header: 'Județ' },
          { key: 'email', header: 'Email' },
          { key: 'phone', header: 'Telefon' },
          { key: 'subscriptionStatus', header: 'Abonament' },
        ]}
        rows={[viewer.club]}
      />

      <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.26em] text-brand-600">Identitate vizuală</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Temă selectabilă pe club
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Pentru FC Viitorul Onești tema implicită este alb-verde, inspirată din logo. Poți previzualiza și alte direcții cromatice pentru cluburi diferite direct din interfață.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            {logoPath ? (
              <ClubLogo
                src={logoPath}
                alt={viewer.club.name}
                className="h-24 w-24 rounded-3xl bg-white p-2"
                imageClassName="p-2"
              />
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {clubThemes.map((theme) => (
            <article
              key={theme.key}
              className={`rounded-3xl border p-4 ${
                theme.key === activeTheme.key
                  ? 'border-brand-300 bg-brand-50/60'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex gap-2">
                {['--brand-500', '--brand-300', '--pitch', '--surface-accent'].map((token) => (
                  <div
                    key={token}
                    className="h-10 flex-1 rounded-2xl border border-black/5"
                    style={{ backgroundColor: `rgb(${theme.vars[token]})` }}
                  />
                ))}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-950">{theme.label}</h3>
              <p className="mt-2 text-sm text-slate-500">{theme.description}</p>
              {theme.key === activeTheme.key ? (
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
                  Tema activă
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
