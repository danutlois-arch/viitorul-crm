import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  description: string
  accent?: 'green' | 'dark'
}

export function StatCard({ title, value, description, accent = 'green' }: StatCardProps) {
  return (
    <article
      className={cn(
        'rounded-3xl border p-5 shadow-card',
        accent === 'green'
          ? 'border-brand-100 bg-white'
          : 'border-white/10 bg-pitch text-white'
      )}
    >
      <p className={cn('text-sm', accent === 'green' ? 'text-slate-500' : 'text-white/70')}>
        {title}
      </p>
      <h3 className={cn('mt-3 text-3xl font-semibold', accent === 'green' ? 'text-slate-950' : 'text-white')}>
        {value}
      </h3>
      <p className={cn('mt-2 text-sm', accent === 'green' ? 'text-slate-500' : 'text-white/70')}>
        {description}
      </p>
    </article>
  )
}
