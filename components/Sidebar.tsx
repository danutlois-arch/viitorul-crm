'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClubLogo } from '@/components/ClubLogo'
import { navigation } from '@/lib/navigation'
import { cn } from '@/lib/utils'

interface SidebarProps {
  clubName: string
  city: string
  county: string
  source: 'supabase' | 'demo'
  logoPath?: string
}

export function Sidebar({ clubName, city, county, source, logoPath }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-pitch px-4 py-5 text-white shadow-card">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-4">
          {logoPath ? (
            <ClubLogo
              src={logoPath}
              alt={clubName}
              className="h-16 w-16 p-1.5"
              imageClassName="p-1"
              fallbackClassName="text-sm"
            />
          ) : null}
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/60">Club activ</p>
            <h1 className="mt-2 text-xl font-semibold leading-tight">{clubName}</h1>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/70">
          {city}, {county}
        </p>
      </div>

      <nav className="mt-6 grid flex-1 grid-cols-2 gap-2 overflow-y-auto lg:flex lg:grid-cols-1 lg:flex-col">
        {navigation.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-white/10 lg:px-4',
                active ? 'bg-brand-500 text-white' : 'text-white/75'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        {source === 'supabase' ? 'Conectat la Supabase' : 'Multi-club ready'}
        <p className="mt-2 text-xs leading-6 text-white/55">
          {source === 'supabase'
            ? 'Sesiunea este activă, iar accesul la date este filtrat pe club prin politici RLS.'
            : 'Toate modulele sunt gândite pentru filtrare pe `club_id` și politici RLS în Supabase.'}
        </p>
      </div>
    </aside>
  )
}
