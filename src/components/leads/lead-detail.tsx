"use client";

import Link from "next/link";
import { useState } from "react";
import { isLeadBrief, type LeadBrief } from "@/lib/ai/lead-brief";
import type { LeadOpportunityScore } from "@/lib/scoring";

type LeadDetailData = {
  id: string;
  companyName: string;
  website: string | null;
  domain: string | null;
  industry: string | null;
  subIndustry: string | null;
  employeeCount: number | null;
  revenue: string | null;
  revenueCurrency: string | null;
  location: string | null;
  country: string | null;
  technologies: string[];
  hiringSignal: string | null;
  growthSignal: string | null;
  fundingSignal: string | null;
  contactName: string | null;
  contactTitle: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  linkedinUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  dataSource: string | null;
  lastUpdated: string;
  aiSummary: string | null;
  aiWhyAttractive: string | null;
  aiStrongestSignals: string[];
  aiRisks: string[];
  aiOutreachAngle: string | null;
  aiNextAction: string | null;
  aiGeneratedAt: string | null;
};

type LeadDetailProps = {
  lead: LeadDetailData;
  score: LeadOpportunityScore;
};

type StoredLeadBrief = {
  summary: string | null;
  whyThisLead: string | null;
  strongestSignals: string[];
  potentialRisks: string[];
  recommendedOutreachAngle: string | null;
  recommendedNextAction: string | null;
};

function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function csvCell(value: string | number | null): string {
  let text = value == null ? "" : String(value);
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function exportLead(lead: LeadDetailData, score: LeadOpportunityScore) {
  const rows: Array<[string, string | number | null]> = [
    ["Company", lead.companyName],
    ["Website", lead.website],
    ["Domain", lead.domain],
    ["Industry", lead.industry],
    ["Sub-industry", lead.subIndustry],
    ["Employees", lead.employeeCount],
    ["Revenue", lead.revenue],
    ["Revenue currency", lead.revenueCurrency],
    ["Location", lead.location],
    ["Country", lead.country],
    ["Technologies", lead.technologies.join("; ")],
    ["Hiring signal", lead.hiringSignal],
    ["Growth signal", lead.growthSignal],
    ["Funding signal", lead.fundingSignal],
    ["Contact name", lead.contactName],
    ["Contact title", lead.contactTitle],
    ["Contact email", lead.contactEmail],
    ["Contact phone", lead.contactPhone],
    ["LinkedIn URL", lead.linkedinUrl],
    ["Opportunity score", score.totalScore],
    ["Priority", score.tierLabel],
    ...score.factors.map(
      (factor) => [`${factor.factor} score`, `${factor.points}/${factor.maxPoints}`] as [string, string],
    ),
  ];
  const csv = rows.map(([label, value]) => `${csvCell(label)},${csvCell(value)}`).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${lead.domain ?? lead.id}-lead.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function displayOrUnavailable(value: string | number | null): string {
  return value == null || value === "" ? "Unavailable" : String(value);
}

function formatUtcDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

function LeadDetail({ lead, score }: LeadDetailProps) {
  const [brief, setBrief] = useState<StoredLeadBrief>(() => ({
    summary: lead.aiSummary,
    whyThisLead: lead.aiWhyAttractive,
    strongestSignals: lead.aiStrongestSignals,
    potentialRisks: lead.aiRisks,
    recommendedOutreachAngle: lead.aiOutreachAngle,
    recommendedNextAction: lead.aiNextAction,
  }));
  const [generatedAt, setGeneratedAt] = useState(lead.aiGeneratedAt);
  const [generating, setGenerating] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  const tierClass = `priority-${score.tier.toLowerCase()}`;
  const positiveFactors = score.factors.filter((factor) => factor.signal === "positive");
  const weakFactors = score.factors.filter((factor) => factor.signal !== "positive");
  const websiteUrl = lead.website ? safeExternalUrl(lead.website) : null;
  const linkedinUrl = lead.linkedinUrl ? safeExternalUrl(lead.linkedinUrl) : null;
  const countryName = lead.country
    ? new Intl.DisplayNames(["en"], { type: "region" }).of(lead.country) ?? lead.country
    : null;
  const revenue = lead.revenue
    ? `${new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: lead.revenueCurrency || "USD",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(Number(lead.revenue))}${lead.revenueCurrency ? ` ${lead.revenueCurrency}` : ""}`
    : null;

  async function generateBrief() {
    setGenerating(true);
    setBriefError(null);
    try {
      const refresh = brief.summary ? "?refresh=true" : "";
      const response = await fetch(
        `/api/ai/leads/${encodeURIComponent(lead.id)}/brief${refresh}`,
        { method: "POST", headers: { Accept: "application/json" } },
      );
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Unable to generate the AI brief.";
        throw new Error(message);
      }
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("data" in payload) ||
        typeof payload.data !== "object" ||
        payload.data === null ||
        !("generatedAt" in payload) ||
        typeof payload.generatedAt !== "string"
      ) {
        throw new Error("The AI service returned an invalid response. Please try again.");
      }
      if (!isLeadBrief(payload.data)) {
        throw new Error("The AI service returned an invalid brief. Please try again.");
      }
      const data: LeadBrief = payload.data;
      setBrief(data);
      setGeneratedAt(payload.generatedAt);
    } catch (error) {
      setBriefError(
        error instanceof Error
          ? error.message
          : "Unable to generate the AI brief. Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  }

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
        <div className="detail-toolbar">
          <Link className="detail-back-link" href="/">← Back to leads</Link>
          <button
            className="button button-secondary"
            onClick={() => exportLead(lead, score)}
            type="button"
          >
            Export lead
          </button>
        </div>

        <section aria-labelledby="lead-title" className="detail-hero panel">
          <div>
            <p className="intelligence-eyebrow">DATABASE RECORD · {lead.domain ?? "DOMAIN UNAVAILABLE"}</p>
            <h1 id="lead-title">{lead.companyName}</h1>
            <p className="detail-company-subtitle">
              {[lead.industry, lead.subIndustry].filter(Boolean).join(" / ") || "Industry unavailable"}
            </p>
            <p className="detail-company-location">
              {[lead.location, countryName].filter(Boolean).join(", ") || "Location unavailable"}
            </p>
          </div>
          <div className="detail-score-summary">
            <strong className={tierClass}>{score.totalScore}</strong>
            <span>out of 100</span>
            <span className={`priority-badge ${tierClass}`}>{score.tierLabel}</span>
            <small>Deterministic score</small>
          </div>
        </section>

        <div className="lead-detail-grid">
          <section aria-labelledby="why-lead-title" className="panel lead-detail-card">
            <div className="detail-section-heading">
              <div>
                <p className="intelligence-eyebrow">RULE-BASED ASSESSMENT</p>
                <h2 id="why-lead-title">Why this lead?</h2>
              </div>
              <span className={`priority-badge ${tierClass}`}>{score.tierLabel}</span>
            </div>
            {positiveFactors.length ? (
              <ul className="detail-signal-list">
                {positiveFactors.map((factor) => (
                  <li className="detail-signal-positive" key={factor.factor}>
                    <span aria-hidden="true">+</span>
                    <div><strong>{factor.factor}</strong><p>{factor.reason}</p></div>
                  </li>
                ))}
              </ul>
            ) : <p className="detail-unavailable">No positive scoring signals are currently identified.</p>}
          </section>

          <section aria-labelledby="company-intelligence-title" className="panel lead-detail-card">
            <div className="detail-section-heading">
              <div>
                <p className="intelligence-eyebrow">DATABASE FACTS</p>
                <h2 id="company-intelligence-title">Company intelligence</h2>
              </div>
            </div>
            <dl className="lead-detail-facts">
              <div><dt>Employees</dt><dd>{lead.employeeCount?.toLocaleString() ?? "Unavailable"}</dd></div>
              <div><dt>Revenue</dt><dd>{revenue ?? "Unavailable"}</dd></div>
              <div><dt>Hiring signal</dt><dd>{displayOrUnavailable(lead.hiringSignal)}</dd></div>
              <div><dt>Growth signal</dt><dd>{displayOrUnavailable(lead.growthSignal)}</dd></div>
              <div><dt>Funding signal</dt><dd>{displayOrUnavailable(lead.fundingSignal)}</dd></div>
              <div><dt>Technologies</dt><dd>{lead.technologies.length ? lead.technologies.join(", ") : "Unavailable"}</dd></div>
              <div><dt>Data source</dt><dd>{displayOrUnavailable(lead.dataSource)}</dd></div>
              <div><dt>Last updated</dt><dd>{formatUtcDate(lead.lastUpdated)}</dd></div>
              <div><dt>Website</dt><dd>{websiteUrl ? <a href={websiteUrl} rel="noreferrer" target="_blank">{lead.website}</a> : displayOrUnavailable(lead.website)}</dd></div>
              <div><dt>Domain</dt><dd>{displayOrUnavailable(lead.domain)}</dd></div>
            </dl>
          </section>

          <section aria-labelledby="score-breakdown-title" className="panel lead-detail-card score-breakdown-card">
            <div className="detail-section-heading">
              <div>
                <p className="intelligence-eyebrow">EXPLAINABLE · RULE-BASED</p>
                <h2 id="score-breakdown-title">Score breakdown</h2>
              </div>
              <strong className={`detail-breakdown-total ${tierClass}`}>{score.totalScore}<small>/100</small></strong>
            </div>
            <div className="score-factor-list">
              {score.factors.map((factor) => (
                <article className="score-factor" key={factor.factor}>
                  <div className="score-factor-topline">
                    <strong>{factor.factor}</strong>
                    <span>{factor.points}<small> / {factor.maxPoints}</small></span>
                  </div>
                  <div aria-hidden="true" className="score-factor-track">
                    <span className={`factor-${factor.signal}`} style={{ width: `${(factor.points / factor.maxPoints) * 100}%` }} />
                  </div>
                  <p>{factor.reason}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="contact-title" className="panel lead-detail-card">
            <div className="detail-section-heading">
              <div>
                <p className="intelligence-eyebrow">DATABASE FACTS</p>
                <h2 id="contact-title">Contact</h2>
              </div>
            </div>
            <div className="detail-contact-name">
              <strong>{lead.contactName ?? "Contact unavailable"}</strong>
              <span>{lead.contactTitle ?? "Job title unavailable"}</span>
            </div>
            <dl className="lead-detail-facts">
              <div><dt>Email</dt><dd>{lead.contactEmail ? <a href={`mailto:${lead.contactEmail}`}>{lead.contactEmail}</a> : "Unavailable"}{lead.contactEmail && <small>{lead.emailVerified ? "Verified" : "Unverified"}</small>}</dd></div>
              <div><dt>Phone</dt><dd>{lead.contactPhone ?? "Unavailable"}{lead.contactPhone && <small>{lead.phoneVerified ? "Verified" : "Unverified"}</small>}</dd></div>
              <div><dt>LinkedIn</dt><dd>{linkedinUrl ? <a href={linkedinUrl} rel="noreferrer" target="_blank">View profile</a> : "Unavailable"}</dd></div>
            </dl>
          </section>

          <section aria-labelledby="signal-review-title" className="panel lead-detail-card">
            <div className="detail-section-heading">
              <div>
                <p className="intelligence-eyebrow">SCORING INPUTS</p>
                <h2 id="signal-review-title">Missing or weaker signals</h2>
              </div>
            </div>
            {weakFactors.length ? (
              <ul className="detail-weak-list">
                {weakFactors.map((factor) => (
                  <li key={factor.factor}>
                    <div className={`signal-dot factor-${factor.signal}`} />
                    <div><strong>{factor.factor} · {factor.points}/{factor.maxPoints}</strong><p>{factor.reason}</p></div>
                  </li>
                ))}
              </ul>
            ) : <p className="detail-unavailable">No missing or weak scoring factors identified.</p>}
          </section>

          <section aria-labelledby="ai-brief-title" className="panel lead-detail-card ai-brief-card">
            <div className="detail-section-heading">
              <div>
                <p className="intelligence-eyebrow">AI-GENERATED INTERPRETATION</p>
                <h2 id="ai-brief-title">AI Lead Brief</h2>
              </div>
              {generatedAt && <time dateTime={generatedAt}>Generated {new Date(generatedAt).toLocaleString()}</time>}
            </div>
            <p className="ai-brief-disclaimer">
              This is an AI-generated interpretation of the database record, not independently verified company research. Numeric scores are calculated separately by deterministic rules.
            </p>
            {brief.summary ? (
              <div className="ai-brief-content">
                <div><h3>Summary</h3><p>{brief.summary}</p></div>
                <div><h3>Why this lead?</h3><p>{brief.whyThisLead || "Unavailable in this brief."}</p></div>
                <div><h3>Strongest signals</h3>{brief.strongestSignals.length ? <ul>{brief.strongestSignals.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Unavailable in this brief.</p>}</div>
                <div><h3>Potential risks</h3>{brief.potentialRisks.length ? <ul>{brief.potentialRisks.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Unavailable in this brief.</p>}</div>
                <div><h3>Recommended outreach angle</h3><p>{brief.recommendedOutreachAngle || "Unavailable in this brief."}</p></div>
                <div><h3>Recommended next action</h3><p>{brief.recommendedNextAction || "Unavailable in this brief."}</p></div>
              </div>
            ) : (
              <div className="ai-brief-empty">
                <strong>No AI brief generated yet</strong>
                <p>Generate a concise summary, attractive signals, potential risks, and an outreach recommendation grounded in the available record.</p>
              </div>
            )}
            {briefError && <p className="ai-brief-error" role="alert">{briefError}</p>}
            <button className="button button-primary ai-generate-button" disabled={generating} onClick={generateBrief} type="button">
              {generating ? <><span aria-hidden="true" className="button-spinner" />Generating brief…</> : brief.summary ? "Regenerate AI Brief" : "Generate AI Brief"}
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

export default LeadDetail;
