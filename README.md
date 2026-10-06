# SaaSquatch Lead Intelligence

A Next.js lead-intelligence dashboard focused on helping teams decide which
companies to prioritize. Lead scoring and AI-generated briefs are not
implemented; scores currently shown in the dashboard are illustrative demo
values, not calculated recommendations.

## Development

```bash
npm install
npm run dev
```

The application runs at [http://localhost:3000](http://localhost:3000).
Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL
connection string before installing dependencies or running Prisma commands.
Do not commit `.env`.

## Product structure

- `src/app/` contains the App Router pages and route handlers.
- `src/components/` contains dashboard and lead UI.
- `src/data/demo-leads.ts` and `src/types/` provide typed sample records.
- `src/lib/db/prisma.ts` provides the PostgreSQL-backed Prisma Client singleton.
- `src/lib/scoring/` and `src/lib/ai/` are reserved for future business logic.
- `GET /api/leads` and `GET /api/leads/[id]` return sample records.
- `/leads` lists sample records; `/leads/[id]` shows a record detail page.
- `prisma/schema.prisma` defines the PostgreSQL `Lead` model and indexes.
- `prisma/seed.ts` upserts 500 synthetic records with `.example` domains.

## Database setup

```bash
npm run db:validate
npm run db:migrate -- --name init
npm run db:seed
```

The generated Prisma Client is created at `src/generated/prisma` during
installation. The seed is repeatable and upserts only its own deterministic
record IDs. All contact names, email addresses, phone numbers, and company
domains in the seed are synthetic; score and AI fields are examples or empty
until their corresponding features are implemented.
