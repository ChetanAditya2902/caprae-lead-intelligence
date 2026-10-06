import Link from "next/link";
import { notFound } from "next/navigation";
import { ScoreTier } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

const tierLabels: Record<ScoreTier, string> = {
  HIGH: "High Priority",
  MEDIUM: "Medium Priority",
  LOW: "Low Priority",
};

function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function LeadDetailPage({
  params,
}: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });

  if (!lead) notFound();

  const tier = lead.scoreTier;
  const websiteUrl = lead.website ? safeExternalUrl(lead.website) : null;
  const scoreClass =
    tier === ScoreTier.HIGH
      ? "priority-high"
      : tier === ScoreTier.MEDIUM
        ? "priority-medium"
        : tier === ScoreTier.LOW
          ? "priority-low"
          : "priority-unscored";

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
      <div className="lead-detail-page">
        <Link className="detail-back-link" href="/">← Back to lead intelligence</Link>
        <p className="intelligence-eyebrow">LEAD DETAILS</p>
        <div className="detail-page-heading">
          <div>
            <h1>{lead.companyName}</h1>
            <p>{[lead.industry, lead.location, lead.country].filter(Boolean).join(" · ") || "Company information unavailable"}</p>
          </div>
          <div className="detail-page-score">
            <strong className={scoreClass}>{lead.opportunityScore ?? "—"}</strong>
            <span>/ 100</span>
            <span className={`priority-badge ${scoreClass}`}>{tier ? tierLabels[tier] : "Unscored"}</span>
          </div>
        </div>

        <div className="lead-detail-grid">
          <section className="panel lead-detail-card">
            <h2>Company information</h2>
            <dl className="lead-detail-facts">
              <div><dt>Website</dt><dd>{websiteUrl ? <a href={websiteUrl} rel="noreferrer" target="_blank">{lead.website}</a> : lead.website ?? "Unavailable"}</dd></div>
              <div><dt>Domain</dt><dd>{lead.domain ?? "Unavailable"}</dd></div>
              <div><dt>Industry</dt><dd>{lead.industry ?? "Unavailable"}</dd></div>
              <div><dt>Sub-industry</dt><dd>{lead.subIndustry ?? "Unavailable"}</dd></div>
              <div><dt>Employees</dt><dd>{lead.employeeCount?.toLocaleString() ?? "Unavailable"}</dd></div>
              <div><dt>Revenue</dt><dd>{lead.revenue ? `${new Intl.NumberFormat("en-US", { style: "currency", currency: lead.revenueCurrency?.trim() || "USD", notation: "compact", maximumFractionDigits: 1 }).format(Number(lead.revenue))}${lead.revenueCurrency ? ` ${lead.revenueCurrency}` : ""}` : "Unavailable"}</dd></div>
              <div><dt>Location</dt><dd>{lead.location ?? "Unavailable"}</dd></div>
              <div><dt>Technologies</dt><dd>{lead.technologies.join(", ") || "Unavailable"}</dd></div>
            </dl>
          </section>

          <section className="panel lead-detail-card">
            <h2>Contact</h2>
            <dl className="lead-detail-facts">
              <div><dt>Name</dt><dd>{lead.contactName ?? "Unavailable"}</dd></div>
              <div><dt>Title</dt><dd>{lead.contactTitle ?? "Unavailable"}</dd></div>
              <div><dt>Email</dt><dd>{lead.contactEmail ? <a href={`mailto:${lead.contactEmail}`}>{lead.contactEmail}</a> : "Unavailable"}{lead.emailVerified && <small>Verified</small>}</dd></div>
              <div><dt>Phone</dt><dd>{lead.contactPhone ?? "Unavailable"}{lead.phoneVerified && <small>Verified</small>}</dd></div>
            </dl>
          </section>

          <section className="panel lead-detail-card">
            <h2>Opportunity score</h2>
            {lead.scoreReasons.length > 0 ? (
              <ul className="score-reasons-list">
                {lead.scoreReasons.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            ) : (
              <p className="detail-unavailable">This lead has not been scored yet.</p>
            )}
            <div className="detail-signal-list">
              {lead.hiringSignal && <p><strong>Hiring</strong>{lead.hiringSignal}</p>}
              {lead.growthSignal && <p><strong>Growth</strong>{lead.growthSignal}</p>}
              {lead.fundingSignal && <p><strong>Funding</strong>{lead.fundingSignal}</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
