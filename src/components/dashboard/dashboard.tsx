"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { demoLeads } from "@/data/demo-leads";
import type { Lead } from "@/types/lead";

type IconName =
  | "activity"
  | "arrow-down"
  | "arrow-right"
  | "bell"
  | "building"
  | "chevron-down"
  | "chevron-right"
  | "database"
  | "download"
  | "filter"
  | "grid"
  | "help"
  | "layers"
  | "plus"
  | "search"
  | "settings"
  | "sparkles"
  | "target"
  | "users";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const paths: Record<IconName, React.ReactNode> = {
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    "arrow-down": <><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></>,
    "arrow-right": <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    building: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 21v-4h6v4M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01" /></>,
    "chevron-down": <><path d="m6 9 6 6 6-6" /></>,
    "chevron-right": <><path d="m9 18 6-6-6-6" /></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
    filter: <><path d="M4 7h16M7 12h10m-7 5h4" /></>,
    grid: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="13" y="10" width="8" height="11" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /></>,
    help: <><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.4a1.7 1.7 0 1 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9h-.4a1.7 1.7 0 1 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2v-.4a1.7 1.7 0 1 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.4a1.7 1.7 0 1 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" /></>,
    sparkles: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
  };

  return <svg {...shared}>{paths[name]}</svg>;
}

const navigation: { label: string; icon: IconName }[] = [
  { label: "Overview", icon: "grid" },
  { label: "Lead workspace", icon: "users" },
  { label: "Companies", icon: "building" },
  { label: "Signals", icon: "activity" },
];

const tabs = ["All leads", "Top opportunities", "Recently added"] as const;
type LeadTab = (typeof tabs)[number];

function scoreTone(score: number) {
  if (score >= 85) return "score-high";
  if (score >= 70) return "score-good";
  return "score-watch";
}

function Avatar({ lead }: { lead: Lead }) {
  return <span className={`company-avatar ${lead.color}`}>{lead.initials}</span>;
}

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<LeadTab>("All leads");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeNavigation, setActiveNavigation] = useState("Overview");

  const visibleLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return demoLeads.filter((lead) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [lead.company, lead.industry, lead.contact, lead.location]
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesTab =
        activeTab === "All leads" ||
        (activeTab === "Top opportunities" && lead.score >= 80) ||
        (activeTab === "Recently added" &&
          ["2 hours ago", "5 hours ago", "Yesterday"].includes(lead.updated));

      return matchesSearch && matchesTab;
    });
  }, [activeTab, query]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="SaaSquatch Lead Intelligence home">
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <span className="brand-copy">
            <strong>saasquatch</strong>
            <small>LEAD INTELLIGENCE</small>
          </span>
        </a>

        <div className="workspace-switcher">
          <span className="workspace-avatar">C</span>
          <span className="workspace-copy"><strong>Caprae Capital</strong><small>Growth team</small></span>
          <Icon name="chevron-down" size={15} />
        </div>

        <p className="nav-label">WORKSPACE</p>
        <nav className="primary-navigation" aria-label="Main navigation">
          {navigation.map((item) => (
            item.label === "Lead workspace" ? (
              <Link
                className="nav-item"
                href="/leads"
                key={item.label}
              >
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
                <span className="nav-count">248</span>
              </Link>
            ) : (
              <button
                className={`nav-item ${activeNavigation === item.label ? "active" : ""}`}
                key={item.label}
                onClick={() => setActiveNavigation(item.label)}
                type="button"
              >
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
              </button>
            )
          ))}
        </nav>

        <p className="nav-label tools-label">TOOLS</p>
        <nav className="primary-navigation" aria-label="Tools">
          <button className="nav-item" type="button" onClick={() => setActiveNavigation("Data sources")}>
            <Icon name="database" size={17} /><span>Data sources</span>
          </button>
          <button className="nav-item" type="button" onClick={() => setActiveNavigation("Scoring model")}>
            <Icon name="target" size={17} /><span>Scoring model</span><span className="soon-tag">SOON</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon"><Icon name="sparkles" size={16} /></span>
            <strong>Make every lead count.</strong>
            <p>Find the right opportunities in your pipeline.</p>
            <Link className="tip-link" href="/leads">
              Explore leads <Icon name="arrow-right" size={14} />
            </Link>
          </div>
          <button className="nav-item bottom-link" type="button" onClick={() => setActiveNavigation("Settings")}>
            <Icon name="settings" size={17} /><span>Settings</span>
          </button>
          <button className="nav-item bottom-link" type="button" onClick={() => setActiveNavigation("Help & support")}>
            <Icon name="help" size={17} /><span>Help &amp; support</span>
          </button>
          <div className="profile">
            <span className="profile-avatar">CA</span>
            <span className="profile-copy"><strong>Chetan Aditya</strong><small>Admin</small></span>
            <button className="icon-button profile-more" type="button" aria-label="Profile options">
              <Icon name="chevron-down" size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span><Icon name="chevron-right" size={14} /><strong>{activeNavigation}</strong>
          </div>
          <div className="topbar-actions">
            <div className="data-status"><span /> Demo workspace</div>
            <button className="icon-button notification-button" type="button" aria-label="Notifications">
              <Icon name="bell" size={18} /><i />
            </button>
            <span className="topbar-divider" />
            <span className="profile-avatar topbar-avatar">CA</span>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" /> TUESDAY, OCTOBER 6, 2026</p>
              <h1>Good morning, Chetan <span className="wave">✳</span></h1>
              <p className="welcome-subtitle">Here’s the latest on your lead pipeline.</p>
            </div>
            <Link className="button button-primary" href="/leads">
              <Icon name="plus" size={17} /> Add leads
            </Link>
          </section>

          <section className="metrics-grid" aria-label="Pipeline overview">
            <article className="metric-card">
              <div className="metric-top"><span>Total leads</span><span className="metric-icon icon-blue"><Icon name="users" size={17} /></span></div>
              <div className="metric-value">248 <span className="metric-change"><Icon name="arrow-down" size={13} /> 12%</span></div>
              <p>vs. last 30 days</p>
              <div className="sparkline sparkline-blue"><svg viewBox="0 0 112 30" aria-hidden="true"><path d="M1 23 14 20 25 23 37 15 49 19 60 10 71 14 84 5 96 9 111 2" /></svg></div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>High-fit leads</span><span className="metric-icon icon-green"><Icon name="target" size={17} /></span></div>
              <div className="metric-value">36 <span className="metric-change positive"><Icon name="arrow-down" size={13} /> 8%</span></div>
              <p>score 80 and above</p>
              <div className="sparkline sparkline-green"><svg viewBox="0 0 112 30" aria-hidden="true"><path d="M1 24 13 18 25 21 37 14 49 17 61 8 73 12 85 4 97 8 111 2" /></svg></div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>New this week</span><span className="metric-icon icon-violet"><Icon name="layers" size={17} /></span></div>
              <div className="metric-value">18 <span className="metric-change positive">+6</span></div>
              <p>leads added this week</p>
              <div className="sparkline sparkline-violet"><svg viewBox="0 0 112 30" aria-hidden="true"><path d="M1 22 13 23 25 15 37 17 49 9 61 15 73 8 85 10 97 3 111 6" /></svg></div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>Avg. opportunity score</span><span className="metric-icon icon-amber"><Icon name="activity" size={17} /></span></div>
              <div className="metric-value">72<span className="metric-out-of">/100</span><span className="metric-change positive">+4 pts</span></div>
              <p>across your lead pipeline</p>
              <div className="sparkline sparkline-amber"><svg viewBox="0 0 112 30" aria-hidden="true"><path d="M1 24 13 21 25 23 37 16 49 18 61 11 73 13 85 7 97 9 111 2" /></svg></div>
            </article>
          </section>

          <section className="content-grid">
            <div className="leads-panel panel">
              <div className="panel-heading">
                <div>
                  <div className="title-with-count"><h2>Lead opportunities</h2><span className="count-pill">248</span></div>
                  <p>Prioritize the companies most likely to move your business forward.</p>
                </div>
                <button className="button button-secondary" type="button" onClick={() => {
                  const csv = ["Company,Industry,Location,Employees,Revenue,Example score", ...visibleLeads.map((lead) =>
                    [lead.company, lead.industry, lead.location, lead.employees, lead.revenue, lead.score]
                      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
                      .join(","),
                  )].join("\n");
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
                  link.download = "saasquatch-demo-leads.csv";
                  link.click();
                  URL.revokeObjectURL(link.href);
                }}>
                  <Icon name="download" size={16} /> Export
                </button>
              </div>

              <div className="table-toolbar">
                <div className="tabs" role="tablist" aria-label="Filter leads">
                  {tabs.map((tab) => (
                    <button
                      aria-selected={activeTab === tab}
                      className={`tab-button ${activeTab === tab ? "selected" : ""}`}
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      role="tab"
                      type="button"
                    >
                      {tab}{tab === "Top opportunities" && <span className="tab-dot" />}
                    </button>
                  ))}
                </div>
                <div className="table-tools">
                  <label className="search-box">
                    <Icon name="search" size={16} />
                    <input
                      aria-label="Search leads"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search leads"
                      type="search"
                      value={query}
                    />
                    <kbd>/</kbd>
                  </label>
                  <button className="filter-button" type="button" onClick={() => setActiveTab("Top opportunities")}>
                    <Icon name="filter" size={16} /> Filter
                  </button>
                </div>
              </div>

              <div className="table-scroll">
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th scope="col"><input aria-label="Select all visible leads" type="checkbox" /></th>
                      <th scope="col">COMPANY <Icon name="arrow-down" size={12} /></th>
                      <th scope="col">OPPORTUNITY SCORE <Icon name="chevron-down" size={12} /></th>
                      <th scope="col">INDUSTRY</th>
                      <th scope="col">COMPANY SIZE</th>
                      <th scope="col">SIGNALS</th>
                      <th aria-label="Open lead" scope="col" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLeads.map((lead) => (
                      <tr
                        className={selectedLead?.id === lead.id ? "selected-row" : ""}
                        key={lead.id}
                        onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                      >
                        <td onClick={(event) => event.stopPropagation()}><input aria-label={`Select ${lead.company}`} type="checkbox" /></td>
                        <td>
                          <div className="company-cell">
                            <Avatar lead={lead} />
                            <Link
                              className="company-name"
                              href={`/leads/${lead.id}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <strong>{lead.company}</strong><small>{lead.location}</small>
                            </Link>
                          </div>
                        </td>
                        <td>
                          <div className="score-cell">
                            <span className={`score-number ${scoreTone(lead.score)}`}>{lead.score}</span>
                            <span className="score-track"><i className={scoreTone(lead.score)} style={{ width: `${lead.score}%` }} /></span>
                          </div>
                        </td>
                        <td><span className="industry-cell">{lead.industry}</span></td>
                        <td><span className="size-cell">{lead.employees}</span></td>
                        <td><div className="signal-list">{lead.signals.slice(0, 2).map((signal) => <span className="signal-chip" key={signal}>{signal}</span>)}</div></td>
                        <td><button className="row-open" type="button" aria-label={`View ${lead.company}`}><Icon name="chevron-right" size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visibleLeads.length === 0 && (
                  <div className="empty-state">
                    <span className="empty-icon"><Icon name="search" size={20} /></span>
                    <strong>No leads found</strong>
                    <p>Try another search or choose a different filter.</p>
                    <button type="button" onClick={() => { setQuery(""); setActiveTab("All leads"); }}>Clear filters</button>
                  </div>
                )}
              </div>

              <div className="table-footer">
                <span>Showing <strong>{visibleLeads.length ? 1 : 0}–{visibleLeads.length}</strong> of <strong>248</strong> leads</span>
                <div className="pagination">
                  <button className="page-button" disabled type="button" aria-label="Previous page"><Icon name="chevron-right" size={15} /></button>
                  <button className="page-number current" type="button" aria-current="page">1</button>
                  <button className="page-number" type="button">2</button>
                  <button className="page-number" type="button">3</button>
                  <span>…</span>
                  <button className="page-number" type="button">25</button>
                  <button className="page-button next" type="button" aria-label="Next page"><Icon name="chevron-right" size={15} /></button>
                </div>
              </div>
            </div>

            <aside className="insights-column">
              {selectedLead ? (
                <section className="panel detail-panel">
                  <div className="detail-heading">
                    <span className="section-kicker">LEAD PREVIEW</span>
                    <button className="icon-button close-detail" type="button" onClick={() => setSelectedLead(null)} aria-label="Close lead preview">×</button>
                  </div>
                  <div className="detail-company"><Avatar lead={selectedLead} /><div><h3>{selectedLead.company}</h3><p>{selectedLead.industry}</p></div></div>
                  <div className={`detail-score ${scoreTone(selectedLead.score)}`}><strong>{selectedLead.score}</strong><span>/ 100<br />example score</span></div>
                  <div className="detail-facts">
                    <div><span>Location</span><strong>{selectedLead.location}</strong></div>
                    <div><span>Employees</span><strong>{selectedLead.employees}</strong></div>
                    <div><span>Revenue</span><strong>{selectedLead.revenue}</strong></div>
                    <div><span>Contact</span><strong>{selectedLead.contact}</strong><small>{selectedLead.role}</small></div>
                    <div><span>Email</span><strong className="email-value">{selectedLead.email}</strong></div>
                  </div>
                  <div className="demo-notice"><Icon name="sparkles" size={15} /><p>Lead briefs and explainable scoring are coming soon. This is sample data for the interface preview.</p></div>
                </section>
              ) : (
                <section className="panel priority-panel">
                  <div className="side-panel-heading"><span className="side-panel-icon"><Icon name="sparkles" size={17} /></span><span><h2>Priority snapshot</h2><small>YOUR PIPELINE AT A GLANCE</small></span><button className="icon-button more-button" type="button" aria-label="More snapshot options">···</button></div>
                  <div className="priority-score"><div className="priority-ring"><span>72<small>/100</small></span></div><div><strong>Healthy pipeline</strong><p>Your average opportunity score is up 4 points this month.</p></div></div>
                  <div className="snapshot-divider" />
                  <div className="snapshot-row"><span className="snapshot-dot mint-dot" /><span>Excellent fit</span><strong>12 leads</strong></div>
                  <div className="snapshot-row"><span className="snapshot-dot blue-dot" /><span>Good fit</span><strong>24 leads</strong></div>
                  <div className="snapshot-row"><span className="snapshot-dot gray-dot" /><span>Needs a closer look</span><strong>212 leads</strong></div>
                  <div className="snapshot-footnote">Illustrative overview · Demo data</div>
                </section>
              )}

              <section className="panel activity-panel">
                <div className="side-panel-heading"><span className="side-panel-icon muted-icon"><Icon name="activity" size={17} /></span><span><h2>Recent activity</h2><small>WHAT’S HAPPENING</small></span><button className="text-action" type="button" onClick={() => setActiveTab("Recently added")}>View all <Icon name="arrow-right" size={13} /></button></div>
                <div className="activity-item">
                  <span className="activity-marker marker-green"><Icon name="plus" size={13} /></span>
                  <div><p><strong>18 new leads</strong> added to your workspace</p><small>Today at 9:42 AM</small></div>
                </div>
                <div className="activity-item">
                  <span className="activity-marker marker-blue"><Icon name="target" size={13} /></span>
                  <div><p>Opportunity scores refreshed</p><small>Yesterday at 4:15 PM</small></div>
                </div>
                <div className="activity-item">
                  <span className="activity-marker marker-purple"><Icon name="download" size={13} /></span>
                  <div><p>Lead list exported by <strong>you</strong></p><small>Oct 4 at 11:08 AM</small></div>
                </div>
              </section>

              <div className="data-note"><span><Icon name="layers" size={14} /></span><p>Showing a preview with <strong>sample data</strong>. Connect a data source to see your real pipeline.</p><button type="button" aria-label="Learn about data sources"><Icon name="chevron-right" size={15} /></button></div>
            </aside>
          </section>

          <footer className="page-footer"><span>© 2026 SaaSquatch Lead Intelligence</span><span><span className="footer-dot" /> All systems operational</span></footer>
        </div>
      </main>
    </div>
  );
}
