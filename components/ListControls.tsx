import Link from 'next/link'
import { buildPathWithParams } from '@/lib/url-state'

interface SortOption {
  value: string
  label: string
}

interface ListControlsProps {
  action: string
  values: Record<string, string | undefined>
  sortOptions: SortOption[]
  currentSort: string
  currentDirection: 'asc' | 'desc'
  currentPageSize: number
  currentPage: number
  totalItems: number
}

const pageSizeOptions = [5, 10, 20, 50]

export function ListControls({
  action,
  values,
  sortOptions,
  currentSort,
  currentDirection,
  currentPageSize,
  currentPage,
  totalItems,
}: ListControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / currentPageSize))
  const canGoBack = currentPage > 1
  const canGoForward = currentPage < totalPages
  const pageLabel =
    totalItems === 0
      ? '0 rezultate'
      : `${Math.min((currentPage - 1) * currentPageSize + 1, totalItems)}-${Math.min(
          currentPage * currentPageSize,
          totalItems
        )} din ${totalItems}`

  return (
    <section className="rounded-[2rem] border border-brand-100 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Sortare și paginare</h3>
          <p className="text-sm text-slate-500">
            Controlează ordinea datelor și cât vezi pe pagină.
          </p>
        </div>
        <div className="rounded-2xl bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800">
          {pageLabel}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <form action={action} className="grid gap-4 md:grid-cols-3 xl:min-w-[720px]">
          {Object.entries(values).map(([key, value]) =>
            key !== 'sort' && key !== 'dir' && key !== 'pageSize' && key !== 'page' && value ? (
              <input key={key} type="hidden" name={key} value={value} />
            ) : null
          )}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Sortează după
            </label>
            <select
              name="sort"
              defaultValue={currentSort}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Direcție</label>
            <select
              name="dir"
              defaultValue={currentDirection}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
            >
              <option value="asc">Ascendent</option>
              <option value="desc">Descendent</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Pe pagină</label>
            <select
              name="pageSize"
              defaultValue={String(currentPageSize)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <input type="hidden" name="page" value="1" />
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Actualizează lista
            </button>
          </div>
        </form>

        {totalItems > 0 ? (
          <div className="flex flex-col gap-3 self-end sm:flex-row sm:items-center">
            <Link
              href={buildPathWithParams(action, values, { page: canGoBack ? currentPage - 1 : 1 })}
              aria-disabled={!canGoBack}
              className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold transition ${
                canGoBack
                  ? 'border border-slate-200 text-slate-700 hover:border-brand-200 hover:bg-brand-50'
                  : 'pointer-events-none border border-slate-100 text-slate-300'
              }`}
            >
              Pagina anterioară
            </Link>
            <div className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-600">
              Pagina {Math.min(currentPage, totalPages)} din {totalPages}
            </div>
            <Link
              href={buildPathWithParams(action, values, {
                page: canGoForward ? currentPage + 1 : totalPages,
              })}
              aria-disabled={!canGoForward}
              className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold transition ${
                canGoForward
                  ? 'border border-slate-200 text-slate-700 hover:border-brand-200 hover:bg-brand-50'
                  : 'pointer-events-none border border-slate-100 text-slate-300'
              }`}
            >
              Pagina următoare
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
            Nu există rezultate pentru paginație momentan.
          </div>
        )}
      </div>
    </section>
  )
}
