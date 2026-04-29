# FC Viitorul Onești Launch Checklist

Checklist scurt pentru activarea clubului in productie.

## Branding

- Verifica logo-ul din `/clubs`
- Confirma tema `viitorul-onesti`
- Verifica datele oficiale ale clubului

## Utilizatori si roluri

- Creeaza conturile reale pentru staff
- Verifica membership-urile pentru admin, antrenori si team manageri
- Confirma accesul corect pe module

## Date sportive

- Creeaza echipele reale pentru sezonul curent
- Adauga loturile reale
- Introdu meciurile si sesiunile de prezenta
- Verifica statisticile si suspendarile

## Financiar

- Testeaza o plata manuala
- Testeaza o contributie online Stripe
- Verifica reconcilierea in CRM

## Notificari si remindere

- Activeaza preferintele personale
- Sincronizeaza inbox-ul
- Trimite un reminder manual pe email
- Activeaza o programare recurenta
- Testeaza endpoint-ul `/api/reminders/run`

## Productie

- Completeaza toate variabilele din `.env.example`
- Ruleaza toate migrarile Supabase
- Activeaza cron-ul
- Ruleaza un test end-to-end complet
