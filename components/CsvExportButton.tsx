'use client'

interface CsvExportButtonProps {
  filename: string
  rows: Record<string, string | number>[]
  label: string
}

function escapeValue(value: string | number) {
  const stringValue = String(value ?? '')
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replaceAll('"', '""')}"`
  }
  return stringValue
}

export function CsvExportButton({
  filename,
  rows,
  label,
}: CsvExportButtonProps) {
  function handleExport() {
    if (!rows.length) {
      return
    }

    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => escapeValue(row[header] ?? '')).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
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
      className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-100"
    >
      {label}
    </button>
  )
}
