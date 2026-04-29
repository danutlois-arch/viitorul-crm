import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const entries = {}

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    entries[key] = value
  }

  return entries
}

function resolveEnv() {
  const example = loadEnvFile(path.join(cwd, '.env.example'))
  const local = loadEnvFile(path.join(cwd, '.env.local'))
  return { ...example, ...local, ...process.env }
}

function checkValue(value, invalidValues = []) {
  if (!value) {
    return false
  }

  return !invalidValues.includes(value)
}

function printSection(title) {
  console.log(`\n${title}`)
}

function printResult(status, label, detail) {
  const icon = status === 'pass' ? 'PASS' : status === 'warn' ? 'WARN' : 'FAIL'
  console.log(`${icon}  ${label}${detail ? ` — ${detail}` : ''}`)
}

const env = resolveEnv()
const requiredChecks = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    label: 'Supabase URL',
    invalidValues: ['https://your-project.supabase.co'],
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    label: 'Supabase anon key',
    invalidValues: ['your-anon-key'],
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    label: 'Supabase service role key',
    invalidValues: ['your-service-role-key'],
  },
  {
    key: 'STRIPE_SECRET_KEY',
    label: 'Stripe secret key',
    invalidValues: ['sk_test_...'],
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    label: 'Stripe webhook secret',
    invalidValues: ['whsec_...'],
  },
  {
    key: 'RESEND_API_KEY',
    label: 'Resend API key',
    invalidValues: ['re_...'],
  },
  {
    key: 'EMAIL_FROM',
    label: 'Email sender',
  },
  {
    key: 'REMINDERS_CRON_SECRET',
    label: 'Cron secret',
    invalidValues: ['change-me'],
  },
]

let hasFailures = false

printSection('Environment')
for (const check of requiredChecks) {
  const value = env[check.key]
  const ok = checkValue(value, check.invalidValues)
  if (!ok) {
    hasFailures = true
    printResult('fail', check.label, `${check.key} lipsește sau are valoare placeholder`)
  } else {
    printResult('pass', check.label, check.key)
  }
}

const appUrl = env.NEXT_PUBLIC_APP_URL
if (!appUrl) {
  hasFailures = true
  printResult('fail', 'App URL public', 'NEXT_PUBLIC_APP_URL lipsește')
} else if (appUrl.startsWith('https://')) {
  printResult('pass', 'App URL public', appUrl)
} else if (appUrl.startsWith('http://localhost')) {
  printResult('warn', 'App URL public', 'este local; în producție trebuie schimbat pe HTTPS')
} else {
  hasFailures = true
  printResult('fail', 'App URL public', 'în producție trebuie să folosească HTTPS')
}

printSection('Project files')
const requiredFiles = [
  'vercel.json',
  'supabase/schema.sql',
  'docs/ops-checklist.md',
  'docs/fc-viitorul-launch-checklist.md',
  'app/api/reminders/run/route.ts',
  'app/api/stripe/webhook/route.ts',
]

for (const relativeFile of requiredFiles) {
  const exists = fs.existsSync(path.join(cwd, relativeFile))
  if (!exists) {
    hasFailures = true
    printResult('fail', relativeFile, 'fișier lipsă')
  } else {
    printResult('pass', relativeFile)
  }
}

printSection('Supabase migrations')
const migrationFiles = [
  '2026-04-29_activity_logs.sql',
  '2026-04-29_club_branding.sql',
  '2026-04-29_email_dispatches.sql',
  '2026-04-29_scheduled_reminders.sql',
  '2026-04-29_storage_club_assets.sql',
  '2026-04-29_stripe_contributions.sql',
  '2026-04-29_user_notifications.sql',
]

for (const file of migrationFiles) {
  const exists = fs.existsSync(path.join(cwd, 'supabase/migrations', file))
  if (!exists) {
    hasFailures = true
    printResult('fail', file, 'migrare lipsă')
  } else {
    printResult('pass', file)
  }
}

printSection('Deploy configuration')
try {
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(cwd, 'vercel.json'), 'utf8'))
  const cron = vercelConfig.crons?.find((item) => item.path === '/api/reminders/run')

  if (!cron) {
    hasFailures = true
    printResult('fail', 'Vercel cron', 'lipsește job-ul pentru /api/reminders/run')
  } else {
    printResult('pass', 'Vercel cron', `${cron.path} @ ${cron.schedule}`)
  }
} catch {
  hasFailures = true
  printResult('fail', 'Vercel cron', 'nu am putut citi vercel.json')
}

printSection('Product defaults')
printResult('pass', 'App name', env.NEXT_PUBLIC_APP_NAME || 'Football Club SaaS')
printResult('pass', 'Default season', env.NEXT_PUBLIC_DEFAULT_SEASON || '2025/2026')
printResult('pass', 'Default club', env.NEXT_PUBLIC_DEFAULT_CLUB_NAME || 'FC Viitorul Onești')

printSection('Summary')
if (hasFailures) {
  printResult('fail', 'Launch readiness', 'mai există blocaje înainte de lansarea internă')
  process.exitCode = 1
} else {
  printResult('pass', 'Launch readiness', 'repo-ul este pregătit; rămân doar activările externe și testul final')
}
