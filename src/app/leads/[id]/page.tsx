import Link from "next/link";
import { notFound } from "next/navigation";
import { getDemoLeadById } from "@/lib/utils/leads";

export default async function LeadDetailPage({
  params,
}: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const lead = getDemoLeadById(id);

  if (!lead) {
    notFound();
  }

  return (
    <div className="product-page">
      <header className="product-page-header">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> LEAD DETAILS</p>
          <h1>{lead.company}</h1>
          <p className="welcome-subtitle">
            {lead.industry} · {lead.location}
          </p>
        </div>
        <Link className="button button-secondary product-back-link" href="/leads">
          Back to leads
        </Link>
      </header>

      <section aria-label={`${lead.company} details`} className="panel lead-detail-card">
        <div className="detail-company product-detail-company">
          <span className={`company-avatar ${lead.color}`}>{lead.initials}</span>
          <div>
            <h2>{lead.company}</h2>
            <p>{lead.industry}</p>
          </div>
        </div>

        <div className={`detail-score ${lead.score >= 85 ? "score-high" : lead.score >= 70 ? "score-good" : "score-watch"}`}>
          <strong>{lead.score}</strong>
          <span>/ 100<br />example score</span>
          <span className="detail-score-label">{lead.scoreLabel}</span>
        </div>

        <dl className="lead-detail-facts">
          <div><dt>Location</dt><dd>{lead.location}</dd></div>
          <div><dt>Company size</dt><dd>{lead.employees} employees</dd></div>
          <div><dt>Revenue</dt><dd>{lead.revenue}</dd></div>
          <div><dt>Contact</dt><dd>{lead.contact}<small>{lead.role}</small></dd></div>
          <div><dt>Email</dt><dd><a href={`mailto:${lead.email}`}>{lead.email}</a></dd></div>
          <div><dt>Signals</dt><dd><span className="signal-list">{lead.signals.map((signal) => <span className="signal-chip" key={signal}>{signal}</span>)}</span></dd></div>
          <div><dt>Last updated</dt><dd>{lead.updated}</dd></div>
        </dl>

        <p className="demo-notice">
          This record and its score are illustrative sample data. The scoring
          engine and AI lead brief have not been implemented yet.
        </p>
      </section>
    </div>
  );
}
