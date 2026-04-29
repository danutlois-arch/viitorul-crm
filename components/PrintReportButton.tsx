'use client'

interface PrintReportButtonProps {
  title: string
  subtitle: string
  sections: Array<{
    title: string
    rows: Record<string, string | number>[]
  }>
  label: string
}

function renderTable(rows: Record<string, string | number>[]) {
  if (!rows.length) {
    return '<p>Nu există date pentru această secțiune.</p>'
  }

  const headers = Object.keys(rows[0])
  return `
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) =>
              `<tr>${headers.map((header) => `<td>${String(row[header] ?? '')}</td>`).join('')}</tr>`
          )
          .join('')}
      </tbody>
    </table>
  `
}

export function PrintReportButton({
  title,
  subtitle,
  sections,
  label,
}: PrintReportButtonProps) {
  function handlePrint() {
    const popup = window.open('', '_blank', 'width=1100,height=800')
    if (!popup) {
      return
    }

    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            h1 { margin: 0 0 8px; font-size: 28px; }
            p { margin: 0 0 20px; color: #475569; }
            section { margin: 28px 0; }
            h2 { margin: 0 0 12px; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 12px; }
            th { background: #f8fafc; text-transform: uppercase; letter-spacing: 0.08em; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>${subtitle}</p>
          ${sections
            .map(
              (section) => `
                <section>
                  <h2>${section.title}</h2>
                  ${renderTable(section.rows)}
                </section>
              `
            )
            .join('')}
        </body>
      </html>
    `

    popup.document.open()
    popup.document.write(html)
    popup.document.close()
    popup.focus()
    popup.print()
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50"
    >
      {label}
    </button>
  )
}
