import { isEmailConfigured } from '@/lib/email'
import { APP_NAME, DEFAULT_CLUB_NAME, DEFAULT_SEASON } from '@/lib/app-config'
import { getPublicAppUrl, isSecurePublicAppUrl, isSupabaseConfigured } from '@/lib/env'
import { isStripeConfigured } from '@/lib/stripe'

type ReadinessTone = 'ready' | 'attention'

export interface ReadinessCheck {
  id: string
  label: string
  description: string
  ready: boolean
  tone: ReadinessTone
  recommendation?: string
}

export function isCronConfigured() {
  return Boolean(process.env.REMINDERS_CRON_SECRET)
}

export function getLaunchReadiness() {
  const publicAppUrl = getPublicAppUrl()

  const checks: ReadinessCheck[] = [
    {
      id: 'supabase-core',
      label: 'Supabase de bază',
      description: 'URL-ul proiectului și cheia anon sunt configurate pentru aplicație.',
      ready: isSupabaseConfigured(),
      tone: isSupabaseConfigured() ? 'ready' : 'attention',
      recommendation: 'Completează NEXT_PUBLIC_SUPABASE_URL și NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    },
    {
      id: 'supabase-service',
      label: 'Service role pentru job-uri',
      description: 'Cheia service role este necesară pentru cron, audit și automatizări.',
      ready: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      tone: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'ready' : 'attention',
      recommendation: 'Adaugă SUPABASE_SERVICE_ROLE_KEY doar în mediile server-side.',
    },
    {
      id: 'stripe',
      label: 'Stripe plăți online',
      description: 'Contribuțiile online și checkout-ul Stripe sunt pregătite.',
      ready: isStripeConfigured() && Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      tone: isStripeConfigured() && process.env.STRIPE_WEBHOOK_SECRET ? 'ready' : 'attention',
      recommendation: 'Setează STRIPE_SECRET_KEY și STRIPE_WEBHOOK_SECRET înainte de testul final de plată.',
    },
    {
      id: 'email',
      label: 'Email reminders',
      description: 'Providerul de email este configurat pentru digest și remindere.',
      ready: isEmailConfigured(),
      tone: isEmailConfigured() ? 'ready' : 'attention',
      recommendation: 'Configurează RESEND_API_KEY, EMAIL_FROM și ideal EMAIL_REPLY_TO.',
    },
    {
      id: 'cron',
      label: 'Cron pentru remindere',
      description: 'Secretul pentru endpoint-ul programat este setat.',
      ready: isCronConfigured(),
      tone: isCronConfigured() ? 'ready' : 'attention',
      recommendation: 'Adaugă REMINDERS_CRON_SECRET și activează job-ul din Vercel Cron.',
    },
    {
      id: 'app-url',
      label: 'App URL public',
      description: 'URL-ul public este necesar pentru redirect-uri și webhook-uri.',
      ready: isSecurePublicAppUrl(),
      tone: isSecurePublicAppUrl() ? 'ready' : 'attention',
      recommendation: publicAppUrl
        ? 'Folosește HTTPS în producție pentru redirect-uri și webhook-uri stabile.'
        : 'Completează NEXT_PUBLIC_APP_URL cu domeniul public al aplicației.',
    },
    {
      id: 'product-defaults',
      label: 'Identitate produs',
      description: 'Numele aplicației și sezonul implicit sunt configurate pentru lansare.',
      ready: Boolean(APP_NAME && DEFAULT_SEASON && DEFAULT_CLUB_NAME),
      tone: APP_NAME && DEFAULT_SEASON && DEFAULT_CLUB_NAME ? 'ready' : 'attention',
      recommendation: 'Verifică APP_NAME, DEFAULT_SEASON și DEFAULT_CLUB_NAME pentru sezonul activ.',
    },
  ]

  const readyCount = checks.filter((check) => check.ready).length
  const percent = Math.round((readyCount / checks.length) * 100)
  const pendingChecks = checks.filter((check) => !check.ready)

  return {
    checks,
    readyCount,
    totalCount: checks.length,
    percent,
    allReady: checks.every((check) => check.ready),
    pendingChecks,
    publicAppUrl,
  }
}
