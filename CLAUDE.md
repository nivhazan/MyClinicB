# MyClinicB — Clinic Management App

## Architecture

Full-stack clinic management app (Hebrew RTL UI).

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite 6 + TanStack React Query |
| UI | Radix UI + Tailwind CSS (shadcn/ui style) |
| Forms | React Hook Form + Zod |
| Backend | Express (Node.js) on port 4000 |
| Database | Prisma ORM + SQLite (`server/prisma/dev.db`) |
| AI | Anthropic API (server-side only, receipt analysis) |

## Project Structure

```
src/
├── api/           → expressClient.js (API layer), base44Client.mock.js (offline mock)
├── components/    → Feature-based: payments/, calendar/, patients/, expenses/, ...
├── pages/         → Route pages (Payments, Calendar, Patients, Dashboard, ...)
├── lib/           → Utilities (receiptAnalysis.js, AuthContext.jsx, ...)
├── hooks/         → Custom React hooks
└── ui/            → shadcn/ui primitives (Button, Dialog, Card, ...)

server/
├── index.js       → Express API with generic CRUD factory + business logic
├── prisma/
│   └── schema.prisma → 14 models (Patient, Appointment, Payment, Expense, ...)
```

## Key Conventions

- **API pattern**: Frontend uses `base44.entities.EntityName.list/filter/create/update/delete()` interface. The `expressClient.js` implements this over REST.
- **Data format**: Frontend uses `snake_case` keys; backend converts to/from `camelCase` for Prisma.
- **Business logic** lives in the Express backend (payment validation, duplicate checks, auto-fix appointment status). Frontend does NOT duplicate validation.
- **Hebrew UI**: All user-facing strings in Hebrew. Status values like `מתוכנן`, `בוצע`, `בוטל`.
- **Receipt analysis**: Handled server-side via `/api/analyze-receipt`. API key never exposed to frontend.

## Common Commands

```bash
# Frontend dev server
npm run dev

# Backend server
cd server && node index.js

# Both together
npm run dev:full

# Prisma migration after schema changes
cd server && npx prisma migrate dev

# Prisma generate client
cd server && npx prisma generate

# Lint
npm run lint
npm run lint:fix
```

## Git Workflow

- Commit incrementally by logical unit (schema, API, client, cleanup)
- Descriptive commit messages in English
- Never commit `.db` files or `.env`

## When Modifying

- **Prisma schema**: Always run `npx prisma migrate dev` after changes
- **New entity**: Add to `schema.prisma`, register in `server/index.js` via `registerCrud()`, add to `expressClient.js` entities map, add to `base44Client.mock.js`
- **Payment logic**: All validation in `server/index.js` `beforeCreate` hook — do NOT add client-side guards
- **AI/API keys**: Keep server-side only. Use `process.env.ANTHROPIC_API_KEY`
