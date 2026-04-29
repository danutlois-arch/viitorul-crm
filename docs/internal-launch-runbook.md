# Internal Launch Runbook

Runbook scurt pentru lansarea interna a CRM-ului la FC Viitorul Onesti.

## 1. Verificare locala finala

Ruleaza:

```bash
npm run launch:check
npm run build
```

Scop:

- verifici ca toate fisierele critice exista
- verifici ca env-urile nu mai sunt placeholder
- confirmi ca build-ul de productie trece

## 2. Configureaza mediul de productie

Completeaza in platforma de deploy:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_DEFAULT_SEASON`
- `NEXT_PUBLIC_DEFAULT_CLUB_NAME`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `REMINDERS_CRON_SECRET`

Reguli:

- `NEXT_PUBLIC_APP_URL` trebuie sa fie URL-ul final HTTPS
- `REMINDERS_CRON_SECRET` nu trebuie sa ramana `change-me`
- nu expune `SUPABASE_SERVICE_ROLE_KEY` in client

## 3. Ruleaza migrarile Supabase

Aplica:

- `supabase/schema.sql`
- toate fisierele din `supabase/migrations`

Ordine recomandata:

1. schema de baza
2. branding
3. storage
4. Stripe contributions
5. user notifications
6. email dispatches
7. scheduled reminders
8. activity logs

## 4. Configureaza infrastructura externa

### Stripe

- configureaza cheia secreta
- configureaza webhook catre `/api/stripe/webhook`
- testeaza `checkout.session.completed`

### Resend

- valideaza domeniul sau sender-ul
- trimite un email de test

### Vercel Cron

- confirma ca job-ul pentru `/api/reminders/run` este activ
- confirma ca request-ul trimite `x-cron-secret`

## 5. Configureaza clubul in aplicatie

Din `/clubs`:

- incarca logo-ul oficial
- confirma tema `viitorul-onesti`
- verifica datele oficiale ale clubului
- adauga utilizatorii reali si rolurile lor

## 6. Test end-to-end minim

Testeaza in aceasta ordine:

1. login
2. creare echipa
3. creare jucator
4. creare plata
5. creare contributie Stripe
6. creare meci
7. creare prezenta
8. creare statistica
9. creare suspendare
10. reminder manual email
11. cron manual la `/api/reminders/run`

## 7. Soft launch intern

Da acces doar pentru:

- admin club
- director sportiv
- 1 antrenor
- 1 team manager

Evita lansarea larga in prima zi. Monitorizeaza primele folosiri reale si noteaza orice blocaj operational.

## 8. Semnal de go-live

Poti considera lansarea interna reusita cand:

- build-ul trece
- login-ul merge
- datele se salveaza in Supabase
- platile Stripe se reconciliaza
- emailurile se trimit
- cron-ul ruleaza
- rolurile limiteaza corect editarea
