"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LeadListResponse, LeadRecord } from "@/types/lead-record";

type PriorityFilter = "ALL" | "HIGH" | "MEDIUM" | "LOW";
type SortOption = "score" | "company" | "revenue" | "employees";
type DataQualityFilter = "" | "COMPLETE" | "NEEDS_REVIEW";

type DashboardFilters = {
  query: string;
  priority: PriorityFilter;
  industry: string;
  location: string;
  minEmployees: string;
  maxEmployees: string;
  minRevenue: string;
  maxRevenue: string;
  minScore: string;
  maxScore: string;
  dataQuality: DataQualityFilter;
  sort: SortOption;
  page: number;
};

const initialFilters: DashboardFilters = {
  query: "",
  priority: "ALL",
  industry: "",
  location: "",
  minEmployees: "",
  maxEmployees: "",
  minRevenue: "",
  maxRevenue: "",
  minScore: "",
  maxScore: "",
  dataQuality: "",
  sort: "score",
  page: 1,
};

function formatRevenue(
  revenue: string | null,
  currency: string | null,
): string {
  if (revenue == null || currency == null) return "—";
  const value = Number(revenue);
  if (!Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.trim() || "USD",
    maximumFractionDigits: 1,
    notation: value >= 1_000_000 ? "compact" : "standard",
  }).format(value);
}

function formatEmployeeCount(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

function getPriorityLabel(lead: LeadRecord): string {
  if (lead.scoreTier === "HIGH") return "High";
  if (lead.scoreTier === "MEDIUM") return "Medium";
  if (lead.scoreTier === "LOW") return "Low";
  return "Unscored";
}

function scoreClass(tier: LeadRecord["scoreTier"]): string {
  switch (tier) {
    case "HIGH":
      return "priority-high";
    case "MEDIUM":
      return "priority-medium";
    case "LOW":
      return "priority-low";
    default:
      return "priority-unscored";
  }
}

function buildQueryString(filters: DashboardFilters, format?: "csv"): string {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.priority !== "ALL") params.set("priority", filters.priority);
  if (filters.industry) params.set("industry", filters.industry);
  if (filters.location) params.set("location", filters.location);
  if (filters.minEmployees) params.set("minEmployees", filters.minEmployees);
  if (filters.maxEmployees) params.set("maxEmployees", filters.maxEmployees);
  if (filters.minRevenue) params.set("minRevenue", filters.minRevenue);
  if (filters.maxRevenue) params.set("maxRevenue", filters.maxRevenue);
  if (filters.minScore) params.set("minScore", filters.minScore);
  if (filters.maxScore) params.set("maxScore", filters.maxScore);
  if (filters.dataQuality) params.set("dataQuality", filters.dataQuality);
  if (filters.sort !== "score") params.set("sort", filters.sort);
  if (format) params.set("format", format);
  else {
    params.set("page", String(filters.page));
    params.set("pageSize", "25");
  }
  return params.toString();
}

type ActiveFilter = {
  key: string;
  label: string;
  updates: Partial<DashboardFilters>;
};

function activeFilters(filters: DashboardFilters): ActiveFilter[] {
  const active: ActiveFilter[] = [];
  if (filters.query.trim()) {
    active.push({
      key: "query",
      label: `Search: ${filters.query.trim()}`,
      updates: { query: "" },
    });
  }
  if (filters.priority !== "ALL") {
    active.push({
      key: "priority",
      label: `Priority: ${filters.priority.toLowerCase()}`,
      updates: { priority: "ALL" },
    });
  }
  if (filters.industry) {
    active.push({
      key: "industry",
      label: `Industry: ${filters.industry}`,
      updates: { industry: "" },
    });
  }
  if (filters.location) {
    active.push({
      key: "location",
      label: `Location: ${filters.location}`,
      updates: { location: "" },
    });
  }
  if (filters.minEmployees || filters.maxEmployees) {
    active.push({
      key: "employees",
      label: `Employees: ${filters.minEmployees || "0"}–${filters.maxEmployees || "any"}`,
      updates: { minEmployees: "", maxEmployees: "" },
    });
  }
  if (filters.minRevenue || filters.maxRevenue) {
    active.push({
      key: "revenue",
      label: `Revenue (USD): ${filters.minRevenue || "$0"}–${filters.maxRevenue ? `$${filters.maxRevenue}` : "any"}`,
      updates: { minRevenue: "", maxRevenue: "" },
    });
  }
  if (filters.minScore || filters.maxScore) {
    active.push({
      key: "score",
      label: `Score: ${filters.minScore || "0"}–${filters.maxScore || "100"}`,
      updates: { minScore: "", maxScore: "" },
    });
  }
  if (filters.dataQuality) {
    active.push({
      key: "quality",
      label: filters.dataQuality === "COMPLETE" ? "Data: complete" : "Data: needs review",
      updates: { dataQuality: "" },
    });
  }
  return active;
}

function LeadSkeletonRows() {
  return (
    <div aria-label="Loading leads" className="lead-skeleton-list">
      {Array.from({ length: 7 }, (_, index) => (
        <div className="lead-skeleton-row" key={index}>
          <span className="skeleton-block skeleton-company" />
          <span className="skeleton-block" />
          <span className="skeleton-block skeleton-short" />
          <span className="skeleton-block skeleton-short" />
          <span className="skeleton-block" />
          <span className="skeleton-block skeleton-short" />
          <span className="skeleton-block skeleton-short" />
        </div>
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  variant,
  caption,
}: {
  label: string;
  value: string | number;
  variant?: string;
  caption?: string;
}) {
  return (
    <article className="intelligence-metric-card">
      <span className="intelligence-metric-label">{label}</span>
      <strong className={`intelligence-metric-value ${variant ?? ""}`}>{value}</strong>
      {caption && <span className="intelligence-metric-caption">{caption}</span>}
    </article>
  );
}

function AnalyticsProgress({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone?: string;
}) {
  return (
    <div className="analytics-progress-row">
      <div className="analytics-progress-copy">
        <span>{label}</span>
        <strong>{detail}</strong>
      </div>
      <div
        aria-label={`${label}: ${detail}`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={value}
        className="analytics-progress-track"
        role="progressbar"
      >
        <span className={tone ?? ""} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function LeadRow({ lead }: { lead: LeadRecord }) {
  const score = lead.opportunityScore;
  return (
    <tr>
      <td>
        <Link className="intelligence-company-link" href={`/leads/${lead.id}`} prefetch={false}>
          <strong>{lead.companyName}</strong>
          <span>{lead.domain ?? "Domain unavailable"}</span>
        </Link>
      </td>
      <td>
        <span>{lead.industry ?? "—"}</span>
        {lead.subIndustry && <small className="table-subtext">{lead.subIndustry}</small>}
      </td>
      <td>{lead.location ?? "—"}</td>
      <td className="numeric-cell">{formatEmployeeCount(lead.employeeCount)}</td>
      <td className="numeric-cell">{formatRevenue(lead.revenue, lead.revenueCurrency)}</td>
      <td>
        <div className="lead-score-display">
          <span className={`lead-score-number ${scoreClass(lead.scoreTier)}`}>
            {score ?? "—"}
          </span>
          {score != null && (
            <span
              aria-label={`Score ${score} out of 100`}
              className="lead-score-track"
              role="img"
            >
              <span
                className={scoreClass(lead.scoreTier)}
                style={{ width: `${score}%` }}
              />
            </span>
          )}
        </div>
      </td>
      <td>
        <span className={`priority-badge ${scoreClass(lead.scoreTier)}`}>
          {getPriorityLabel(lead)}
        </span>
      </td>
      <td className="top-signal-cell" title={lead.topSignal}>{lead.topSignal}</td>
      <td>
        {lead.contactEmail ? (
          <a className="contact-email-link" href={`mailto:${lead.contactEmail}`}>
            {lead.contactEmail}
          </a>
        ) : (
          <span className="contact-status">{lead.contactStatus}</span>
        )}
        {lead.contactEmail && (
          <small className={`contact-status ${lead.emailVerified ? "contact-verified" : ""}`}>
            {lead.emailVerified ? "Verified" : "Unverified"}
          </small>
        )}
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const [filters, setFilters] = useState(initialFilters);
  const [result, setResult] = useState<LeadListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const queryString = useMemo(() => buildQueryString(filters), [filters]);
  const selectedFilters = activeFilters(filters);

  useEffect(() => {
    const controller = new AbortController();
    const delay =
      filters.query.trim() ||
      filters.minEmployees ||
      filters.maxEmployees ||
      filters.minRevenue ||
      filters.maxRevenue ||
      filters.minScore ||
      filters.maxScore
        ? 250
        : 0;

    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      fetch(`/api/leads?${queryString}`, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      })
        .then(async (response) => {
          const payload: unknown = await response.json();
          if (!response.ok) {
            const message =
              typeof payload === "object" &&
              payload !== null &&
              "error" in payload &&
              typeof payload.error === "string"
                ? payload.error
                : "Unable to load leads.";
            throw new Error(message);
          }
          return payload as LeadListResponse;
        })
        .then((payload) => {
          setResult(payload);
          setError(null);
        })
        .catch((requestError: unknown) => {
          if (controller.signal.aborted) return;
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load leads. Please try again.",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, delay);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [filters, queryString, reloadKey]);

  const updateFilters = useCallback(
    (updates: Partial<DashboardFilters>) => {
      setExportMessage(null);
      setFilters((current) => ({ ...current, ...updates, page: 1 }));
    },
    [],
  );

  async function exportCsv() {
    setExporting(true);
    setExportMessage(null);
    try {
      const response = await fetch(
        `/api/leads?${buildQueryString(filters, "csv")}`,
        { headers: { Accept: "text/csv" } },
      );
      if (!response.ok) {
        const payload: unknown = await response.json();
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Unable to export leads.";
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "lead-intelligence.csv";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      const exportedRows = response.headers.get("X-Exported-Rows");
      const wasTruncated = response.headers.get("X-Export-Truncated") === "true";
      setExportMessage(
        wasTruncated
          ? `Exported ${exportedRows ?? "up to 10,000"} matching leads. Refine your filters to export the rest.`
          : `Exported ${exportedRows ?? "matching"} matching leads.`,
      );
    } catch (exportError) {
      setExportMessage(
        exportError instanceof Error
          ? exportError.message
          : "Unable to export leads. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  }

  const totalPages = result?.meta.totalPages ?? 0;
  const firstRow =
    result && result.meta.total > 0
      ? (result.meta.page - 1) * result.meta.pageSize + 1
      : 0;
  const lastRow = result
    ? Math.min(result.meta.page * result.meta.pageSize, result.meta.total)
    : 0;

  return (
    <main className="intelligence-dashboard">
      <header className="intelligence-header">
        <div className="intelligence-brand">
          <span aria-hidden="true" className="intelligence-brand-mark">S</span>
          <span>SaaSquatch</span>
          <span className="brand-divider">/</span>
          <span className="brand-product">Lead Intelligence</span>
        </div>
        <div className="intelligence-header-content">
          <div>
            <p className="intelligence-eyebrow">SALES INTELLIGENCE</p>
            <h1>Lead Intelligence</h1>
            <p className="intelligence-subtitle">
              Prioritize the leads most worth pursuing.
            </p>
          </div>
          <div className="header-total">
            <strong>{loading && !result ? "—" : result?.summary.total ?? 0}</strong>
            <span>total leads</span>
          </div>
        </div>
      </header>

      <section aria-label="Lead pipeline metrics" className="intelligence-metrics">
        <MetricCard
          caption="Across your pipeline"
          label="Total leads"
          value={loading && !result ? "—" : result?.summary.total ?? 0}
        />
        <MetricCard
          caption="Score 80–100"
          label="High priority"
          value={loading && !result ? "—" : result?.summary.highPriority ?? 0}
          variant="metric-high"
        />
        <MetricCard
          caption="Score 60–79"
          label="Medium priority"
          value={loading && !result ? "—" : result?.summary.mediumPriority ?? 0}
          variant="metric-medium"
        />
        <MetricCard
          caption="Out of 100"
          label="Average opportunity score"
          value={loading && !result ? "—" : result?.summary.averageScore ?? 0}
        />
      </section>

      <section aria-labelledby="lead-analytics-title" className="lead-analytics">
        <div className="lead-analytics-heading">
          <div>
            <h2 id="lead-analytics-title">Lead quality snapshot</h2>
            <p>Quality signals across your full database</p>
          </div>
          <div className="analytics-summary">
            <div>
              <span>Average opportunity score</span>
              <strong>
                {loading && !result ? "—" : `${result?.summary.averageScore ?? 0}/100`}
              </strong>
            </div>
            <div>
              <span>Average data quality score</span>
              <strong>
                {loading && !result
                  ? "—"
                  : result?.summary.averageDataQualityScore == null
                    ? "—"
                    : `${result.summary.averageDataQualityScore.toFixed(1)}%`}
              </strong>
            </div>
          </div>
        </div>

        <div className="lead-analytics-grid">
          <div className="lead-analytics-panel">
            <h3>Priority distribution</h3>
            {(["HIGH", "MEDIUM", "LOW"] as const).map((tier) => {
              const count =
                tier === "HIGH"
                  ? result?.summary.highPriority ?? 0
                  : tier === "MEDIUM"
                    ? result?.summary.mediumPriority ?? 0
                    : result?.summary.lowPriority ?? 0;
              const total = result?.summary.total ?? 0;
              const percent = total ? Math.round((count / total) * 100) : 0;
              const label = tier.charAt(0) + tier.slice(1).toLowerCase();

              return (
                <AnalyticsProgress
                  detail={`${count} · ${percent}%`}
                  key={tier}
                  label={label}
                  tone={`analytics-${tier.toLowerCase()}`}
                  value={percent}
                />
              );
            })}
          </div>

          <div className="lead-analytics-panel">
            <h3>Top scoring factors</h3>
            {result?.summary.topScoringFactors.length ? (
              result.summary.topScoringFactors.map((factor) => (
                <AnalyticsProgress
                  detail={`${factor.averageScore.toFixed(1)}%`}
                  key={factor.factor}
                  label={
                    factor.factor === "Contact completeness"
                      ? "Contact quality"
                      : factor.factor
                  }
                  value={factor.averageScore}
                />
              ))
            ) : (
              <p className="analytics-empty">
                Scoring factor analytics will appear when scored leads are available.
              </p>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Lead workspace" className="intelligence-workspace">
        <div className="workspace-heading">
          <div>
            <h2>Lead opportunities</h2>
            <p>Qualify and prioritize the leads in your database.</p>
          </div>
          <button
            className="button button-secondary intelligence-export"
            disabled={exporting || loading || result == null || result.meta.total === 0}
            onClick={exportCsv}
            type="button"
          >
            {exporting ? "Preparing CSV…" : "Export CSV"}
          </button>
        </div>

        <div aria-label="Lead filters" className="intelligence-filter-bar">
          <label className="intelligence-search filter-span-4">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search company, domain, industry, or contact"
              maxLength={120}
              onChange={(event) => updateFilters({ query: event.target.value })}
              placeholder="Search company, domain, industry, contact…"
              type="search"
              value={filters.query}
            />
          </label>

          <label className="filter-control filter-span-2">
            <span>Priority</span>
            <select
              aria-label="Filter by priority"
              onChange={(event) =>
                updateFilters({ priority: event.target.value as PriorityFilter })
              }
              value={filters.priority}
            >
              <option value="ALL">All priorities</option>
              <option value="HIGH">High priority</option>
              <option value="MEDIUM">Medium priority</option>
              <option value="LOW">Low priority</option>
            </select>
          </label>

          <label className="filter-control filter-span-2">
            <span>Industry</span>
            <select
              aria-label="Filter by industry"
              onChange={(event) => updateFilters({ industry: event.target.value })}
              value={filters.industry}
            >
              <option value="">All industries</option>
              {(result?.filters.industries ?? []).map((industry) => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </label>

          <label className="filter-control filter-span-2">
            <span>Location</span>
            <select
              aria-label="Filter by location"
              onChange={(event) => updateFilters({ location: event.target.value })}
              value={filters.location}
            >
              <option value="">All locations</option>
              {(result?.filters.locations ?? []).map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </label>

          <label className="range-filter-control filter-span-3">
            <span>Employees</span>
            <input
              aria-label="Minimum employee count"
              min="0"
              onChange={(event) => updateFilters({ minEmployees: event.target.value })}
              placeholder="Min"
              type="number"
              value={filters.minEmployees}
            />
            <span aria-hidden="true">–</span>
            <input
              aria-label="Maximum employee count"
              min="0"
              onChange={(event) => updateFilters({ maxEmployees: event.target.value })}
              placeholder="Max"
              type="number"
              value={filters.maxEmployees}
            />
          </label>

          <label className="range-filter-control filter-span-4">
            <span>Revenue (USD)</span>
            <input
              aria-label="Minimum revenue in USD"
              min="0"
              onChange={(event) => updateFilters({ minRevenue: event.target.value })}
              placeholder="Min"
              step="0.01"
              type="number"
              value={filters.minRevenue}
            />
            <span aria-hidden="true">–</span>
            <input
              aria-label="Maximum revenue in USD"
              min="0"
              onChange={(event) => updateFilters({ maxRevenue: event.target.value })}
              placeholder="Max"
              step="0.01"
              type="number"
              value={filters.maxRevenue}
            />
          </label>

          <label className="range-filter-control filter-span-3">
            <span>Opportunity score</span>
            <input
              aria-label="Minimum opportunity score"
              max="100"
              min="0"
              onChange={(event) => updateFilters({ minScore: event.target.value })}
              placeholder="Min"
              type="number"
              value={filters.minScore}
            />
            <span aria-hidden="true">–</span>
            <input
              aria-label="Maximum opportunity score"
              max="100"
              min="0"
              onChange={(event) => updateFilters({ maxScore: event.target.value })}
              placeholder="Max"
              type="number"
              value={filters.maxScore}
            />
          </label>

          <label className="filter-control filter-span-2">
            <span title="Complete means key company and contact facts are present, revenue currency is known, and the contact email is verified.">
              Data quality
            </span>
            <select
              aria-label="Filter by data quality"
              onChange={(event) =>
                updateFilters({ dataQuality: event.target.value as DataQualityFilter })
              }
              value={filters.dataQuality}
            >
              <option value="">All records</option>
              <option value="COMPLETE">Complete and verified</option>
              <option value="NEEDS_REVIEW">Needs review</option>
            </select>
          </label>

          <label className="filter-control filter-span-2">
            <span>Sort</span>
            <select
              aria-label="Sort leads"
              onChange={(event) =>
                updateFilters({ sort: event.target.value as SortOption })
              }
              value={filters.sort}
            >
              <option value="score">Score: highest first</option>
              <option value="company">Company: A–Z</option>
              <option value="revenue">Revenue: highest first</option>
              <option value="employees">Employees: most first</option>
            </select>
          </label>
        </div>

        <div className="filter-status-row">
          <p aria-live="polite" className="matching-count">
            {loading ? "Updating results…" : `${result?.meta.total ?? 0} matching leads`}
          </p>
          {selectedFilters.length > 0 && (
            <button
              className="clear-filters-button"
              onClick={() =>
                setFilters((current) => ({ ...initialFilters, sort: current.sort }))
              }
              type="button"
            >
              Clear all filters
            </button>
          )}
        </div>
        {selectedFilters.length > 0 && (
          <div aria-label="Active filters" className="active-filter-list">
            {selectedFilters.map((filter) => (
              <button
                aria-label={`Remove filter ${filter.label}`}
                className="active-filter-chip"
                key={filter.key}
                onClick={() => updateFilters(filter.updates)}
                type="button"
              >
                {filter.label}<span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        )}

        {exportMessage && (
          <p
            className={`export-feedback ${exportMessage.startsWith("Exported") ? "export-success" : "export-error"}`}
            role="status"
          >
            {exportMessage}
          </p>
        )}

        {error && (
          <div className="dashboard-error" role="alert">
            <div>
              <strong>We couldn’t load your leads</strong>
              <p>{error}</p>
            </div>
            <button onClick={() => setReloadKey((current) => current + 1)} type="button">
              Try again
            </button>
          </div>
        )}

        {!error && (
          <>
            <div aria-busy={loading} className="intelligence-table-scroll">
              <table className="intelligence-table">
                <thead>
                  <tr>
                    <th scope="col">Company</th>
                    <th scope="col">Industry</th>
                    <th scope="col">Location</th>
                    <th className="numeric-cell" scope="col">Employees</th>
                    <th className="numeric-cell" scope="col">Revenue</th>
                    <th scope="col">Score</th>
                    <th scope="col">Priority</th>
                    <th scope="col">Top signal</th>
                    <th scope="col">Contact</th>
                  </tr>
                </thead>
                {loading && !result ? (
                  <tbody>
                    <tr>
                      <td className="skeleton-cell" colSpan={9}>
                        <LeadSkeletonRows />
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody>
                    {result?.data.map((lead) => (
                      <LeadRow key={lead.id} lead={lead} />
                    ))}
                  </tbody>
                )}
              </table>
            </div>

            {!loading && result?.data.length === 0 && (
              <div className="intelligence-empty">
                <span aria-hidden="true" className="empty-search-icon">⌕</span>
                <h3>No leads match these filters</h3>
                <p>Try a different search or clear one or more filters.</p>
                <button
                  onClick={() =>
                    setFilters((current) => ({ ...initialFilters, sort: current.sort }))
                  }
                  type="button"
                >
                  Clear filters
                </button>
              </div>
            )}

            <footer className="intelligence-table-footer">
              <span>
                {loading && result
                  ? "Updating results…"
                  : `Showing ${firstRow}–${lastRow} of ${result?.meta.total ?? 0} matching leads`}
              </span>
              <div aria-label="Lead pages" className="intelligence-pagination">
                <button
                  aria-label="Previous page"
                  disabled={loading || filters.page <= 1}
                  onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
                  type="button"
                >
                  Previous
                </button>
                <span>Page {result?.meta.page ?? 1} of {Math.max(1, totalPages)}</span>
                <button
                  aria-label="Next page"
                  disabled={loading || filters.page >= totalPages}
                  onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
                  type="button"
                >
                  Next
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
      <footer className="intelligence-page-footer">
        Opportunity scores are deterministic and explainable; they are not generated by AI.
      </footer>
    </main>
  );
}
