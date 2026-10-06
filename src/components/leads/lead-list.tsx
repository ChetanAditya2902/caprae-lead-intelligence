import Link from "next/link";
import { demoLeads } from "@/data/demo-leads";

export default function LeadList() {
  return (
    <div className="product-page">
      <header className="product-page-header">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> LEAD WORKSPACE</p>
          <h1>Lead opportunities</h1>
          <p className="welcome-subtitle">
            Browse your lead records and open a company for more details.
          </p>
        </div>
        <Link className="button button-secondary product-back-link" href="/">
          Back to overview
        </Link>
      </header>

      <section aria-label="Lead list" className="panel product-lead-list">
        <div className="product-list-heading">
          <div>
            <h2>All leads</h2>
            <p>Sample records for the dashboard preview</p>
          </div>
          <span className="count-pill">{demoLeads.length} leads</span>
        </div>
        {demoLeads.map((lead) => (
          <Link
            className="product-lead-row"
            href={`/leads/${lead.id}`}
            key={lead.id}
          >
            <span className={`company-avatar ${lead.color}`}>{lead.initials}</span>
            <span className="product-lead-company">
              <strong>{lead.company}</strong>
              <small>{lead.industry} · {lead.location}</small>
            </span>
            <span className="product-lead-contact">
              <strong>{lead.contact}</strong>
              <small>{lead.role}</small>
            </span>
            <span className="product-lead-score">
              <strong>{lead.score}</strong>
              <small>Example score</small>
            </span>
            <span className="signal-list">
              {lead.signals.slice(0, 2).map((signal) => (
                <span className="signal-chip" key={signal}>{signal}</span>
              ))}
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
