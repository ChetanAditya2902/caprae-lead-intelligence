import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

const PAGE_SIZE = 50;

export default async function LeadsPage() {
  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      orderBy: [
        { opportunityScore: { sort: "desc", nulls: "last" } },
        { companyName: "asc" },
        { id: "asc" },
      ],
      take: PAGE_SIZE,
      select: {
        id: true,
        companyName: true,
        industry: true,
        location: true,
        opportunityScore: true,
        scoreTier: true,
      },
    }),
    prisma.lead.count(),
  ]);

  return (
    <main className="intelligence-dashboard">
      <header className="intelligence-header">
        <div className="intelligence-brand">
          <span aria-hidden="true" className="intelligence-brand-mark">S</span>
          <span>SaaSquatch</span>
          <span className="brand-divider">/</span>
          <Link className="brand-product" href="/">Lead Intelligence</Link>
        </div>
      </header>
      <section className="lead-list-page">
        <Link className="detail-back-link" href="/">← Back to overview</Link>
        <div className="workspace-heading">
          <div>
            <p className="intelligence-eyebrow">LEAD WORKSPACE</p>
            <h1>All leads</h1>
            <p>Showing the 50 highest-priority records out of {total.toLocaleString()} leads.</p>
          </div>
        </div>
        <div className="panel intelligence-table-scroll">
          <table className="intelligence-table">
            <thead><tr><th scope="col">Company</th><th scope="col">Industry</th><th scope="col">Location</th><th scope="col">Score</th><th scope="col">Priority</th></tr></thead>
            <tbody>
              {leads.map((lead) => {
                const scoreClass = lead.scoreTier === "HIGH"
                  ? "priority-high"
                  : lead.scoreTier === "MEDIUM"
                    ? "priority-medium"
                    : lead.scoreTier === "LOW"
                      ? "priority-low"
                      : "priority-unscored";
                return (
                  <tr key={lead.id}>
                    <td><Link className="intelligence-company-link" href={`/leads/${lead.id}`} prefetch={false}><strong>{lead.companyName}</strong></Link></td>
                    <td>{lead.industry ?? "—"}</td>
                    <td>{lead.location ?? "—"}</td>
                    <td><span className={`lead-score-number ${scoreClass}`}>{lead.opportunityScore ?? "—"}</span></td>
                    <td><span className={`priority-badge ${scoreClass}`}>{lead.scoreTier ?? "Unscored"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
