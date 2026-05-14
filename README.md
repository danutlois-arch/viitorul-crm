# Viitorul CRM

Platformă internă pentru administrarea clubului FC Viitorul Onești:

- cluburi și branding
- membership-uri și roluri
- echipe și loturi
- taxe și contribuții
- prezență, meciuri, statistici, suspendări
- notificări, remindere și `Coach Center`

Stack principal:

- `Next.js 14` App Router
- `TypeScript`
- `Tailwind CSS`
- `Supabase` pentru auth, database și storage
- `Stripe` pentru contribuții online

## Scripturi folosite pentru CRM

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run launch:check
```

## Configurare mediu

Vezi [.env.example](/Users/laviniabarla/Desktop/viitorul-crm/.env.example).

Pentru funcționare live sunt necesare cel puțin:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Pentru reminder-e, email și plăți:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `REMINDERS_CRON_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Supabase

Schema principală este în:

[schema.sql](/Users/laviniabarla/Desktop/viitorul-crm/supabase/schema.sql)

Migrarea pentru `Coach Center` este în:

[2026-05-01_coach_center.sql](/Users/laviniabarla/Desktop/viitorul-crm/supabase/migrations/2026-05-01_coach_center.sql)

## Lansare internă

Checklist-uri utile:

- [ops-checklist.md](/Users/laviniabarla/Desktop/viitorul-crm/docs/ops-checklist.md)
- [fc-viitorul-launch-checklist.md](/Users/laviniabarla/Desktop/viitorul-crm/docs/fc-viitorul-launch-checklist.md)
- [internal-launch-runbook.md](/Users/laviniabarla/Desktop/viitorul-crm/docs/internal-launch-runbook.md)

## Notă despre `src/` și Vite

Repo-ul conține încă un MVP Vite mai vechi în `src/` și scripturi `legacy:mvp:*`.
Acestea nu fac parte din fluxul principal Viitorul CRM și nu trebuie folosite pentru dezvoltarea curentă a aplicației Next.js.
