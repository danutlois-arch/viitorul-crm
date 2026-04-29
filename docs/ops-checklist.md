# Ops Checklist

Checklist scurt pentru activarea reminder-elor automate in productie.

## 1. Supabase

- Ruleaza migrarile:
  - `supabase/migrations/2026-04-29_user_notifications.sql`
  - `supabase/migrations/2026-04-29_email_dispatches.sql`
  - `supabase/migrations/2026-04-29_scheduled_reminders.sql`
- Verifica daca `SUPABASE_SERVICE_ROLE_KEY` este setata in mediul de productie.

## 2. Email provider

- Seteaza:
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
  - `EMAIL_REPLY_TO`
- Trimite un reminder manual din `/clubs` pentru validare.

## 3. Cron secret

- Seteaza `REMINDERS_CRON_SECRET` in productie.
- Daca folosesti Vercel Cron, configureaza acelasi secret si la request:
  - header `x-cron-secret`

## 4. Vercel

- Fisierul `vercel.json` programeaza endpoint-ul:
  - `/api/reminders/run`
  - Luni-Vineri la `09:00`
- Ajusteaza orarul daca vrei alta ora implicita la nivel de platforma.

## 5. Teste finale

- Activeaza preferinta `emailEnabled` pentru utilizatorul de test.
- Configureaza un `ReminderSchedule` activ.
- Ruleaza manual:
  - `POST /api/reminders/run`
- Verifica:
  - tabela `email_dispatches`
  - tabela `reminder_run_logs`
  - inbox-ul de notificari
  - emailul primit efectiv

## 6. Operare zilnica

- Monitorizeaza erorile din `email_dispatches`
- Monitorizeaza `reminder_run_logs` pentru run-uri esuate
- Revizuieste lunar ora si frecventa implicita pentru cluburi
