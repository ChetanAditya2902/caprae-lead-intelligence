import type { LeadRecord } from "@/types/lead-record";

function csvCell(value: string | number | null): string {
  let normalized = value == null ? "" : String(value);
  if (/^[\s]*[=+\-@\t\r]/.test(normalized)) {
    normalized = `'${normalized}`;
  }
  return `"${normalized.replaceAll('"', '""')}"`;
}

export function toCsv(records: LeadRecord[]): string {
  const columns: Array<[string, (lead: LeadRecord) => string | number | null]> = [
    ["Company", (lead) => lead.companyName],
    ["Domain", (lead) => lead.domain],
    ["Industry", (lead) => lead.industry],
    ["Location", (lead) => lead.location],
    ["Employee count", (lead) => lead.employeeCount],
    ["Revenue", (lead) => lead.revenue],
    ["Revenue currency", (lead) => lead.revenueCurrency],
    ["Opportunity score", (lead) => lead.opportunityScore],
    ["Priority", (lead) => lead.scoreTier],
    ["Top signal", (lead) => lead.topSignal],
    ["Contact name", (lead) => lead.contactName],
    ["Contact title", (lead) => lead.contactTitle],
    ["Contact email", (lead) => lead.contactEmail],
    ["Contact status", (lead) => lead.contactStatus],
  ];
  return [
    columns.map(([label]) => csvCell(label)).join(","),
    ...records.map((lead) =>
      columns.map(([, value]) => csvCell(value(lead))).join(","),
    ),
  ].join("\r\n");
}
