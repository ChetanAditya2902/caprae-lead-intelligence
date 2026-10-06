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
- `src/lib/scoring/` contains a deterministic, configurable 0–100 lead scoring engine.
- `src/lib/ai/` is reserved for future business logic; no LLM controls the score.
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
installation. The seed is repeatable and upserts only its own deterministic record IDs. It
uses the same scoring engine as the application for score, tier, and factor
reasons. All contact names, email addresses, phone numbers, and company domains
in the seed are synthetic; AI fields remain empty until the AI feature is
implemented.

## Lead opportunity scoring

`scoreLead(lead)` from `src/lib/scoring` returns an integer score from 0 to 100,
a priority tier, each factor's points and explanation, and a combined reasons
list. `src/lib/scoring/config.ts` holds the weights, fit ranges, target
industries, technologies, countries, neutral-data allowance, and tier
thresholds. Missing information receives configurable neutral partial credit;
explicit negative signals are identified separately. Scoring uses no LLM and
does not depend on the current time.

Run the scoring unit tests with:

```bash
npm test
```
