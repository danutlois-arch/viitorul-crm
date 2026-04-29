'use client'

interface ExcelExportButtonProps {
  filename: string
  rows: Record<string, string | number>[]
  label: string
}

function escapeCell(value: string | number) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function ExcelExportButton({
  filename,
  rows,
  label,
}: ExcelExportButtonProps) {
  function handleExport() {
    if (!rows.length) {
      return
    }

    const headers = Object.keys(rows[0])
    const table = `
      <table>
        <thead>
          <tr>${headers.map((header) => `<th>${escapeCell(header)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${headers
                  .map((header) => `<td>${escapeCell(row[header] ?? '')}</td>`)
                  .join('')}</tr>`
            )
            .join('')}
        </tbody>
      </table>
    `

    const blob = new Blob([table], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
    >
      {label}
    </button>
  )
}
