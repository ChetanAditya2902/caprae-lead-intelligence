import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { LeadRecord } from "@/types/lead-record";
import { toCsv } from "./csv";

const lead: LeadRecord = {
  id: "lead-test",
  companyName: '=HYPERLINK("https://invalid.example","Open")',
  website: null,
  domain: "safe.example",
  industry: "Data & analytics",
  subIndustry: null,
  employeeCount: 40,
  revenue: "1000000.00",
  revenueCurrency: "USD",
  location: "Austin, TX",
  country: "US",
  technologies: [],
  hiringSignal: null,
  growthSignal: null,
  fundingSignal: null,
  contactName: 'Synthetic "Contact"',
  contactTitle: "Director",
  contactEmail: "+SUM(1,1)@safe.example",
  emailVerified: false,
  phoneVerified: false,
  opportunityScore: 65,
  scoreTier: "MEDIUM",
  scoreReasons: [],
  topSignal: "Industry fit",
  contactStatus: "Unverified",
};

describe("toCsv", () => {
  it("quotes delimited values and neutralizes spreadsheet formulas", () => {
    const rows = toCsv([lead]).split("\r\n");

    assert.match(rows[0] ?? "", /"Company"/);
    assert.match(rows[1] ?? "", /"'=HYPERLINK\(""https:\/\/invalid\.example"",""Open""\)"/);
    assert.match(rows[1] ?? "", /"Austin, TX"/);
    assert.match(rows[1] ?? "", /"'\+SUM\(1,1\)@safe\.example"/);
  });

  it("returns the CSV header for an empty result", () => {
    const csv = toCsv([]);
    assert.ok(csv.startsWith('"Company","Domain"'));
    assert.equal(csv.split("\r\n").length, 1);
  });
});
