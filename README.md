# Service Ceo (Properties)

Manage your own home and your rental properties in one place: properties, recurring
maintenance tasks, service history and spend. Built with Expo (React Native + TypeScript)
and Supabase (login + database), using the same setup as the Service Ceo maintenance app.

## What it does

- Sign in / create account (Supabase Auth, email + password).
- Add properties: **My home**, **Rental** (tenant, contact, monthly rent) or **Other**.
- Per property: recurring maintenance tasks (repeat every N days), **Mark done** logging,
  history and total maintenance spend.
- Dashboard: property count, Overdue and Due soon tiles, maintenance due, and work done in
  the last 30 days.
- Every row is private to the signed-in user (Supabase Row Level Security).

## Project structure

```
app/
  _layout.tsx        Root layout, auth gate
  login.tsx          Sign in / create account
  index.tsx          Dashboard
  property/new.tsx   Add property
  property/[id].tsx  Property detail, tasks, history
src/
  supabase.ts        Supabase client
  auth.tsx           Session + sign in/out
  store.tsx          Data loading + actions (Supabase)
  maintenance.ts     Due-date logic
  types.ts, theme.ts
  components/        Tile, DueRow, ui (Button, Field)
```

## Database

Tables `properties`, `maintenance_tasks`, `maintenance_logs`, all with RLS so users only
see their own rows. The schema was applied to the Supabase project as a migration.

## Run it

1. Install Node.js LTS and the **Expo Go** app on your phone (same Wi-Fi as your computer).
2. Copy `.env.example` to `.env` and paste your Supabase **publishable** key
   (Supabase dashboard > Connect). Never use the secret / service_role key in the app.
3. Run:
   ```
   npm run setup
   npm start
   ```
4. Scan the QR code with Expo Go.

## Next steps

- Edit properties and tasks, per-service cost/notes form.
- Photos and documents (Supabase Storage).
- Push notifications when maintenance comes due.
- Sharing a property with a spouse or property manager.
