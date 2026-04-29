import Link from 'next/link'

export interface FilterField {
  name: string
  label: string
  placeholder?: string
  type?: 'text' | 'select'
  options?: Array<{ value: string; label: string }>
}

interface FilterToolbarProps {
  action: string
  fields: FilterField[]
  values: Record<string, string | undefined>
  preserveKeys?: string[]
  title?: string
  resultLabel?: string
}

export function FilterToolbar({
  action,
  fields,
  values,
  preserveKeys = [],
  title = 'Filtre și căutare',
  resultLabel,
}: FilterToolbarProps) {
  const hasActiveFilters = fields.some((field) => {
    const value = values[field.name]
    return typeof value === 'string' && value.trim().length > 0
  })
  const activeFilterCount = fields.filter((field) => {
    const value = values[field.name]
    return typeof value === 'string' && value.trim().length > 0
  }).length

  return (
    <section className="rounded-[2rem] border border-brand-100 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="text-sm text-slate-500">
            Filtrează rapid datele și păstrează focusul pe ce contează acum.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              {activeFilterCount} filtre active
            </div>
          ) : null}
          {resultLabel ? (
            <div className="rounded-2xl bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800">
              {resultLabel}
            </div>
          ) : null}
        </div>
      </div>

      <form action={action} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {preserveKeys.map((key) =>
          values[key] ? <input key={key} type="hidden" name={key} value={values[key]} /> : null
        )}

        {fields.map((field) => (
          <div key={field.name}>
            <label className="mb-2 block text-sm font-medium text-slate-700">{field.label}</label>
            {field.type === 'select' ? (
              <select
                name={field.name}
                defaultValue={values[field.name] ?? ''}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              >
                <option value="">Toate</option>
                {field.options?.map((option) => (
                  <option key={`${field.name}-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name={field.name}
                defaultValue={values[field.name] ?? ''}
                placeholder={field.placeholder}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none ring-brand-200 focus:ring"
              />
            )}
          </div>
        ))}

        <div className="md:col-span-2 xl:col-span-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {hasActiveFilters ? (
            <Link
              href={action}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50"
            >
              Resetează
            </Link>
          ) : null}
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Aplică filtrele
          </button>
        </div>
      </form>
    </section>
  )
}
