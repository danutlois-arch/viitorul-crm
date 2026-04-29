import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface TableColumn<T> {
  key: keyof T | string
  header: string
  className?: string
  render?: (row: T) => ReactNode
}

interface DataTableProps<T> {
  title?: string
  description?: string
  columns: TableColumn<T>[]
  rows: T[]
  emptyStateTitle?: string
  emptyStateDescription?: string
  emptyStateActionHref?: string
  emptyStateActionLabel?: string
}

export function DataTable<T extends { id?: string | number }>({
  title,
  description,
  columns,
  rows,
  emptyStateTitle = 'Nu există încă înregistrări',
  emptyStateDescription = 'Adaugă primele date sau schimbă filtrele pentru a vedea rezultate aici.',
  emptyStateActionHref,
  emptyStateActionLabel,
}: DataTableProps<T>) {
  return (
    <section className="rounded-3xl border border-brand-100 bg-white shadow-card">
      {(title || description) && (
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? <h3 className="text-lg font-semibold text-slate-950">{title}</h3> : null}
            {description ? <p className="text-sm text-slate-500">{description}</p> : null}
          </div>
        </div>
      )}

      <div className="grid gap-4 p-4 md:hidden">
        {rows.map((row, index) => (
          <article
            key={String(row.id ?? index)}
            className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-4 shadow-sm"
          >
            <div className="grid gap-3">
              {columns.map((column) => (
                <div key={String(column.key)} className="grid gap-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {column.header}
                  </p>
                  <div className={cn('text-sm text-slate-700', column.className)}>
                    {column.render ? column.render(row) : String(row[column.key as keyof T] ?? '-')}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
        {!rows.length ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">{emptyStateTitle}</p>
            <p className="mt-2 text-sm text-slate-500">{emptyStateDescription}</p>
            {emptyStateActionHref && emptyStateActionLabel ? (
              <Link
                href={emptyStateActionHref}
                className="mt-4 inline-flex rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
              >
                {emptyStateActionLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto md:block">
        {rows.length ? (
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/80">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={String(row.id ?? index)} className="hover:bg-slate-50/70">
                  {columns.map((column) => (
                    <td key={String(column.key)} className={cn('px-5 py-4 text-sm text-slate-700', column.className)}>
                      {column.render ? column.render(row) : String(row[column.key as keyof T] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-10">
            <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-base font-semibold text-slate-900">{emptyStateTitle}</p>
              <p className="mt-2 text-sm text-slate-500">{emptyStateDescription}</p>
              {emptyStateActionHref && emptyStateActionLabel ? (
                <div className="mt-5">
                  <Link
                    href={emptyStateActionHref}
                    className="inline-flex rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                  >
                    {emptyStateActionLabel}
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
