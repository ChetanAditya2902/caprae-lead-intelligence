# SaaSquatch Lead Intelligence

A Next.js lead-intelligence dashboard focused on helping teams decide which
companies to prioritize. Opportunity scores are deterministic and explainable;
AI-generated lead briefs are server-side analysis, separate from company facts
and numeric scores.

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
- `src/types/` contains shared lead and API response types.
- `src/lib/db/prisma.ts` provides the PostgreSQL-backed Prisma Client singleton.
- `src/lib/scoring/` contains the deterministic, configurable 0–100 lead scoring engine.
- `src/lib/ai/` contains server-side AI Lead Brief generation and validation; no LLM controls the score.
- `GET /api/leads` and `GET /api/leads/[id]` return database-backed lead records.
- `GET /api/ai/leads/[id]/brief` generates and stores a lead brief server-side.
- `/` provides the dashboard, lead quality analytics, filters, sorting, and CSV export.
- `/leads/[id]` shows a record detail page and its score explanation.
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
in the seed are synthetic.

## Lead opportunity scoring

`scoreLead(lead)` from `src/lib/scoring` returns an integer score from 0 to 100,
a priority tier, each factor's points and explanation, and a combined reasons
list. `src/lib/scoring/config.ts` is the central place to adjust factor weights,
fit ranges, target industries, technologies, countries, neutral-data allowance,
and tier thresholds.

The default factor weights are:

| Scoring factor | Weight |
| --- | ---: |
| Industry fit | 20 |
| Company size fit | 15 |
| Revenue fit | 15 |
| Growth signals | 15 |
| Technology fit | 10 |
| Location fit | 10 |
| Contact completeness | 10 |
| Data quality | 5 |
| **Total** | **100** |

The scoring framework is deterministic and configurable, allowing the business
to adapt qualification criteria without changing the UI. Keep the weights
totaling 100 so the score remains on the same 0–100 scale and the existing
priority thresholds remain meaningful. Missing information receives
configurable neutral partial credit; explicit negative signals are identified
separately. Scoring uses no LLM and does not depend on the current time.

Run the scoring unit tests with:

```bash
npm test
```
