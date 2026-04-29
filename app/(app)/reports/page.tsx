import { DataTable } from '@/components/DataTable'
import { CsvExportButton } from '@/components/CsvExportButton'
import { ExcelExportButton } from '@/components/ExcelExportButton'
import { NotificationCenter } from '@/components/NotificationCenter'
import { PrintReportButton } from '@/components/PrintReportButton'
import { StatCard } from '@/components/StatCard'
import { getReportsData } from '@/lib/reports'

export default async function ReportsPage() {
  const reports = await getReportsData()

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.26em] text-brand-600">Rapoarte</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Export PDF și Excel</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Modulul este pregătit pentru exporturi operaționale, sportive și financiare la nivel de club sau echipă.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {reports.summaryCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            description={card.description}
          />
        ))}
      </section>

      <NotificationCenter
        title="Remindere de management"
        description="Alertele cele mai importante care merită incluse în ședințele operative și rapoartele de club."
        items={reports.notifications}
      />

      <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-brand-600">Export rapid</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Descarcă rapoarte CSV
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Export imediat pentru jucători, prezență și situația taxelor. Bun pentru management, contabilitate și board meetings.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <CsvExportButton
              filename="players-report.csv"
              rows={reports.playerExportRows}
              label="Export jucători"
            />
            <ExcelExportButton
              filename="players-report.xls"
              rows={reports.playerExportRows}
              label="Excel jucători"
            />
            <CsvExportButton
              filename="attendance-report.csv"
              rows={reports.attendanceExportRows}
              label="Export prezență"
            />
            <ExcelExportButton
              filename="attendance-report.xls"
              rows={reports.attendanceExportRows}
              label="Excel prezență"
            />
            <CsvExportButton
              filename="payments-report.csv"
              rows={reports.paymentExportRows}
              label="Export taxe"
            />
            <ExcelExportButton
              filename="payments-report.xls"
              rows={reports.paymentExportRows}
              label="Excel taxe"
            />
            <PrintReportButton
              title="Raport club"
              subtitle="Rezumat pentru management, exportabil prin Save as PDF din dialogul de print."
              label="Print / PDF club"
              sections={[
                { title: 'Rezumat sezon', rows: reports.seasonSummaryRows },
                { title: 'Top marcatori', rows: reports.topScorers },
                { title: 'Top assisturi', rows: reports.topAssists },
                { title: 'Situație taxe', rows: reports.paymentExportRows.slice(0, 12) },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-brand-100 bg-white p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Pachet board</p>
          <h3 className="mt-3 text-xl font-semibold text-slate-950">Raport managerial club</h3>
          <p className="mt-2 text-sm text-slate-500">
            Include indicatori de sezon, top jucători și poziția financiară curentă.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <PrintReportButton
              title="Raport managerial club"
              subtitle="Pachet pentru board, sponsor principal și management executiv."
              label="Deschide pentru PDF"
              sections={[
                { title: 'Rezumat sezon', rows: reports.seasonSummaryRows },
                { title: 'Top marcatori', rows: reports.topScorers },
                { title: 'Top assisturi', rows: reports.topAssists },
                { title: 'Suspendări relevante', rows: reports.suspensions },
              ]}
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-brand-100 bg-white p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Pachet financiar</p>
          <h3 className="mt-3 text-xl font-semibold text-slate-950">Taxe și contribuții</h3>
          <p className="mt-2 text-sm text-slate-500">
            Pentru contabilitate, urmărire restanțe și sponsorizări active.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ExcelExportButton
              filename="financial-package.xls"
              rows={reports.paymentExportRows}
              label="Excel taxe"
            />
            <ExcelExportButton
              filename="contributions-package.xls"
              rows={reports.contributionExportRows}
              label="Excel contribuții"
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-brand-100 bg-white p-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.24em] text-brand-600">Pachet sportiv</p>
          <h3 className="mt-3 text-xl font-semibold text-slate-950">Lot, prezență, performanță</h3>
          <p className="mt-2 text-sm text-slate-500">
            Pregătit pentru director sportiv, antrenori și evaluări interne.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <CsvExportButton
              filename="sporting-package.csv"
              rows={reports.playerExportRows}
              label="CSV lot"
            />
            <PrintReportButton
              title="Raport sportiv club"
              subtitle="Lot, prezență și performanță individuală."
              label="Print sportiv"
              sections={[
                { title: 'Lot jucători', rows: reports.playerExportRows },
                { title: 'Prezență', rows: reports.attendanceExportRows },
                { title: 'Top marcatori', rows: reports.topScorers },
              ]}
            />
          </div>
        </div>
      </section>

      <DataTable
        title="Catalog rapoarte"
        columns={[
          { key: 'title', header: 'Raport' },
          { key: 'subtitle', header: 'Descriere' },
          { key: 'metric', header: 'Indicator' },
        ]}
        rows={reports.reportCatalog}
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <DataTable
          title="Top marcatori"
          columns={[
            { key: 'name', header: 'Jucător' },
            { key: 'goals', header: 'Goluri' },
            { key: 'assists', header: 'Assisturi' },
            { key: 'minutesPlayed', header: 'Minute' },
          ]}
          rows={reports.topScorers}
        />
        <DataTable
          title="Top assisturi"
          columns={[
            { key: 'name', header: 'Jucător' },
            { key: 'assists', header: 'Assisturi' },
            { key: 'goals', header: 'Goluri' },
            { key: 'status', header: 'Status' },
          ]}
          rows={reports.topAssists}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <DataTable
          title="Ultimele meciuri raportate"
          columns={[
            { key: 'competition', header: 'Competiție' },
            { key: 'opponent', header: 'Adversar' },
            { key: 'date', header: 'Data' },
            { key: 'status', header: 'Status' },
          ]}
          rows={reports.recentMatches}
        />
        <DataTable
          title="Suspendări în raport"
          columns={[
            { key: 'playerName', header: 'Jucător' },
            { key: 'reason', header: 'Motiv' },
            { key: 'remainingRounds', header: 'Etape rămase' },
            { key: 'status', header: 'Status' },
          ]}
          rows={reports.suspensions}
        />
      </section>
    </div>
  )
}
