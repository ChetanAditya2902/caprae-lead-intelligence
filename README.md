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

## Product structure

- `src/app/` contains the App Router pages and route handlers.
- `src/components/` contains dashboard and lead UI.
- `src/data/demo-leads.ts` and `src/types/` provide typed sample records.
- `src/lib/` is reserved for scoring, AI, database, and shared utilities.
- `GET /api/leads` and `GET /api/leads/[id]` return sample records.
- `/leads` lists sample records; `/leads/[id]` shows a record detail page.

No database, scoring service, or AI integration is configured yet.
