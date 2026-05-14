function getTrimmedEnvValue(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function isSupabaseAuthConfigured() {
  return Boolean(
    getTrimmedEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      getTrimmedEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}

export function isSupabaseAdminConfigured() {
  return Boolean(
    isSupabaseAuthConfigured() &&
      getTrimmedEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
  )
}

export function isSupabaseConfigured() {
  return isSupabaseAdminConfigured()
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
