# Tech Stack

## Frontend
- **Framework**: React with JSX
- **Build Tool**: Vite
- **Deployment**: Web application (browser-based)

## Backend
- **Platform**: Supabase
  - **Database**: PostgreSQL with Row-Level Security (RLS)
  - **Auth**: Supabase Auth (JWT-based, role claims)
  - **Storage**: Supabase Storage (file attachments, certificates, publications)
  - **Edge Functions**: Deno-based serverless functions for privileged operations
  - **Realtime**: Supabase Realtime (feature flag live updates)

## Key Libraries
- Supabase JS client (`@supabase/supabase-js`) for all DB, auth, storage, and realtime interactions
- PDF generation library for certificate and report PDF export
- React Context API for `RoleProvider` and `FeatureFlagProvider`

## Project Structure Convention
- `src/modules/` — one folder per feature module
- `src/shared/` — reusable components (`DynamicForm`, `ReportRenderer`)
- `src/app/` — router, providers, layout (`router.jsx`, `FeatureFlagProvider.jsx`, `RoleProvider.jsx`, `Layout.jsx`)
- `supabase/migrations/` — all database schema migrations
- `supabase/functions/` — all Edge Functions

## Common Commands

```bash
# Install dependencies
npm install

# Start web dev server
npm run dev

# Build for production
npm run build

# Run tests (single pass)
npx vitest --run

# Apply Supabase migrations
npx supabase db push

# Deploy Edge Functions
npx supabase functions deploy <function-name>

# Generate TypeScript types from DB schema
npx supabase gen types typescript --local > src/types/supabase.ts
```

## Edge Functions

All Edge Functions live in `supabase/functions/`. Every function shares a security middleware that:
1. Validates the JWT from the `Authorization` header (401 if invalid/expired)
2. Checks the role claim against allowed roles (403 if insufficient)
3. Logs the invocation to `edge_function_log`

Never expose the Supabase service-role key to the frontend client.
