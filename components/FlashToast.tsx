'use client'

import { useEffect, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const toneClasses = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-brand-200 bg-brand-50 text-brand-900',
} as const

export function FlashToast() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const message = searchParams.get('flash')
  const tone = (searchParams.get('flashType') ?? 'success') as keyof typeof toneClasses

  const nextUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('flash')
    params.delete('flashType')
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])

  useEffect(() => {
    if (!message) {
      return
    }

    const timeout = window.setTimeout(() => {
      router.replace(nextUrl, { scroll: false })
    }, 4500)

    return () => window.clearTimeout(timeout)
  }, [message, nextUrl, router])

  if (!message) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        className={`pointer-events-auto flex w-full max-w-xl items-start justify-between gap-4 rounded-[1.75rem] border px-5 py-4 shadow-2xl backdrop-blur ${toneClasses[tone] ?? toneClasses.success}`}
      >
        <div>
          <p className="text-sm font-semibold">Actualizare CRM</p>
          <p className="mt-1 text-sm opacity-90">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => router.replace(nextUrl, { scroll: false })}
          className="rounded-xl border border-current/15 px-3 py-2 text-xs font-semibold opacity-80 transition hover:opacity-100"
        >
          Închide
        </button>
      </div>
    </div>
  )
}
