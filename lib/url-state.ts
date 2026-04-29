export function buildPathWithParams(
  pathname: string,
  current: Record<string, string | undefined>,
  updates: Record<string, string | number | undefined | null>
) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(current)) {
    if (typeof value === 'string' && value.length > 0) {
      params.set(key, value)
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null || value === '') {
      params.delete(key)
      continue
    }

    params.set(key, String(value))
  }

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
