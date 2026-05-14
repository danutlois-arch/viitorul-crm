import { createClient } from '@supabase/supabase-js'
import { isSupabaseAdminConfigured } from '@/lib/env'

export function createSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      'Supabase admin client nu este configurat complet. Verifică NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY și SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? ''
  )
}

export function getSupabaseServiceRoleDiagnostic() {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!rawKey) {
    return 'missing'
  }

  const parts = rawKey.split('.')

  if (parts.length !== 3) {
    return rawKey.startsWith('sb_secret_') ? 'secret-key-format' : 'invalid'
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
      role?: string
    }

    return payload.role ?? 'unknown'
  } catch {
    return 'invalid'
  }
}
