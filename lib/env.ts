function getTrimmedEnvValue(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function getPublicAppUrl() {
  return getTrimmedEnvValue(process.env.NEXT_PUBLIC_APP_URL)
}

export function isSecurePublicAppUrl() {
  const publicAppUrl = getPublicAppUrl()

  if (!publicAppUrl) {
    return false
  }

  return publicAppUrl.startsWith('https://') || publicAppUrl.startsWith('http://localhost')
}
