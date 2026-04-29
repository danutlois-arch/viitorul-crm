import { headers } from 'next/headers'

export function getActionRedirectUrl(options: {
  fallbackPath: string
  message: string
  tone?: 'success' | 'error' | 'info'
  clearKeys?: string[]
}) {
  const requestHeaders = headers()
  const referer = requestHeaders.get('referer')
  const url = new URL(referer ?? options.fallbackPath, 'http://localhost:3000')

  url.searchParams.delete('flash')
  url.searchParams.delete('flashType')

  for (const key of options.clearKeys ?? []) {
    url.searchParams.delete(key)
  }

  url.searchParams.set('flash', options.message)
  url.searchParams.set('flashType', options.tone ?? 'success')

  return `${url.pathname}${url.search}`
}
