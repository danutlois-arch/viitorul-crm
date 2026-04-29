import Link from 'next/link'
import { buildPathWithParams } from '@/lib/url-state'

interface Segment {
  value: string
  label: string
}

interface SegmentedTabsProps {
  action: string
  paramName: string
  currentValue: string
  values: Record<string, string | undefined>
  segments: Segment[]
}

export function SegmentedTabs({
  action,
  paramName,
  currentValue,
  values,
  segments,
}: SegmentedTabsProps) {
  return (
    <section className="rounded-[2rem] border border-brand-100 bg-white p-3 shadow-card">
      <div className="flex flex-wrap gap-2">
        {segments.map((segment) => {
          const active = segment.value === currentValue
          return (
            <Link
              key={segment.value}
              href={buildPathWithParams(action, values, { [paramName]: segment.value, page: 1 })}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'border border-slate-200 text-slate-600 hover:border-brand-200 hover:bg-brand-50'
              }`}
            >
              {segment.label}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
