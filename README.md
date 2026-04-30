# ClubPilot

Platformă SaaS pentru cluburi și academii de fotbal din România, construită cu `Next.js 14`, `TypeScript`, `Tailwind CSS` și pregătită pentru `Supabase`.

## Ce include

- App Router și structură modulară pentru paginile:
  - `/login`
  - `/dashboard`
  - `/clubs`
  - `/teams`
  - `/players`
  - `/payments`
  - `/attendance`
  - `/matches`
  - `/statistics`
  - `/suspensions`
  - `/reports`
- Componente reutilizabile:
  - `Sidebar`
  - `Header`
  - `DataTable`
  - `PlayerForm`
  - `TeamForm`
  - `MatchForm`
  - `AttendanceForm`
  - `PaymentStatusBadge`
  - `StatCard`
- Date demo pentru `FC Viitorul Onești`
- Schema SQL Supabase cu tabele multi-club și politici Row Level Security

## Pornire locală

1. Instalează dependențele:

```bash
npm install
```

2. Creează fișierul `.env.local` pe baza lui `.env.example`

3. Rulează aplicația:

```bash
npm run dev
```

Pentru verificarea finală înainte de lansare:

```bash
npm run launch:check
```

Poți configura și default-urile de produs prin:

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_DEFAULT_SEASON`
- `NEXT_PUBLIC_DEFAULT_CLUB_NAME`

## Supabase

Schema bazei de date și politicile RLS sunt în:

- `supabase/schema.sql`
- `supabase/migrations/2026-04-29_stripe_contributions.sql`
- `supabase/migrations/2026-04-29_club_branding.sql`

Ideea de acces multi-club:

- fiecare utilizator are profil în `profiles`
- apartenența la un club și rolul sunt în `club_memberships`
- toate tabelele operaționale au `club_id`
- politicile folosesc `auth.uid()` și funcția `has_club_access(club_id)`

## Branding club

Modulul `/clubs` permite:

- actualizare date club
- setare `logo_url`
- upload real în Supabase Storage pentru logo
- alegere `theme_key` implicit pe club

Rulează și migrarea de branding:

```sql
\i supabase/migrations/2026-04-29_club_branding.sql
```

Pentru upload logo prin Storage, creează bucket-ul public `club-assets`.

## Stripe

Integrarea actuală folosește `Stripe Checkout` pentru donații și sponsorizări online.

### Variabile necesare

Adaugă în `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Setup minim

1. Rulează migrarea pentru contribuții:

```sql
-- rulează în Supabase SQL editor
\i supabase/migrations/2026-04-29_stripe_contributions.sql
```

2. În Stripe Dashboard:

- creează sau folosește un cont Stripe activ
- copiază `Secret key`
- creează webhook pentru:
  - `checkout.session.completed`
- setează endpoint-ul:
  - `http://localhost:3000/api/stripe/webhook` pentru test local prin Stripe CLI
  - sau URL-ul public al aplicației în producție

3. Pornește aplicația:

```bash
npm run dev
```

### Test local cu Stripe CLI

1. Autentifică Stripe CLI:

```bash
stripe login
```

2. Forward pentru webhook local:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

3. Copiază secretul `whsec_...` afișat de Stripe CLI în `.env.local`

4. Creează o contribuție online din modulul `/payments`

5. Finalizează plata cu cardul de test:

```text
4242 4242 4242 4242
orice dată viitoare
orice CVC
```

### Flux curent

- CRM-ul creează o înregistrare `funding_contributions`
- pentru contribuțiile `online`, aplicația creează un `Stripe Checkout Session`
- utilizatorul este redirecționat către Stripe
- webhook-ul `checkout.session.completed` marchează contribuția ca `paid`

### Ce urmărește CRM-ul

- donații online
- sponsorizări online
- link de checkout generat
- status plată
- reconciliere prin `external_checkout_id`

## Email reminders

Aplicația este pregătită și pentru remindere pe email, folosind `Resend` ca provider.

### Variabile necesare

Adaugă în `.env.local`:

```bash
RESEND_API_KEY=re_...
EMAIL_FROM="CRM FC Viitorul Onesti <noreply@fcviitorulonesti.ro>"
EMAIL_REPLY_TO=office@fcviitorulonesti.ro
```

### Migrare

Rulează și migrarea pentru jurnalul de email:

```sql
\i supabase/migrations/2026-04-29_email_dispatches.sql
```

### Ce include acum

- preferințe de notificări per utilizator
- inbox persistent de notificări
- trimitere manuală a unui reminder pe email către utilizatorul curent
- jurnal `email_dispatches` pentru audit

## Scheduled reminders

Scaffold-ul pentru remindere recurente este pregătit pentru:

- programare per utilizator
- rulare manuală `Run now`
- istoric de rulare
- endpoint pentru cron extern

### Variabile necesare

```bash
REMINDERS_CRON_SECRET=change-me
```

### Migrare

```sql
\i supabase/migrations/2026-04-29_scheduled_reminders.sql
```

### Endpoint cron

Trimite un `POST` către:

```text
/api/reminders/run
```

cu header:

```text
x-cron-secret: REMINDERS_CRON_SECRET
```

### Vercel Cron

Proiectul include deja configurare de baza in [vercel.json](/Users/laviniabarla/Desktop/viitorul-crm/vercel.json) pentru rulare:

- Luni-Vineri la `09:00`
- endpoint: `/api/reminders/run`

### Checklist operare

Vezi si [docs/ops-checklist.md](/Users/laviniabarla/Desktop/viitorul-crm/docs/ops-checklist.md) pentru activarea completa in productie.
Pentru activarea FC Viitorul Onești, vezi [docs/fc-viitorul-launch-checklist.md](/Users/laviniabarla/Desktop/viitorul-crm/docs/fc-viitorul-launch-checklist.md).
Pentru ordinea exacta de lansare interna, vezi [docs/internal-launch-runbook.md](/Users/laviniabarla/Desktop/viitorul-crm/docs/internal-launch-runbook.md).
